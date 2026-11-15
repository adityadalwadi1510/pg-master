'use client';

import React from 'react';
import { InvoiceWithResident } from '@/lib/mock-billing';
import { INVOICE_STATUS_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IndianRupee,
  MessageSquare,
  CheckCircle2,
  Copy,
  Receipt,
  Phone,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';

interface InvoicesTableProps {
  invoices: InvoiceWithResident[];
  onOpenSettlement: (invoice: InvoiceWithResident) => void;
  onOpenQr?: (invoice: InvoiceWithResident) => void;
}

export function InvoicesTable({ invoices, onOpenSettlement, onOpenQr }: InvoicesTableProps) {
  const handleCopyUpiLink = (invoice: InvoiceWithResident) => {
    const upiString = `upi://pay?pa=greennest@okhdfcbank&pn=GreenNestPG&am=${invoice.balance_due}&tr=INV-${invoice.invoice_number}&cu=INR`;
    navigator.clipboard.writeText(upiString);
    toast.success('UPI Payment Link copied to clipboard!', {
      description: upiString,
    });
  };

  const handleOpenWhatsApp = (invoice: InvoiceWithResident) => {
    const message = encodeURIComponent(
      `Hello ${invoice.resident_name}, your rent invoice INV-${invoice.invoice_number} of ₹${invoice.balance_due} for Room ${invoice.room_number} is pending. Please complete your payment via UPI: upi://pay?pa=greennest@okhdfcbank&pn=GreenNestPG&am=${invoice.balance_due}&tr=INV-${invoice.invoice_number}&cu=INR`
    );
    window.open(`https://wa.me/${invoice.resident_phone}?text=${message}`, '_blank');
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-3 px-4">Invoice</th>
              <th className="py-3 px-4">Resident</th>
              <th className="py-3 px-4">Room / Bed</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-right">Paid</th>
              <th className="py-3 px-4 text-right">Balance</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((inv) => {
              const statusConfig = INVOICE_STATUS_CONFIG[inv.status];
              const isPaid = inv.status === 'PAID';

              return (
                <tr
                  key={inv.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {/* Invoice # */}
                  <td className="py-3 px-4 font-mono font-semibold text-foreground whitespace-nowrap">
                    INV-{inv.invoice_number}
                  </td>

                  {/* Resident Info */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-foreground block">{inv.resident_name}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" />
                      {inv.resident_phone.replace(/^91/, '+91 ')}
                    </span>
                  </td>

                  {/* Room / Bed */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-[10px] font-medium">
                      Room {inv.room_number} ({inv.bed_code})
                    </Badge>
                  </td>

                  {/* Total */}
                  <td className="py-3 px-4 text-right font-medium text-foreground whitespace-nowrap">
                    ₹{inv.total_amount.toLocaleString('en-IN')}
                  </td>

                  {/* Paid */}
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    ₹{inv.amount_paid.toLocaleString('en-IN')}
                  </td>

                  {/* Balance */}
                  <td className="py-3 px-4 text-right font-black whitespace-nowrap">
                    <span className={isPaid ? 'text-muted-foreground' : 'text-rose-600 dark:text-rose-400'}>
                      ₹{inv.balance_due.toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Due Date */}
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    {inv.due_date}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <Badge className={`text-[10px] font-bold px-2 py-0.5 ${statusConfig.bgClass}`}>
                      {inv.status}
                    </Badge>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isPaid ? (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onOpenSettlement(inv)}
                            className="h-7 text-[11px] px-2.5 gap-1 font-semibold"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Settle</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenQr ? onOpenQr(inv) : handleCopyUpiLink(inv)}
                            className="h-7 w-7 p-0 text-primary border-primary/30 hover:bg-primary/10"
                            title="Show UPI QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenWhatsApp(inv)}
                            className="h-7 w-7 p-0 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            title="Send WhatsApp Ping"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyUpiLink(inv)}
                            className="h-7 w-7 p-0"
                            title="Copy UPI Deep-Link"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold px-2">
                          Settled
                        </span>
                      )}
                    </div>
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

