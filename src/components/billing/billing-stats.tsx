'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { InvoiceWithResident } from '@/lib/mock-billing';
import { IndianRupee, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface BillingStatsProps {
  invoices: InvoiceWithResident[];
}

export function BillingStats({ invoices }: BillingStatsProps) {
  const totalBilled = invoices.reduce((acc, inv) => acc + inv.total_amount, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.amount_paid, 0);
  const totalPending = totalBilled - totalCollected;

  const paidCount = invoices.filter((inv) => inv.status === 'PAID').length;
  const pendingCount = invoices.filter(
    (inv) => inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID'
  ).length;

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Billed */}
      <Card className="p-3.5 border border-border shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold uppercase tracking-wider">Total Billed</span>
          <IndianRupee className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-foreground">
          ₹{totalBilled.toLocaleString('en-IN')}
        </div>
        <span className="text-[11px] text-muted-foreground mt-0.5">
          {invoices.length} invoices generated
        </span>
      </Card>

      {/* Total Collected */}
      <Card className="p-3.5 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
          <span className="text-[11px] font-bold uppercase tracking-wider">Collected</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-200">
          ₹{totalCollected.toLocaleString('en-IN')}
        </div>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
          {paidCount} fully paid ({collectionRate}%)
        </span>
      </Card>

      {/* Pending Balance */}
      <Card className="p-3.5 border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-rose-700 dark:text-rose-300">
          <span className="text-[11px] font-bold uppercase tracking-wider">Pending Dues</span>
          <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-rose-800 dark:text-rose-200">
          ₹{totalPending.toLocaleString('en-IN')}
        </div>
        <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
          {pendingCount} resident{pendingCount === 1 ? '' : 's'} pending
        </span>
      </Card>

      {/* Collection Efficiency */}
      <Card className="p-3.5 border border-border shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold uppercase tracking-wider">Collection Rate</span>
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {collectionRate}%
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mt-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${collectionRate}%` }}
          />
        </div>
      </Card>
    </div>
  );
}

