"use client"
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function ExportTransactionsButton() {
    return (
        <Button variant="outline" className="gap-2" asChild>
            <a href="/api/reports/export/excel" download>
                <Download size={16} /> Export CSV
            </a>
        </Button>
    )
}
