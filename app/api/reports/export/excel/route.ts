import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionStr = cookieStore.get('pos_auth_session')?.value;
        let role = null;
        if (sessionStr) {
            try {
                const session = await decrypt(sessionStr);
                if (session) {
                    role = session.role;
                }
            } catch (e) {}
        }

        if (role !== 'ADMIN') {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const transactions = await prisma.transaction.findMany({
            include: { cashier: true },
            orderBy: { createdAt: 'desc' }
        });

        const headers = ['Transaction ID', 'Date', 'Cashier', 'Payment Method', 'Subtotal', 'Tax', 'Total', 'Amount Paid', 'Change'];
        
        const csvRows = [
            headers.join(','),
            ...transactions.map(t => [
                t.id,
                t.createdAt.toISOString(),
                t.cashier?.name || 'Unknown',
                t.paymentMethod,
                t.subtotal,
                t.tax,
                t.total,
                t.amountPaid,
                t.change
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="transactions_${new Date().getTime()}.csv"`
            }
        });
    } catch (error) {
        return new NextResponse("Failed to export", { status: 500 });
    }
}
