'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bed, ArrowRight, Layers } from 'lucide-react';

interface OccupancyDistributionProps {
  total: number;
  occupied: number;
  notice: number;
  vacant: number;
  maintenance: number;
}

export function OccupancyDistribution({
  total,
  occupied,
  notice,
  vacant,
  maintenance,
}: OccupancyDistributionProps) {
  const occupiedPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const noticePct = total > 0 ? Math.round((notice / total) * 100) : 0;
  const vacantPct = total > 0 ? Math.round((vacant / total) * 100) : 0;
  const maintenancePct = total > 0 ? Math.round((maintenance / total) * 100) : 0;

  return (
    <Card className="p-4 sm:p-5 border border-border shadow-xs bg-card space-y-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight flex items-center gap-2">
            <Bed className="w-4 h-4 text-primary" />
            Bed Inventory Status
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Physical bed occupancy distribution across 3 floors
          </p>
        </div>

        <Link href="/dashboard/rooms">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary">
            <span>Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Multi-Segmented Progress Bar */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded-md overflow-hidden flex shadow-inner">
          {/* Occupied */}
          <div
            style={{ width: `${occupiedPct}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`Occupied: ${occupied} beds (${occupiedPct}%)`}
          />
          {/* Notice */}
          <div
            style={{ width: `${noticePct}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Notice: ${notice} beds (${noticePct}%)`}
          />
          {/* Vacant */}
          <div
            style={{ width: `${vacantPct}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Vacant: ${vacant} beds (${vacantPct}%)`}
          />
          {/* Maintenance */}
          <div
            style={{ width: `${maintenancePct}%` }}
            className="bg-slate-400 transition-all duration-500"
            title={`Maintenance: ${maintenance} beds (${maintenancePct}%)`}
          />
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          {/* Occupied */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="font-medium text-rose-900 dark:text-rose-200">Occupied</span>
            </div>
            <span className="font-bold text-rose-700 dark:text-rose-300">
              {occupied} ({occupiedPct}%)
            </span>
          </div>

          {/* Notice Period */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="font-medium text-amber-900 dark:text-amber-200">In Notice</span>
            </div>
            <span className="font-bold text-amber-700 dark:text-amber-300">
              {notice} ({noticePct}%)
            </span>
          </div>

          {/* Vacant */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-900 dark:text-emerald-200">Vacant</span>
            </div>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {vacant} ({vacantPct}%)
            </span>
          </div>

          {/* Maintenance */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Maintenance</span>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {maintenance} ({maintenancePct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
        <span>Total Physical Capacity:</span>
        <span className="font-bold text-foreground">{total} Beds Across 6 Rooms</span>
      </div>
    </Card>
  );
}

