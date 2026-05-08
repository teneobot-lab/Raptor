"use server"
import { prisma } from "@/lib/db";
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
        totalRevenue, monthRevenue, todayRevenue,
        totalSales, monthSales, todaySales,
        productsCount, lowStockCount, usersCount,
        recentTransactions, topProducts, paymentBreakdown
    ] = await Promise.all([
        prisma.transaction.aggregate({ _sum: { total: true } }),
        prisma.transaction.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { total: true } }),
        prisma.transaction.aggregate({ where: { createdAt: { gte: startOfToday } }, _sum: { total: true } }),
        prisma.transaction.count(),
        prisma.transaction.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.transaction.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { isActive: true, stock: { lte: 5 } } }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.transaction.findMany({
            where: { createdAt: { gte: last7Days } },
            orderBy: { createdAt: 'desc' },
            take: 50
        }),
        prisma.transactionItem.groupBy({
            by: ['productName'],
            where: { transaction: { createdAt: { gte: startOfMonth } } },
            _sum: { quantity: true, subtotal: true },
            orderBy: { _sum: { subtotal: 'desc' } },
            take: 5
        }),
        prisma.transaction.groupBy({
            by: ['paymentMethod'],
            where: { createdAt: { gte: startOfMonth } },
            _sum: { total: true },
            _count: { id: true }
        })
    ]);

    // Build daily chart for last 7 days
    const dailyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dailyMap[d.toISOString().slice(0, 10)] = 0;
    }
    recentTransactions.forEach(t => {
        const day = t.createdAt.toISOString().slice(0, 10);
        if (dailyMap[day] !== undefined) dailyMap[day] += t.total;
    });
    const chartData = Object.entries(dailyMap).map(([date, total]) => ({
        date,
        name: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
        total
    }));

    return {
        revenue: { total: totalRevenue._sum.total || 0, month: monthRevenue._sum.total || 0, today: todayRevenue._sum.total || 0 },
        sales: { total: totalSales, month: monthSales, today: todaySales },
        productsCount, lowStockCount, usersCount,
        chartData, topProducts, paymentBreakdown
    };
}
