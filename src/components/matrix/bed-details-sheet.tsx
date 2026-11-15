'use client';

import React from 'react';
import { BedWithOccupant } from '@/lib/mock-data';
import { BED_STATUS_CONFIG, INVOICE_STATUS_CONFIG } from '@/lib/constants';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Receipt,
  MessageSquare,
  Wrench,
  LogOut,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface BedDetailsSheetProps {
  bed: BedWithOccupant | null;
  isOpen: boolean;
  onClose: () => void;
  onVacateBed: (bedId: string) => void;
  onToggleNotice: (bedId: string) => void;
}

export function BedDetailsSheet({
  bed,
  isOpen,
  onClose,
  onVacateBed,
  onToggleNotice,
}: BedDetailsSheetProps) {
  if (!bed) return null;

  const stay = bed.stay;
  const statusConfig = BED_STATUS_CONFIG[bed.status];

  const handleCopyUpiLink = () => {
    if (!stay?.invoice) return;
    const upiString = `upi://pay?pa=greennest@okhdfcbank&pn=GreenNestPG&am=${stay.invoice.total_amount}&tr=INV-${stay.invoice.invoice_number}&cu=INR`;
    navigator.clipboard.writeText(upiString);
    toast.success('UPI payment link copied to clipboard!', {
      description: upiString,
    });
  };

  const handleOpenWhatsApp = () => {
    if (!stay?.resident_phone) return;
    window.open(`https://wa.me/${stay.resident_phone}`, '_blank');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-bold">
                Room {bed.room_number} • Bed {bed.bed_code}
              </SheetTitle>
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold uppercase ${statusConfig.borderClass} ${statusConfig.textClass}`}
              >
                {statusConfig.label}
              </Badge>
            </div>
          </div>
          <SheetDescription className="text-xs">
            {bed.floor_label} • {bed.sharing_type} Sharing • Base: ₹
            {bed.base_rent.toLocaleString('en-IN')}/mo
          </SheetDescription>
        </SheetHeader>

        {stay ? (
          <div className="py-4 space-y-5">
            {/* Resident Card */}
            <div className="p-3.5 bg-muted/30 rounded-xl border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {stay.resident_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{stay.resident_name}</h4>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {stay.resident_phone.replace(/^91/, '+91 ')}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenWhatsApp}
                  className="h-8 gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </Button>
              </div>

              {stay.resident_email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{stay.resident_email}</span>
                </div>
              )}

              {stay.emergency_contact && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Emergency: {stay.emergency_contact}</span>
                </div>
              )}
            </div>

            {/* Financial & Stay Terms */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Stay & Deposit Terms
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block text-[11px]">Monthly Rent</span>
                  <span className="font-bold text-sm text-foreground">
                    ₹{stay.monthly_rent.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block text-[11px]">Deposit Held</span>
                  <span className="font-bold text-sm text-foreground">
                    ₹{stay.security_deposit.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-card col-span-2 flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Move-in Date
                  </span>
                  <span className="font-semibold text-foreground">{stay.move_in_date}</span>
                </div>
              </div>
            </div>

            {/* Latest Rent Invoice Status */}
            {stay.invoice && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Current Billing Cycle
                </h5>
                <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-semibold">
                        INV-{stay.invoice.invoice_number}
                      </span>
                    </div>
                    <Badge
                      className={`text-[10px] font-bold ${
                        INVOICE_STATUS_CONFIG[stay.invoice.status].bgClass
                      }`}
                    >
                      {stay.invoice.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">Outstanding Due:</span>
                    <span className="font-bold text-sm text-foreground">
                      ₹{stay.invoice.total_amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="pt-1 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUpiLink}
                      className="w-full text-xs gap-1.5 h-10 sm:h-8 font-semibold"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Copy UPI Intent</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Notice Period Section */}
            {bed.status === 'NOTICE_PERIOD' ? (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">30-Day Move-out Notice Active</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Expected Vacate Date:{' '}
                  <strong>{stay.expected_vacate_date ?? 'Within 30 days'}</strong>
                </p>
                <div className="pt-1 flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      onVacateBed(bed.id);
                      onClose();
                    }}
                    className="w-full text-xs gap-1.5 h-10 sm:h-8 font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Complete Checkout & Vacate</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onToggleNotice(bed.id);
                    onClose();
                  }}
                  className="w-full text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 h-10 sm:h-8 font-semibold"
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  <span>Log 30-Day Move-out Notice</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onVacateBed(bed.id);
                    onClose();
                  }}
                  className="w-full text-xs text-rose-600 hover:bg-rose-50 border-rose-200 h-10 sm:h-8 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  <span>Direct Checkout & Vacate Bed</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground space-y-3">
            <p>This bed is currently {bed.status.toLowerCase()}.</p>
            {bed.status === 'MAINTENANCE' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onVacateBed(bed.id);
                  onClose();
                }}
              >
                Release from Maintenance
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
