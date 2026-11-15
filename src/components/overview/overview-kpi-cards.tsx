'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { IndianRupee, CheckCircle2, AlertCircle, Percent, ArrowUpRight } from 'lucide-react';

interface OverviewKpiCardsProps {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  occupancyRate: number;
  occupiedBeds: number;
  totalBeds: number;
}

export function OverviewKpiCards({
  totalExpected,
  totalCollected,
  totalPending,
  occupancyRate,
  occupiedBeds,
  totalBeds,
}: OverviewKpiCardsProps) {
  const collectionPercentage =
    totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Monthly Expected Revenue */}
      <Card className="p-4 border border-border shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold uppercase tracking-wider">Expected Revenue</span>
          <IndianRupee className="w-4 h-4 text-primary" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-foreground">
          ₹{totalExpected.toLocaleString('en-IN')}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
          <ArrowUpRight className="w-3 h-3" />
          <span>+8.2% vs last month</span>
        </div>
      </Card>

      {/* 2. Total Collected */}
      <Card className="p-4 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
          <span className="text-[11px] font-bold uppercase tracking-wider">Collected</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-200">
          ₹{totalCollected.toLocaleString('en-IN')}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-full bg-emerald-200 dark:bg-emerald-800/50 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
            {collectionPercentage}%
          </span>
        </div>
      </Card>

      {/* 3. Pending Collections */}
      <Card className="p-4 border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-rose-700 dark:text-rose-300">
          <span className="text-[11px] font-bold uppercase tracking-wider">Pending Dues</span>
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-rose-800 dark:text-rose-200">
          ₹{totalPending.toLocaleString('en-IN')}
        </div>
        <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
          Requires payment reminders
        </span>
      </Card>

      {/* 4. Bed Occupancy Rate */}
      <Card className="p-4 border border-border shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold uppercase tracking-wider">Occupancy Rate</span>
          <Percent className="w-4 h-4 text-primary" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {occupancyRate}%
        </div>
        <span className="text-[11px] text-muted-foreground mt-1 font-medium">
          {occupiedBeds} of {totalBeds} active beds occupied
        </span>
      </Card>
    </div>
  );
}

