import { getProducts } from "@/actions/product.actions";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProductFormDialog } from "@/components/products/product-form-dialog";

export default async function ProductsPage({ searchParams }: { searchParams: { search?: string } }) {
    const products = await getProducts(searchParams.search);

    return (
        <div className="flex-1 flex flex-col pt-8">
            <div className="px-8 pb-4 flex items-center justify-between">
                <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your inventory and pricing.</p>
                </div>
                <ProductFormDialog />
            </div>

            <div className="px-8 flex-1 overflow-hidden">
                <Card className="h-full flex flex-col">
                    <div className="p-4 border-b">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input placeholder="Search products..." className="pl-9" defaultValue={searchParams.search} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Barcode</th>
                                    <th className="px-6 py-3 font-medium">Name</th>
                                    <th className="px-6 py-3 font-medium">Category</th>
                                    <th className="px-6 py-3 font-medium text-right">Price</th>
                                    <th className="px-6 py-3 font-medium text-right">Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="px-6 py-3 font-mono text-xs">{product.barcode}</td>
                                        <td className="px-6 py-3 font-medium text-slate-900">{product.name}</td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">${product.price.toFixed(2)}</td>
                                        <td className="px-6 py-3 text-right">{product.stock}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    )
}
