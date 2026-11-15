'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { RECENT_ACTIVITIES } from '@/lib/mock-overview';
import {
  Activity,
  CheckCircle2,
  Clock,
  MessageSquareWarning,
  UserPlus,
  IndianRupee,
} from 'lucide-react';

const TYPE_ICONS = {
  PAYMENT: IndianRupee,
  COMPLAINT: MessageSquareWarning,
  NOTICE: Clock,
  CHECKIN: UserPlus,
};

const TYPE_BG = {
  PAYMENT: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
  COMPLAINT: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
  NOTICE: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
  CHECKIN: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
};

export function RecentActivity() {
  return (
    <Card className="p-4 sm:p-5 border border-border shadow-xs bg-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Live Property Activity
        </h3>
        <span className="text-xs text-muted-foreground">Automated Logs</span>
      </div>

      <div className="space-y-3">
        {RECENT_ACTIVITIES.map((act) => {
          const Icon = TYPE_ICONS[act.type] || Activity;
          const bgClass = TYPE_BG[act.type] || 'bg-muted text-foreground';

          return (
            <div
              key={act.id}
              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors border border-border/40"
            >
              <div className={`p-2 rounded-lg shrink-0 ${bgClass}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-foreground truncate">{act.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{act.timeAgo}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {act.description}
                </p>
              </div>

              {act.amount && (
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    +₹{act.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

