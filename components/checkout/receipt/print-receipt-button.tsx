"use client"
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { ReceiptTemplate } from './receipt-template';

interface PrintReceiptButtonProps {
    transaction: any;
}

export function PrintReceiptButton({ transaction }: PrintReceiptButtonProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Receipt-${transaction?.id || 'POS'}`,
    });

    return (
        <div>
            <div className="hidden">
                <ReceiptTemplate transaction={transaction} ref={receiptRef} />
            </div>
            <Button className="w-full gap-2" variant="outline" onClick={() => handlePrint()}>
                <Printer size={16} /> Print Receipt
            </Button>
        </div>
    );
}
