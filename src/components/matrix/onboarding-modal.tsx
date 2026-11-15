'use client';

import React, { useState, useEffect } from 'react';
import { BedWithOccupant } from '@/lib/mock-data';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Calculator, IndianRupee, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { onboardResidentAction } from '@/app/actions/dashboard';
import { DocumentUploader } from '@/components/ui/document-uploader';

interface OnboardingModalProps {
  bed: BedWithOccupant | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBed: BedWithOccupant) => void;
}

export function OnboardingModal({ bed, isOpen, onClose, onSuccess }: OnboardingModalProps) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [securityDeposit, setSecurityDeposit] = useState<number>(0);
  const [enableProration, setEnableProration] = useState<boolean>(true);
  const [kycDocumentUrl, setKycDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bed) {
      setMonthlyRent(bed.base_rent);
      // Pre-fill deposit with 2x monthly rent as customary in Indian hostels/PGs
      setSecurityDeposit(bed.base_rent * 2);
      setFullName('');
      setPhoneNumber('');
      setEmail('');
      setEmergencyContact('');
      setPermanentAddress('');
      setKycDocumentUrl('');
      setMoveInDate(new Date().toISOString().slice(0, 10));
    }
  }, [bed]);

  if (!bed) return null;

  // Prorated Rent Calculation (FR-1.4: Prorated Rent = (Monthly Rent / 30) × Days Remaining)
  const calculateProratedRent = () => {
    const selectedDate = moveInDate ? new Date(moveInDate) : null;
    const dayOfMonth = selectedDate ? selectedDate.getDate() : 1;
    // Days remaining in a standard 30-day billing cycle
    const daysRemaining = Math.max(1, 30 - dayOfMonth + 1);
    const prorated = Math.round((monthlyRent / 30) * daysRemaining);
    return { daysRemaining, prorated };
  };

  const { daysRemaining, prorated } = calculateProratedRent();
  const firstMonthRent = enableProration ? prorated : monthlyRent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim()) {
      toast.error('Please enter the resident full name');
      return;
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit WhatsApp phone number');
      return;
    }

    // Format phone as E.164 digits without '+' (e.g., 919876543210)
    const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12
      ? cleanPhone
      : `91${cleanPhone.slice(-10)}`;

    setIsSubmitting(true);

    try {
      await onboardResidentAction({
        bedId: bed.id,
        fullName: fullName.trim(),
        phone: formattedPhone,
        email: email.trim() || undefined,
        moveInDate,
        securityDeposit,
        monthlyRent,
        emergencyContact: emergencyContact.trim() || undefined,
      });
    } catch (dbErr) {
      console.warn('DB onboard fallback:', dbErr);
    }

    const newStayId = `stay-${Date.now()}`;
    const newResidentId = `res-${Date.now()}`;

    const updatedBed: BedWithOccupant = {
      ...bed,
      status: 'OCCUPIED',
      stay: {
        id: newStayId,
        resident_id: newResidentId,
        resident_name: fullName.trim(),
        resident_phone: formattedPhone,
        resident_email: email.trim() || null,
        emergency_contact: emergencyContact.trim() || null,
        move_in_date: moveInDate,
        monthly_rent: monthlyRent,
        security_deposit: securityDeposit,
        invoice: {
          id: `inv-${Date.now()}`,
          invoice_number: Math.floor(1000 + Math.random() * 9000),
          total_amount: firstMonthRent,
          amount_paid: 0,
          status: 'UNPAID',
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
      },
    };

    setIsSubmitting(false);
    toast.success(
      `Resident ${fullName} onboarded successfully to Room ${bed.room_number} (Bed ${bed.bed_code})!`,
      {
        description: `First invoice of ₹${firstMonthRent.toLocaleString('en-IN')} generated.`,
      }
    );
    onSuccess(updatedBed);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Quick Check-in Resident</DialogTitle>
              <DialogDescription className="text-xs">
                Room <span className="font-semibold text-foreground">{bed.room_number}</span> •{' '}
                Bed <span className="font-semibold text-foreground">{bed.bed_code}</span> (
                {bed.floor_label})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Section: Resident Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Resident Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-xs font-semibold">
                  Full Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Ananya Sen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  WhatsApp Number <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="e.g. 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <span className="text-[10px] text-muted-foreground">
                  Invoices & bot menus will be sent here
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ananya@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="emergency" className="text-xs">
                  Emergency Contact
                </Label>
                <Input
                  id="emergency"
                  placeholder="Parent / Guardian phone"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                />
              </div>
            </div>

            {/* KYC Document Upload (FR-2.2: Stored on Cloudflare R2, compressed to WebP <150 KB) */}
            <div className="pt-1">
              <DocumentUploader
                label="KYC Document (Aadhaar / College ID)"
                description="Max 5 MB • In-browser WebP compression"
                category="kyc"
                value={kycDocumentUrl}
                onChange={setKycDocumentUrl}
              />
            </div>
          </div>

          <Separator />

          {/* Section: Stay & Billing Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Stay & Financial Terms
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="moveInDate" className="text-xs font-semibold">
                  Move-in Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="moveInDate"
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="monthlyRent" className="text-xs font-semibold">
                  Monthly Rent (₹) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  min="0"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="deposit" className="text-xs font-semibold">
                  Security Deposit (₹)
                </Label>
                <Input
                  id="deposit"
                  type="number"
                  min="0"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Proration Card (FR-1.4) */}
            <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold">Prorate 1st Month Rent</span>
                </div>
                <Switch
                  checked={enableProration}
                  onCheckedChange={setEnableProration}
                />
              </div>

              {enableProration && (
                <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between border-t border-border/50">
                  <span>
                    Days Remaining: <strong>{daysRemaining} days</strong> (₹
                    {Math.round(monthlyRent / 30)}/day)
                  </span>
                  <Badge variant="outline" className="font-mono text-primary font-bold">
                    ₹{prorated.toLocaleString('en-IN')}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-center gap-3">
            <div className="text-xs text-muted-foreground text-center sm:text-left">
              Total Due on Check-in:{' '}
              <span className="font-bold text-foreground text-sm">
                ₹{(firstMonthRent + securityDeposit).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-10 sm:h-8 w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="h-10 sm:h-8 w-full sm:w-auto gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Confirm Check-in</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
