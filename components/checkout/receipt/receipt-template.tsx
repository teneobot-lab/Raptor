import React, { forwardRef } from 'react';
import { format } from 'date-fns';

export interface ReceiptProps {
    transaction: any;
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(({ transaction }, ref) => {
    if (!transaction) return null;

    return (
        <div ref={ref} className="w-[300px] bg-white p-4 font-mono text-sm text-black mx-auto">
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold mb-1">NodePOS Pro</h1>
                <p className="text-xs">123 Business Street</p>
                <p className="text-xs">Tech District, 10010</p>
                <p className="text-xs mt-2">Tel: (555) 123-4567</p>
            </div>
            
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 text-xs">
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{format(new Date(transaction.createdAt || new Date()), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                    <span>Receipt:</span>
                    <span>{transaction.id?.slice(-8).toUpperCase() || '000000'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>Admin</span>
                </div>
            </div>

            <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-left">
                            <th className="font-normal w-2/3">Item</th>
                            <th className="font-normal text-center w-1/6">Qty</th>
                            <th className="font-normal text-right w-1/6">Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transaction.items?.map((item: any) => (
                            <tr key={item.productId || typeof item === 'object' ? item.id : Math.random()}>
                                <td className="py-1 break-words pr-2">{item.productName || item.name}</td>
                                <td className="py-1 text-center">{item.quantity}</td>
                                <td className="py-1 text-right">${(item.subtotal || (item.price * item.quantity)).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-1 text-xs">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${transaction.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>${transaction.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                    <span>Total:</span>
                    <span>${transaction.total?.toFixed(2)}</span>
                </div>
            </div>

            <div className="border-b border-dashed border-gray-400 pb-2 mb-6 space-y-1 text-xs">
                <div className="flex justify-between">
                    <span>Paid (Cash):</span>
                    <span>${transaction.amountPaid?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Change:</span>
                    <span>${transaction.change?.toFixed(2)}</span>
                </div>
            </div>

            <div className="text-center text-xs">
                <p className="font-bold mb-1">Thank you for your business!</p>
                <p>Please come again.</p>
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${transaction.id || 'receipt'}`} 
                    alt="Receipt QR" 
                    className="mx-auto mt-4 w-16 h-16" 
                />
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
