'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { BedWithOccupant } from '@/lib/mock-data';
import { Bed, UserCheck, UserMinus, Wrench, Percent } from 'lucide-react';

interface MatrixStatsProps {
  beds: BedWithOccupant[];
}

export function MatrixStats({ beds }: MatrixStatsProps) {
  const total = beds.length;
  const vacant = beds.filter((b) => b.status === 'VACANT').length;
  const occupied = beds.filter((b) => b.status === 'OCCUPIED').length;
  const notice = beds.filter((b) => b.status === 'NOTICE_PERIOD').length;
  const maintenance = beds.filter((b) => b.status === 'MAINTENANCE').length;

  const occupancyRate = total > 0 ? Math.round(((occupied + notice) / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Total Beds */}
      <Card className="p-3 border border-border shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">Total Beds</span>
          <Bed className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{total}</div>
        <span className="text-[11px] text-muted-foreground">Across all floors</span>
      </Card>

      {/* Vacant Beds */}
      <Card className="p-3 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
          <span className="text-xs font-medium uppercase tracking-wider">Vacant</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="mt-2 text-2xl font-bold text-emerald-800 dark:text-emerald-200">{vacant}</div>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Ready for check-in</span>
      </Card>

      {/* Occupied Beds */}
      <Card className="p-3 border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-rose-700 dark:text-rose-300">
          <span className="text-xs font-medium uppercase tracking-wider">Occupied</span>
          <UserCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="mt-2 text-2xl font-bold text-rose-800 dark:text-rose-200">{occupied}</div>
        <span className="text-[11px] text-rose-600 dark:text-rose-400">Active residents</span>
      </Card>

      {/* Notice Period */}
      <Card className="p-3 border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
          <span className="text-xs font-medium uppercase tracking-wider">In Notice</span>
          <UserMinus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="mt-2 text-2xl font-bold text-amber-800 dark:text-amber-200">{notice}</div>
        <span className="text-[11px] text-amber-600 dark:text-amber-400">Next 30 days vacating</span>
      </Card>

      {/* Maintenance */}
      <Card className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span className="text-xs font-medium uppercase tracking-wider">Maintenance</span>
          <Wrench className="w-4 h-4 text-slate-500" />
        </div>
        <div className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-200">{maintenance}</div>
        <span className="text-[11px] text-slate-500">Temporarily blocked</span>
      </Card>

      {/* Occupancy Rate */}
      <Card className="p-3 border border-border shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">Occupancy</span>
          <Percent className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{occupancyRate}%</div>
        <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
      </Card>
    </div>
  );
}

