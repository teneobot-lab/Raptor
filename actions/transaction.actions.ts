"use server"

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export interface TransactionItemInput {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export async function createTransaction(data: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    amountPaid: number;
    change: number;
    paymentMethod: string;
    items: TransactionItemInput[];
    cashierId?: string;
}) {
    // Basic validation
    if (data.total < 0) throw new Error("Total cannot be negative");

    let cId = data.cashierId;
    if (!cId) {
        const cookieStore = await cookies();
        const sessionStr = cookieStore.get('pos_auth_session')?.value;
        if (sessionStr) {
            try {
                const session = await decrypt(sessionStr);
                if (session) {
                    cId = session.id;
                }
            } catch (e) {}
        }
    }
    
    if (!cId) {
        throw new Error("Unauthorized");
    }

    // Use transaction to prevent race condition
    const t = await prisma.$transaction(async (tx) => {
        // Decrement stock first to ensure availability
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
                subtotal: data.subtotal,
                tax: data.tax,
                discount: data.discount,
                total: data.total,
                amountPaid: data.amountPaid,
                change: data.change,
                paymentMethod: data.paymentMethod,
                cashier: { connect: { id: cId } },
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
            include: {
                items: true
            }
        });
    });

    revalidatePath("/checkout");
    revalidatePath("/products");
    revalidatePath("/transactions");
    
    return t;
}

export async function getTransactions() {
    return prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            items: true,
            cashier: true
        }
    });
}
