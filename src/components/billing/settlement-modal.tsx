'use client';

import React, { useState, useEffect } from 'react';
import { InvoiceWithResident, PaymentRecord } from '@/lib/mock-billing';
import type { PaymentMethod } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IndianRupee, CheckCircle2, QrCode, Banknote, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { recordPaymentAction } from '@/app/actions/dashboard';

interface SettlementModalProps {
  invoice: InvoiceWithResident | null;
  isOpen: boolean;
  onClose: () => void;
  onSettlementSuccess: (updatedInvoice: InvoiceWithResident) => void;
}

export function SettlementModal({
  invoice,
  isOpen,
  onClose,
  onSettlementSuccess,
}: SettlementModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.balance_due);
      setMethod('UPI');
      setReference('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
    }
  }, [invoice]);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    if (amount > invoice.balance_due) {
      toast.error(`Amount cannot exceed remaining balance of ₹${invoice.balance_due.toLocaleString('en-IN')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      await recordPaymentAction({
        invoiceId: invoice.id,
        amount: amount,
        method: method,
        reference: reference.trim() || `${method} Settlement`,
      });
    } catch (dbErr) {
      console.warn('DB record payment fallback:', dbErr);
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      amount: amount,
      method: method,
      reference: reference.trim() || `${method} Settlement`,
      paid_at: new Date().toISOString(),
    };

    const updatedPayments = [...invoice.payments, newPayment];
    const newAmountPaid = invoice.amount_paid + amount;
    const newBalanceDue = Math.max(0, invoice.total_amount - newAmountPaid);
    const newStatus = newBalanceDue === 0 ? 'PAID' : 'PARTIALLY_PAID';

    const updatedInvoice: InvoiceWithResident = {
      ...invoice,
      amount_paid: newAmountPaid,
      balance_due: newBalanceDue,
      status: newStatus,
      paid_at: newStatus === 'PAID' ? new Date().toISOString() : invoice.paid_at,
      payments: updatedPayments,
    };

    setIsSubmitting(false);
    toast.success(
      `Payment of ₹${amount.toLocaleString('en-IN')} recorded for ${invoice.resident_name}!`,
      {
        description: newBalanceDue === 0 ? 'Invoice is now fully paid.' : `Remaining balance: ₹${newBalanceDue.toLocaleString('en-IN')}`,
      }
    );
    onSettlementSuccess(updatedInvoice);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Record Rent Payment</DialogTitle>
              <DialogDescription className="text-xs">
                INV-{invoice.invoice_number} • Room {invoice.room_number} (Bed {invoice.bed_code})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Invoice Summary Box */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Resident:</span>
              <span className="text-xs font-bold text-foreground">{invoice.resident_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Invoiced:</span>
              <span className="text-xs font-semibold text-foreground">
                ₹{invoice.total_amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Already Paid:</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{invoice.amount_paid.toLocaleString('en-IN')}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">Outstanding Balance:</span>
              <span className="font-black text-rose-600 dark:text-rose-400">
                ₹{invoice.balance_due.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment Form Fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="settlementAmount" className="text-xs font-semibold">
                  Amount Received (₹) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="settlementAmount"
                  type="number"
                  min="1"
                  max={invoice.balance_due}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  className="h-10 text-sm font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="paymentMethod" className="text-xs font-semibold">
                  Payment Method <span className="text-rose-500">*</span>
                </Label>
                <Select value={method} onValueChange={(val) => setMethod(val as PaymentMethod)}>
                  <SelectTrigger id="paymentMethod" className="h-10 text-xs">
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI (GPay / PhonePe / QR)</SelectItem>
                    <SelectItem value="CASH">Cash at Desk</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer (IMPS / NEFT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="reference" className="text-xs font-semibold">
                  Reference / UTR / Note
                </Label>
                <Input
                  id="reference"
                  placeholder={method === 'UPI' ? 'UPI UTR / Ref No' : 'Receipt / Cash Note'}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="paymentDate" className="text-xs font-semibold">
                  Payment Date
                </Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
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
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-11 sm:h-9 w-full sm:w-auto gap-1.5 font-bold"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Mark Settled</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

