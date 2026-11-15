'use client';

import React, { useState } from 'react';
import { StayWithSettlement } from '@/lib/mock-notices';
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
import { AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface LogNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogNoticeSuccess: (newNotice: StayWithSettlement) => void;
}

export function LogNoticeModal({
  isOpen,
  onClose,
  onLogNoticeSuccess,
}: LogNoticeModalProps) {
  const [residentName, setResidentName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<number>(8500);
  const [securityDeposit, setSecurityDeposit] = useState<number>(17000);
  const [noticeDate, setNoticeDate] = useState('');
  const [vacateDate, setVacateDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const today = new Date();
      setNoticeDate(today.toISOString().slice(0, 10));
      const target = new Date();
      target.setDate(target.getDate() + 30);
      setVacateDate(target.toISOString().slice(0, 10));
    }
  }, [isOpen]);

  // Validate 30-day requirement (FR-5.2)
  const calculateDaysNotice = () => {
    if (!noticeDate || !vacateDate) return 0;
    const n = new Date(noticeDate);
    const v = new Date(vacateDate);
    const diffTime = v.getTime() - n.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysNotice = calculateDaysNotice();
  const isNoticeValid = daysNotice >= 30;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!residentName.trim() || !roomNumber.trim()) {
      toast.error('Please enter resident name and room number');
      return;
    }

    if (!isNoticeValid) {
      toast.error(`Standard notice period is 30 days. Currently only ${daysNotice} days provided.`);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newStay: StayWithSettlement = {
        id: `stay-${Date.now()}`,
        resident_id: `res-${Date.now()}`,
        resident_name: residentName.trim(),
        resident_phone: phoneNumber.trim() || '919876543210',
        room_number: roomNumber.trim().toUpperCase(),
        bed_code: 'A',
        bed_id: `bed-${Date.now()}`,
        move_in_date: '2026-05-01',
        monthly_rent: monthlyRent,
        security_deposit: securityDeposit,
        notice_served_date: noticeDate,
        expected_vacate_date: vacateDate,
        actual_vacate_date: null,
        unpaid_rent: 0,
        utility_dues: 0,
        damage_deductions: 0,
        deposit_refund_amount: null,
        settlement_notes: null,
        deposit_status: 'HELD',
        status: 'NOTICE',
        settled_at: null,
      };

      setIsSubmitting(false);
      toast.success(
        `30-Day Move-out notice logged for ${residentName}! Bed will be available on ${vacateDate}.`
      );
      onLogNoticeSuccess(newStay);
      onClose();

      // Reset
      setResidentName('');
      setRoomNumber('');
      setPhoneNumber('');
    }, 350);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Log 30-Day Move-out Notice</DialogTitle>
              <DialogDescription className="text-xs">
                FR-5.1 & FR-5.2 Notice period validation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nResident" className="text-xs font-semibold">
                  Resident Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="nResident"
                  placeholder="e.g. Vikram Singh"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nRoom" className="text-xs font-semibold">
                  Room Number <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="nRoom"
                  placeholder="e.g. 101 or 201"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nRent" className="text-xs font-semibold">
                  Monthly Rent (₹)
                </Label>
                <Input
                  id="nRent"
                  type="number"
                  min="0"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nDeposit" className="text-xs font-semibold">
                  Security Deposit (₹)
                </Label>
                <Input
                  id="nDeposit"
                  type="number"
                  min="0"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nNoticeDate" className="text-xs font-semibold">
                  Notice Served Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="nNoticeDate"
                  type="date"
                  value={noticeDate}
                  onChange={(e) => setNoticeDate(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nVacateDate" className="text-xs font-semibold">
                  Expected Vacate Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="nVacateDate"
                  type="date"
                  value={vacateDate}
                  onChange={(e) => setVacateDate(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>
            </div>

            {/* Validation Notice Box (FR-5.2) */}
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                isNoticeValid
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {isNoticeValid ? (
                  <Clock className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                <span>
                  Notice Duration: <strong>{daysNotice} days</strong>
                </span>
              </div>
              <span className="font-bold">
                {isNoticeValid ? 'Valid (≥ 30 Days)' : 'Invalid (< 30 Days)'}
              </span>
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
              disabled={isSubmitting || !isNoticeValid}
              className="h-11 sm:h-9 w-full sm:w-auto gap-1.5 font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Log Move-out Notice</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
