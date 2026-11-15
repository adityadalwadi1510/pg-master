'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { MONTHLY_TREND_DATA } from '@/lib/mock-overview';
import { TrendingUp, BarChart3 } from 'lucide-react';

export function CollectionTrendChart() {
  const maxVal = Math.max(...MONTHLY_TREND_DATA.map((d) => d.billed));

  return (
    <Card className="p-4 sm:p-5 border border-border shadow-xs bg-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Revenue & Collection Trends
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Billed Rent vs Actual Collections (Last 6 Months)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 dark:bg-slate-700" />
            <span className="text-[11px]">Billed</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span className="text-[11px]">Collected</span>
          </div>
        </div>
      </div>

      {/* Responsive Bar Chart (Pure CSS / Lightweight SVG) */}
      <div className="pt-2">
        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 sm:h-52 border-b border-border/80 pb-2">
          {MONTHLY_TREND_DATA.map((item) => {
            const billedHeight = Math.round((item.billed / maxVal) * 100);
            const collectedHeight = Math.round((item.collected / maxVal) * 100);

            return (
              <div key={item.month} className="flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full px-1">
                  {/* Billed Bar */}
                  <div
                    className="w-1/2 max-w-[16px] bg-slate-200 dark:bg-slate-800 rounded-t-sm transition-all duration-300 group-hover:opacity-80 relative"
                    style={{ height: `${billedHeight}%` }}
                    title={`Billed: ₹${item.billed.toLocaleString('en-IN')}`}
                  />
                  {/* Collected Bar */}
                  <div
                    className="w-1/2 max-w-[16px] bg-emerald-500 dark:bg-emerald-600 rounded-t-sm transition-all duration-300 group-hover:bg-emerald-400 relative"
                    style={{ height: `${collectedHeight}%` }}
                    title={`Collected: ₹${item.collected.toLocaleString('en-IN')}`}
                  />
                </div>
                {/* Month Label */}
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground mt-2">
                  {item.month}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/80 hidden sm:block">
                  ₹{(item.collected / 1000).toFixed(0)}k
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footnote KPI */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
        <span>Historical Average Collection Rate:</span>
        <span className="font-bold text-foreground">96.4%</span>
      </div>
    </Card>
  );
}

