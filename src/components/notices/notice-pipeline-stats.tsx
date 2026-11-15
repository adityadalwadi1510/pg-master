'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { StayWithSettlement } from '@/lib/mock-notices';
import { Clock, ShieldAlert, IndianRupee, CheckCircle2 } from 'lucide-react';

interface NoticePipelineStatsProps {
  stays: StayWithSettlement[];
}

export function NoticePipelineStats({ stays }: NoticePipelineStatsProps) {
  const activeNotices = stays.filter((s) => s.status === 'NOTICE');
  const completedStays = stays.filter((s) => s.status === 'COMPLETED');

  const totalDepositHeld = activeNotices.reduce((acc, s) => acc + s.security_deposit, 0);
  const totalUnpaidDues = activeNotices.reduce((acc, s) => acc + s.unpaid_rent + s.utility_dues, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Active Notices */}
      <Card className="p-3.5 border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
          <span className="text-[11px] font-bold uppercase tracking-wider">30-Day Pipeline</span>
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-200">
          {activeNotices.length} Beds
        </div>
        <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
          Vacating within 30 days
        </span>
      </Card>

      {/* Security Deposit Held */}
      <Card className="p-3.5 border border-border shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold uppercase tracking-wider">Deposits in Notice</span>
          <ShieldAlert className="w-4 h-4 text-primary" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-foreground">
          ₹{totalDepositHeld.toLocaleString('en-IN')}
        </div>
        <span className="text-[11px] text-muted-foreground mt-0.5">
          Pending move-out clearance
        </span>
      </Card>

      {/* Unpaid Dues to Deduct */}
      <Card className="p-3.5 border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-rose-700 dark:text-rose-300">
          <span className="text-[11px] font-bold uppercase tracking-wider">Unpaid Dues</span>
          <IndianRupee className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-rose-800 dark:text-rose-200">
          ₹{totalUnpaidDues.toLocaleString('en-IN')}
        </div>
        <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
          Auto-deducted at checkout
        </span>
      </Card>

      {/* Settled Checkouts */}
      <Card className="p-3.5 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
          <span className="text-[11px] font-bold uppercase tracking-wider">Settled Checkouts</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-200">
          {completedStays.length}
        </div>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
          Deposits cleared & refunded
        </span>
      </Card>
    </div>
  );
}

