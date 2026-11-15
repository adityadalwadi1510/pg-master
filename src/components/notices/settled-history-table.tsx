'use client';

import React from 'react';
import { StayWithSettlement } from '@/lib/mock-notices';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShieldCheck, Calendar } from 'lucide-react';

interface SettledHistoryTableProps {
  stays: StayWithSettlement[];
}

export function SettledHistoryTable({ stays }: SettledHistoryTableProps) {
  if (stays.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-xl text-xs text-muted-foreground">
        No completed checkouts yet.
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-3 px-4">Resident</th>
              <th className="py-3 px-4">Room / Bed</th>
              <th className="py-3 px-4">Stay Duration</th>
              <th className="py-3 px-4 text-right">Deposit Held</th>
              <th className="py-3 px-4 text-right">Total Deductions</th>
              <th className="py-3 px-4 text-right">Net Refunded</th>
              <th className="py-3 px-4">Settlement Notes</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stays.map((stay) => {
              const totalDeductions =
                stay.unpaid_rent + stay.utility_dues + stay.damage_deductions;

              return (
                <tr key={stay.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-foreground block">{stay.resident_name}</span>
                    <span className="text-[10px] text-muted-foreground">{stay.resident_phone}</span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-[10px]">
                      Room {stay.room_number}-{stay.bed_code}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                    <span>{stay.move_in_date}</span>
                    <span className="mx-1">→</span>
                    <span className="text-foreground font-medium">
                      {stay.actual_vacate_date ?? stay.expected_vacate_date}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-medium whitespace-nowrap">
                    ₹{stay.security_deposit.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-right font-medium text-rose-600 whitespace-nowrap">
                    - ₹{totalDeductions.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    ₹{(stay.deposit_refund_amount ?? 0).toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                    {stay.settlement_notes || 'Deposit cleared.'}
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                      Settled
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

