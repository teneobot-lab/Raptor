import { getTransactions } from "@/actions/transaction.actions";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExportTransactionsButton } from "@/components/transactions/export-button";

export default async function TransactionsPage() {
    const transactions = await getTransactions();

    return (
        <div className="flex-1 flex flex-col pt-8">
            <div className="px-8 pb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Transactions</h1>
                    <p className="text-slate-500 text-sm mt-1">View your sales history.</p>
                </div>
                <ExportTransactionsButton />
            </div>
            
            <div className="px-8 flex-1 overflow-hidden">
                <Card className="h-full flex flex-col">
                    <div className="p-4 border-b">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input placeholder="Search transactions..." className="pl-9" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Tx ID</th>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Cashier</th>
                                    <th className="px-6 py-3 font-medium">Method</th>
                                    <th className="px-6 py-3 font-medium text-right">Items</th>
                                    <th className="px-6 py-3 font-medium text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? transactions.map(t => (
                                    <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="px-6 py-3 font-mono text-xs">{t.id}</td>
                                        <td className="px-6 py-3">{format(new Date(t.createdAt), "PPp")}</td>
                                        <td className="px-6 py-3">{t.cashier?.name || 'Unknown'}</td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase text-slate-600">
                                                {t.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">{t.items.length}</td>
                                        <td className="px-6 py-3 text-right font-medium">${t.total.toFixed(2)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center text-slate-500">No transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
