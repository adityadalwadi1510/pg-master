'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ComplaintWithResident } from '@/lib/mock-complaints';
import { MessageSquareWarning, Clock, Wrench, CheckCircle2 } from 'lucide-react';

interface ComplaintsStatsProps {
  complaints: ComplaintWithResident[];
}

export function ComplaintsStats({ complaints }: ComplaintsStatsProps) {
  const total = complaints.length;
  const openCount = complaints.filter((c) => c.status === 'OPEN').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Tickets */}
      <Card className="p-3.5 border border-border shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold uppercase tracking-wider">Total Tickets</span>
          <MessageSquareWarning className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {total}
        </div>
        <span className="text-[11px] text-muted-foreground mt-0.5">All resident tickets</span>
      </Card>

      {/* Open Tickets */}
      <Card className="p-3.5 border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
          <span className="text-[11px] font-bold uppercase tracking-wider">Open (Pending)</span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-200">
          {openCount}
        </div>
        <span className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 font-medium">
          Requires assignment
        </span>
      </Card>

      {/* In Progress */}
      <Card className="p-3.5 border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-blue-700 dark:text-blue-300">
          <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
          <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-blue-800 dark:text-blue-200">
          {inProgressCount}
        </div>
        <span className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
          Being resolved by staff
        </span>
      </Card>

      {/* Resolved */}
      <Card className="p-3.5 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
          <span className="text-[11px] font-bold uppercase tracking-wider">Resolved</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-200">
          {resolvedCount} ({resolutionRate}%)
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mt-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${resolutionRate}%` }}
          />
        </div>
      </Card>
    </div>
  );
}

