"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getProducts } from '@/actions/product.actions';
import { createTransaction } from '@/actions/transaction.actions';
import { PrintReceiptButton } from '@/components/checkout/receipt/print-receipt-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    barcode: string;
    category: string;
}

interface CartItem extends Product {
    quantity: number;
}

export default function CheckoutPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [successReceipt, setSuccessReceipt] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [discountAmount, setDiscountAmount] = useState<string>('');

    useEffect(() => {
        getProducts(search).then(data => setProducts(data));
    }, [search]);

    const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    const filteredProducts = products.filter(p => !selectedCategory || p.category === selectedCategory);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && search) {
            const matchingProduct = products.find(p => 
                p.barcode === search || p.name.toLowerCase() === search.toLowerCase()
            );
            if (matchingProduct) {
                addToCart(matchingProduct);
                setSearch(''); // Clear after scan
            } else {
                toast.error("Product not found");
            }
        }
    };

    // ... keeping the rest inside unmodified mostly
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast.error(`Only ${product.stock} in stock!`);
                    return prev;
                }
                toast.success(`Added another ${product.name} to cart`);
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            toast.success(`Added ${product.name} to cart`);
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQ = item.quantity + delta;
                if (newQ > item.stock) {
                    toast.error(`Only ${item.stock} in stock!`);
                    return item;
                }
                return newQ > 0 ? { ...item, quantity: newQ } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discount = parseFloat(discountAmount) || 0;
    const discountedTotal = Math.max(0, subtotal - discount);
    const tax = discountedTotal * 0.1;
    const total = discountedTotal + tax;
    
    const parsedCash = parseFloat(cashReceived) || 0;
    const change = paymentMethod === 'CASH' ? parsedCash - total : 0;
    const isReadyToCheckout = cart.length > 0 && !isCheckingOut && (paymentMethod === 'CARD' || parsedCash >= total);

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        try {
            const data = {
                subtotal,
                tax,
                discount, // Make sure to pass this
                total,
                amountPaid: paymentMethod === 'CASH' ? parsedCash : total,
                change: Math.max(0, change),
                paymentMethod,
                items: cart
            };
            const result = await createTransaction(data as any);
            setSuccessReceipt(result);
            toast.success("Checkout completed successfully!");
            setCart([]);
            setCashReceived('');
            setDiscountAmount('');
        } catch (error: any) {
            toast.error(error.message || "Failed to checkout");
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="flex h-full bg-slate-50">
            {/* Success Dialog */}
            <AnimatePresence>
                {!!successReceipt && (
                    <Dialog open={true} onOpenChange={(open) => !open && setSuccessReceipt(null)}>
                        <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-8">
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"
                            >
                                <CheckCircle2 size={40} />
                            </motion.div>
                            <DialogHeader>
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <DialogTitle className="text-2xl text-center">Payment Successful!</DialogTitle>
                                    <DialogDescription className="text-center text-lg mt-2">
                                        You successfully charged <span className="font-bold text-slate-900">${successReceipt?.total?.toFixed(2)}</span> via {successReceipt?.paymentMethod}
                                    </DialogDescription>
                                </motion.div>
                            </DialogHeader>
                            
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex gap-4 w-full mt-8"
                            >
                                <Button variant="outline" className="flex-1" onClick={() => setSuccessReceipt(null)}>
                                    New Sale
                                </Button>
                                <div className="flex-1">
                                    <PrintReceiptButton transaction={successReceipt} />
                                </div>
                            </motion.div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>

            {/* Products Layout */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="mb-6 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input 
                            className="pl-10 h-12 text-lg shadow-sm" 
                            placeholder="Scan barcode or search product..." 
                            autoFocus 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>
                </div>

                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button 
                        variant={selectedCategory === null ? "default" : "outline"}
                        className="rounded-full"
                        onClick={() => setSelectedCategory(null)}
                    >
                        All
                    </Button>
                    {categories.map(cat => (
                        <Button 
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            className="rounded-full whitespace-nowrap"
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-auto pb-6">
                    {filteredProducts.map(product => (
                        <motion.div 
                            key={product.id}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ y: -4 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                            <Card className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all h-full relative" onClick={() => addToCart(product)}>
                                {product.stock > 0 && product.stock <= 5 && (
                                    <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-md font-bold shadow-sm">
                                        Low: {product.stock}
                                    </div>
                                )}
                                {product.stock === 0 && (
                                    <div className="absolute top-2 right-2 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md font-bold shadow-sm">
                                        Out of stock
                                    </div>
                                )}
                                <CardContent className={`p-4 flex flex-col items-center text-center ${product.stock === 0 ? 'opacity-50' : ''}`}>
                                    <div className="h-24 w-24 bg-slate-100 rounded-md mb-3 flex items-center justify-center transition-transform group-hover:scale-105">
                                        <Package size={32} className="text-slate-400" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 line-clamp-2">{product.name}</h3>
                                    <p className="text-blue-600 font-bold mt-1">${product.price.toFixed(2)}</p>
                                    <p className="text-xs text-slate-500 mt-2">{product.stock} in stock</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Cart Layout */}
            <div className="w-[400px] bg-white border-l flex flex-col shadow-xl z-10">
                <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                    <ShoppingBag className="text-blue-600" />
                    <h2 className="font-bold text-lg text-slate-800">Current Order ({cart.length})</h2>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                            <ShoppingBag size={48} className="opacity-20" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm relative">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-900 truncate">{item.name}</h4>
                                    <p className="text-sm font-bold text-blue-600 mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)}>
                                        <Minus size={14} />
                                    </Button>
                                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)}>
                                        <Plus size={14} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 ml-1" onClick={() => removeFromCart(item.id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t space-y-4 z-20">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                            <span>Discount</span>
                            <div className="w-24 relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <Input 
                                    className="h-8 pl-6 text-right"
                                    type="number"
                                    placeholder="0"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Tax (10%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 mt-4">
                        <Button variant={paymentMethod === 'CASH' ? 'default' : 'outline'} className={paymentMethod === 'CASH' ? 'bg-blue-600' : 'bg-white'} onClick={() => setPaymentMethod('CASH')}>
                            <Banknote className="mr-2" /> Cash
                        </Button>
                        <Button variant={paymentMethod === 'CARD' ? 'default' : 'outline'} className={paymentMethod === 'CARD' ? 'bg-blue-600' : 'bg-white'} onClick={() => setPaymentMethod('CARD')}>
                            <CreditCard className="mr-2" /> Card
                        </Button>
                    </div>

                    {paymentMethod === 'CASH' && (
                        <div className="pt-3 animate-in slide-in-from-top-2 fade-in">
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Amount Received ($)</label>
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={cashReceived} 
                                onChange={e => setCashReceived(e.target.value)} 
                                className="h-12 text-lg text-right"
                            />
                            {parsedCash > 0 && (
                                <div className="flex justify-between items-center mt-2 text-sm">
                                    <span className="text-slate-500">Change Due:</span>
                                    <span className={change >= 0 ? "font-bold text-emerald-600" : "font-semibold text-red-500"}>
                                        ${change >= 0 ? change.toFixed(2) : "0.00"}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <Button 
                        className="w-full h-14 text-lg font-bold mt-4" 
                        disabled={!isReadyToCheckout}
                        onClick={handleCheckout}
                    >
                        {isCheckingOut ? 'Processing...' : `Charge $${total.toFixed(2)}`}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function Package(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
}
