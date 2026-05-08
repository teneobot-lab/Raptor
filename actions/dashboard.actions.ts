"use server"
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

async function verifyAdmin() {
    const cookieStore = await cookies();
    const sessionStr = cookieStore.get('pos_auth_session')?.value;
    if (!sessionStr) throw new Error("Unauthorized");
    const session = await decrypt(sessionStr);
    if (!session || session.role !== 'ADMIN') throw new Error("Unauthorized");
}

export async function getDashboardStats() {
    await verifyAdmin();
    const productsCount = await prisma.product.count();
    const usersCount = await prisma.user.count();
    const totalTransactions = await prisma.transaction.aggregate({
        _sum: { total: true },
        _count: { id: true }
    });
    const revenue = totalTransactions._sum.total || 0;
    const salesCount = totalTransactions._count.id || 0;
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentTransactions = await prisma.transaction.findMany({
        where: { createdAt: { gte: last7Days } }
    });
    const daysMap = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].reduce((acc, curr) => ({...acc, [curr]: 0}), {} as Record<string, number>);
    recentTransactions.forEach(t => {
        const day = format(new Date(t.createdAt), 'E');
        if (daysMap[day] !== undefined) {
            daysMap[day] += t.total;
        }
    });
    const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chartData = orderedDays.map(key => ({ name: key, total: daysMap[key] }));
    return { revenue, salesCount, productsCount, usersCount, chartData }
}
