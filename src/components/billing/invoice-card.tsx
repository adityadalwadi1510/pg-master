'use client';

import React from 'react';
import { InvoiceWithResident } from '@/lib/mock-billing';
import { INVOICE_STATUS_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  IndianRupee,
  Calendar,
  Phone,
  MessageSquare,
  CheckCircle2,
  Receipt,
  Copy,
  ChevronRight,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceCardProps {
  invoice: InvoiceWithResident;
  onOpenSettlement: (invoice: InvoiceWithResident) => void;
  onOpenQr?: (invoice: InvoiceWithResident) => void;
}

export function InvoiceCard({ invoice, onOpenSettlement, onOpenQr }: InvoiceCardProps) {
  const statusConfig = INVOICE_STATUS_CONFIG[invoice.status];
  const isPaid = invoice.status === 'PAID';

  const handleCopyUpiLink = () => {
    const upiString = `upi://pay?pa=greennest@okhdfcbank&pn=GreenNestPG&am=${invoice.balance_due}&tr=INV-${invoice.invoice_number}&cu=INR`;
    navigator.clipboard.writeText(upiString);
    toast.success('UPI Payment Link copied to clipboard!', {
      description: upiString,
    });
  };

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent(
      `Hello ${invoice.resident_name}, your rent invoice INV-${invoice.invoice_number} of ₹${invoice.balance_due} for Room ${invoice.room_number} is pending. Please complete your payment via UPI: upi://pay?pa=greennest@okhdfcbank&pn=GreenNestPG&am=${invoice.balance_due}&tr=INV-${invoice.invoice_number}&cu=INR`
    );
    window.open(`https://wa.me/${invoice.resident_phone}?text=${message}`, '_blank');
  };

  return (
    <Card className="p-4 border border-border/80 shadow-xs hover:border-border transition-colors bg-card space-y-3">
      {/* Header: Resident, Room, and Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground tracking-tight">
              {invoice.resident_name}
            </h3>
            <Badge variant="outline" className="text-[10px] font-semibold">
              Room {invoice.room_number} ({invoice.bed_code})
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Receipt className="w-3 h-3 text-muted-foreground" />
            <span>INV-{invoice.invoice_number}</span>
            <span>•</span>
            <Phone className="w-3 h-3 text-muted-foreground" />
            <span>{invoice.resident_phone.replace(/^91/, '+91 ')}</span>
          </span>
        </div>

        <Badge className={`text-[10px] font-bold px-2 py-0.5 ${statusConfig.bgClass}`}>
          {invoice.status}
        </Badge>
      </div>

      {/* Financial Details Box */}
      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase font-medium">Billed</span>
          <span className="text-xs font-bold text-foreground">
            ₹{invoice.total_amount.toLocaleString('en-IN')}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase font-medium">Paid</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            ₹{invoice.amount_paid.toLocaleString('en-IN')}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase font-medium">Balance</span>
          <span
            className={`text-xs font-black ${
              isPaid ? 'text-muted-foreground' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            ₹{invoice.balance_due.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Due Date & Last Paid Date */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Due: {invoice.due_date}</span>
        </span>
        {isPaid && invoice.paid_at && (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            Paid on {invoice.paid_at.slice(0, 10)}
          </span>
        )}
      </div>

      <Separator />

      {/* Touch-Friendly Action Buttons (Minimum 44px for thumb tap) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
        {!isPaid ? (
          <>
            <Button
              size="sm"
              onClick={() => onOpenSettlement(invoice)}
              className="h-11 sm:h-9 w-full gap-1.5 font-bold text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Payment</span>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenWhatsApp}
                className="h-11 sm:h-9 w-full gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenQr ? onOpenQr(invoice) : handleCopyUpiLink()}
                className="h-11 sm:h-9 w-full gap-1 text-xs"
              >
                <QrCode className="w-3.5 h-3.5 text-primary" />
                <span>UPI QR</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="col-span-2 flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settlement Completed
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyUpiLink}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              View Receipt
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

