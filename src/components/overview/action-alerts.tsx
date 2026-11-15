'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Receipt,
  MessageSquareWarning,
  Clock,
  ArrowRight,
  Send,
  Wrench,
  CheckCircle,
} from 'lucide-react';

interface ActionAlertsProps {
  unpaidCount: number;
  unpaidAmount: number;
  openComplaintsCount: number;
  activeNoticesCount: number;
}

export function ActionAlerts({
  unpaidCount,
  unpaidAmount,
  openComplaintsCount,
  activeNoticesCount,
}: ActionAlertsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Attention Needed Today
        </h3>
        <span className="text-xs text-muted-foreground">Actionable Items</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Unpaid Rent Alert */}
        <Card className="p-3.5 border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-rose-900 dark:text-rose-200">
                  {unpaidCount} Pending Rent Invoices
                </h4>
                <span className="text-[11px] text-rose-700 dark:text-rose-300">
                  ₹{unpaidAmount.toLocaleString('en-IN')} uncollected
                </span>
              </div>
            </div>
          </div>

          <Link href="/dashboard/billing">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-10 sm:h-8 justify-between border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300 hover:bg-rose-100/50"
            >
              <span>Send WhatsApp Pings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>

        {/* Open Complaints Alert */}
        <Card className="p-3.5 border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                <MessageSquareWarning className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                  {openComplaintsCount} Open Ticket{openComplaintsCount === 1 ? '' : 's'}
                </h4>
                <span className="text-[11px] text-amber-700 dark:text-amber-300">
                  Wi-Fi & electrical issues
                </span>
              </div>
            </div>
          </div>

          <Link href="/dashboard/complaints">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-10 sm:h-8 justify-between border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100/50"
            >
              <span>Review & Assign Staff</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>

        {/* Notice Pipeline Alert */}
        <Card className="p-3.5 border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-foreground">
                  {activeNoticesCount} Upcoming Vacancies
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  30-day pipeline move-outs
                </span>
              </div>
            </div>
          </div>

          <Link href="/dashboard/notices">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-10 sm:h-8 justify-between hover:bg-muted"
            >
              <span>View Vacancy Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}

