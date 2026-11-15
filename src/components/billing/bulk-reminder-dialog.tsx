'use client';

import React, { useState } from 'react';
import { InvoiceWithResident } from '@/lib/mock-billing';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, CheckCircle, IndianRupee, Smartphone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface BulkReminderDialogProps {
  pendingInvoices: InvoiceWithResident[];
  isOpen: boolean;
  onClose: () => void;
}

export function BulkReminderDialog({
  pendingInvoices,
  isOpen,
  onClose,
}: BulkReminderDialogProps) {
  const [isSending, setIsSending] = useState(false);

  const totalOutstanding = pendingInvoices.reduce((acc, inv) => acc + inv.balance_due, 0);

  const handleSendBulkReminders = () => {
    setIsSending(true);

    setTimeout(() => {
      setIsSending(false);
      toast.success(
        `Dispatched ${pendingInvoices.length} WhatsApp rent reminders with UPI deep-links!`,
        {
          description: `Total pending amount reminded: ₹${totalOutstanding.toLocaleString('en-IN')}`,
        }
      );
      onClose();
    }, 800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Bulk WhatsApp Reminders</DialogTitle>
              <DialogDescription className="text-xs">
                Meta WhatsApp Cloud API Utility Template
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Summary Box */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block">Recipients (Pending Dues)</span>
              <span className="text-xl font-black text-foreground">
                {pendingInvoices.length} Residents
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Total Outstanding</span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                ₹{totalOutstanding.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* WhatsApp Template Message Preview */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-primary" />
              WhatsApp Message Preview
            </span>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-foreground space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-1.5">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  GreenNest Living PG • Rent Due
                </span>
                <Badge variant="outline" className="text-[9px] py-0 border-emerald-400 text-emerald-700">
                  Utility Template
                </Badge>
              </div>

              <p className="leading-relaxed text-muted-foreground">
                Dear <strong>{'{resident_name}'}</strong>, your rent invoice for Room{' '}
                <strong>{'{room_number}'}</strong> is pending.
              </p>

              <div className="p-2 bg-background/80 rounded-lg border border-emerald-200/50 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span className="font-mono font-semibold">INV-1001</span>
                </div>
                <div className="flex justify-between font-bold text-foreground">
                  <span>Balance Due:</span>
                  <span className="text-rose-600">₹{'{balance_due}'}</span>
                </div>
              </div>

              <div className="pt-1">
                <div className="w-full py-1.5 px-3 rounded-md bg-emerald-600 text-white font-semibold text-center text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-not-allowed">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Pay via UPI (Dynamic Link)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recipient List Preview */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Recipient Breakdown
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {pendingInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-border bg-card text-xs"
                >
                  <div>
                    <span className="font-semibold text-foreground block">{inv.resident_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      Room {inv.room_number} • {inv.resident_phone.replace(/^91/, '+91 ')}
                    </span>
                  </div>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    ₹{inv.balance_due.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-11 sm:h-9 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSending || pendingInvoices.length === 0}
            onClick={handleSendBulkReminders}
            className="h-11 sm:h-9 w-full sm:w-auto gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="w-4 h-4" />
            <span>Send {pendingInvoices.length} WhatsApp Pings</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

