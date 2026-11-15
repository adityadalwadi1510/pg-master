'use client';

import React, { useState } from 'react';
import { generateInvoicesAction } from '@/app/actions/dashboard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface GenerateInvoicesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GenerateInvoicesDialog({
  isOpen,
  onClose,
  onSuccess,
}: GenerateInvoicesDialogProps) {
  const [selectedMonth, setSelectedMonth] = useState('2026-11-01');
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    createdCount: number;
    skippedCount: number;
    notificationsSent: number;
    totalBilledAmount: number;
  } | null>(null);

  const handleRun = async () => {
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await generateInvoicesAction({
        billingMonth: selectedMonth,
        dispatchWhatsApp: notifyWhatsApp,
      });

      if (res.success) {
        setResult({
          createdCount: res.createdCount,
          skippedCount: res.skippedCount,
          notificationsSent: res.notificationsSent,
          totalBilledAmount: res.totalBilledAmount,
        });

        toast.success(
          `Generated ${res.createdCount} new invoices for ${selectedMonth}!`,
          {
            description: `${res.skippedCount} stays already had invoices. Total billed: ₹${res.totalBilledAmount.toLocaleString('en-IN')}`,
          }
        );
        onSuccess();
      } else {
        toast.error('Invoice generation failed: ' + (res.errors[0] || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Invoice run failed:', err);
      toast.error('Failed to trigger invoice generation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Generate Monthly Invoices</DialogTitle>
              <DialogDescription className="text-xs">
                Batch invoicing for all ACTIVE & NOTICE stays (FR-3.1 & FR-3.2)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Target Month */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Billing Cycle Month</Label>
            <Select value={selectedMonth} onValueChange={(val) => { if (val) setSelectedMonth(val); }}>
              <SelectTrigger className="h-10 text-xs font-semibold">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-11-01">November 2026 (Current Month)</SelectItem>
                <SelectItem value="2026-12-01">December 2026 (Next Month)</SelectItem>
                <SelectItem value="2026-10-01">October 2026 (Past Month)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Invoices are automatically tagged with a due date on the 5th of this month.
            </p>
          </div>

          {/* WhatsApp Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <Label htmlFor="notifyWhatsApp" className="text-xs font-bold cursor-pointer">
                  WhatsApp Bill Notification
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sends pre-approved utility bill template with dynamic UPI link.
              </p>
            </div>
            <Switch
              id="notifyWhatsApp"
              checked={notifyWhatsApp}
              onCheckedChange={setNotifyWhatsApp}
            />
          </div>

          {/* Safety Notice */}
          <div className="rounded-xl border border-border/80 p-3 bg-muted/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Idempotent Execution (Safe to re-run)</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              The database constraint <code>UNIQUE (stay_id, billing_month)</code> prevents duplicate bills if run multiple times.
            </p>
          </div>

          {/* Results Summary if Run */}
          {result && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Batch Generation Complete!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">New Invoices: </span>
                  <span className="font-bold text-foreground">{result.createdCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Already Existed: </span>
                  <span className="font-bold text-foreground">{result.skippedCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Billed: </span>
                  <span className="font-bold text-foreground">₹{result.totalBilledAmount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">WhatsApp Sent: </span>
                  <span className="font-bold text-foreground">{result.notificationsSent}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between pt-3 gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-10 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={isSubmitting}
            className="h-10 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Invoices...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Generate Invoices Now</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
