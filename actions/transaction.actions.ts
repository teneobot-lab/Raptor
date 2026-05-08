"use server"
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

async function getSession() {
    const cookieStore = await cookies();
    const sessionStr = cookieStore.get('pos_auth_session')?.value;
    if (!sessionStr) throw new Error("Unauthorized");
    const session = await decrypt(sessionStr);
    if (!session) throw new Error("Unauthorized");
    return session;
}

function generateInvoiceNo(): string {
    const now = new Date();
    const date = now.toISOString().slice(0,10).replace(/-/g,'');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `INV-${date}-${rand}`;
}

export async function createTransaction(data: {
    subtotal: number; tax: number; discount: number; total: number;
    amountPaid: number; change: number; paymentMethod: string;
    notes?: string;
    items: { id: string; name: string; price: number; quantity: number }[];
}) {
    if (data.total < 0) throw new Error("Total cannot be negative");
    const session = await getSession();

    const t = await prisma.$transaction(async (tx) => {
        for (const item of data.items) {
            const product = await tx.product.findUnique({ where: { id: item.id } });
            if (!product || product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}`);
            }
            await tx.product.update({
                where: { id: item.id },
                data: { stock: { decrement: item.quantity } }
            });
        }
        return await tx.transaction.create({
            data: {
                invoiceNo: generateInvoiceNo(),
                subtotal: data.subtotal,
                tax: data.tax,
                discount: data.discount,
                total: data.total,
                amountPaid: data.amountPaid,
                change: data.change,
                paymentMethod: data.paymentMethod,
                notes: data.notes,
                cashier: { connect: { id: session.id } },
                items: {
                    create: data.items.map(item => ({
                        productId: item.id,
                        productName: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        subtotal: item.price * item.quantity
                    }))
                }
            },
            include: { items: true, cashier: { select: { name: true } } }
        });
    });

    revalidatePath("/checkout");
    revalidatePath("/products");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return t;
}

export async function getTransactions(search?: string, from?: string, to?: string) {
    const where: any = {};
    if (search) {
        where.OR = [
            { invoiceNo: { contains: search } },
            { cashier: { name: { contains: search } } }
        ];
    }
    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to + 'T23:59:59');
    }
    return prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { items: true, cashier: { select: { name: true, email: true } } }
    });
}

export async function getTransactionById(id: string) {
    return prisma.transaction.findUnique({
        where: { id },
        include: { items: { include: { product: true } }, cashier: true }
    });
}

export async function getReportStats(period: 'today' | 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let from: Date;
    if (period === 'today') {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
        from = new Date(now.getFullYear(), 0, 1);
    }

    const [transactions, topProducts, paymentBreakdown] = await Promise.all([
        prisma.transaction.findMany({
            where: { createdAt: { gte: from } },
            include: { items: true }
        }),
        prisma.transactionItem.groupBy({
            by: ['productName'],
            where: { transaction: { createdAt: { gte: from } } },
            _sum: { quantity: true, subtotal: true },
            orderBy: { _sum: { subtotal: 'desc' } },
            take: 5
        }),
        prisma.transaction.groupBy({
            by: ['paymentMethod'],
            where: { createdAt: { gte: from } },
            _sum: { total: true },
            _count: { id: true }
        })
    ]);

    const revenue = transactions.reduce((a, t) => a + t.total, 0);
    const salesCount = transactions.length;
    const avgOrder = salesCount > 0 ? revenue / salesCount : 0;

    // Daily chart
    const dailyMap: Record<string, number> = {};
    transactions.forEach(t => {
        const day = t.createdAt.toISOString().slice(0, 10);
        dailyMap[day] = (dailyMap[day] || 0) + t.total;
    });
    const chartData = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => ({ date, total }));

    return { revenue, salesCount, avgOrder, topProducts, paymentBreakdown, chartData, from, to: now };
}
