'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { InvoiceWithResident } from '@/lib/mock-billing';
import { getInvoiceUpiAction } from '@/app/actions/dashboard';
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
import {
  QrCode,
  IndianRupee,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface UpiQrDialogProps {
  invoice: InvoiceWithResident | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UpiQrDialog({ invoice, isOpen, onClose }: UpiQrDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [upiUri, setUpiUri] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (invoice && isOpen) {
      setIsLoading(true);
      getInvoiceUpiAction({
        invoiceNumber: invoice.invoice_number,
        totalOutstanding: invoice.balance_due,
      })
        .then((res) => {
          setQrDataUrl(res.qrDataUrl);
          setUpiUri(res.upiUri);
        })
        .catch((err) => {
          console.error('Failed to get UPI details:', err);
          toast.error('Could not generate UPI link');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const handleCopy = () => {
    if (!upiUri) return;
    navigator.clipboard.writeText(upiUri);
    setIsCopied(true);
    toast.success('UPI payment link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[420px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Instant UPI QR Code</DialogTitle>
              <DialogDescription className="text-xs">
                Scan with GPay, PhonePe, Paytm, or BHIM
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Invoice Summary Pill */}
        <div className="rounded-xl border border-border p-3.5 bg-muted/40 space-y-2 mt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">{invoice.resident_name}</span>
            <Badge variant="outline" className="text-[11px] font-bold">
              INV-{invoice.invoice_number}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Room {invoice.room_number} ({invoice.bed_code})</span>
            <span>Due: {invoice.due_date}</span>
          </div>
          <div className="pt-1 flex items-baseline justify-between border-t border-border/60">
            <span className="text-xs font-semibold text-muted-foreground">Amount Due</span>
            <span className="text-xl font-black text-foreground tracking-tight">
              ₹{invoice.balance_due.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-border/80 shadow-xs my-1">
          {isLoading ? (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
              Generating secure UPI QR...
            </div>
          ) : qrDataUrl ? (
            <div className="space-y-2 text-center">
              <div className="relative w-48 h-48 mx-auto p-1 bg-white rounded-lg shadow-xs">
                <Image
                  src={qrDataUrl}
                  alt={`UPI QR Code for Invoice ${invoice.invoice_number}`}
                  width={192}
                  height={192}
                  className="rounded-md"
                  unoptimized
                />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>NPCI Verified UPI Intent</span>
              </div>
            </div>
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-rose-500">
              Failed to generate QR
            </div>
          )}
        </div>

        {/* Mobile-Friendly Direct Payment Button (Deep Links on Phone) */}
        <div className="space-y-2 pt-1">
          <a
            href={upiUri}
            className="w-full inline-block"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              className="w-full h-11 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              disabled={!upiUri}
            >
              <Smartphone className="w-4 h-4" />
              <span>Open in UPI App (GPay / PhonePe)</span>
              <ExternalLink className="w-3.5 h-3.5 ml-auto" />
            </Button>
          </a>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="w-full h-10 text-xs font-semibold gap-1.5"
            disabled={!upiUri}
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'UPI Link Copied!' : 'Copy Raw UPI Link'}</span>
          </Button>
        </div>

        <DialogFooter className="sm:justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-9 text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

