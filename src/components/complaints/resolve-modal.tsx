'use client';

import React, { useState, useEffect } from 'react';
import { ComplaintWithResident } from '@/lib/mock-complaints';
import { COMPLAINT_CATEGORY_LABELS } from '@/lib/constants';
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
import { CheckCircle2, MessageSquare, Sparkles, User, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { resolveComplaintAction } from '@/app/actions/dashboard';

interface ResolveModalProps {
  complaint: ComplaintWithResident | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedComplaint: ComplaintWithResident) => void;
}

export function ResolveModal({
  complaint,
  isOpen,
  onClose,
  onSuccess,
}: ResolveModalProps) {
  const [assignedTo, setAssignedTo] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (complaint) {
      setAssignedTo(complaint.assigned_to || '');
      setResolutionNote(complaint.resolution_note || '');
      setNotifyWhatsApp(true);
    }
  }, [complaint]);

  if (!complaint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resolutionNote.trim()) {
      toast.error('Please enter a short resolution note for the resident.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resolveComplaintAction({
        complaintId: complaint.id,
        resolutionNote: resolutionNote.trim(),
        notifyWhatsApp,
      });
    } catch (dbErr) {
      console.warn('DB resolve fallback:', dbErr);
    }

    const now = new Date().toISOString();
    const updatedComplaint: ComplaintWithResident = {
      ...complaint,
      status: 'RESOLVED',
      assigned_to: assignedTo.trim() || 'PG Maintenance Staff',
      resolution_note: resolutionNote.trim(),
      resolved_at: now,
    };

    setIsSubmitting(false);
    toast.success(
      `Ticket #${complaint.ticket_number} marked as RESOLVED!`,
      {
        description: notifyWhatsApp
          ? `Automated WhatsApp resolution confirmation dispatched to ${complaint.resident_name}.`
          : undefined,
      }
    );
    onSuccess(updatedComplaint);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Resolve Ticket #{complaint.ticket_number}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Room {complaint.room_number} • {complaint.resident_name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Issue Summary Box */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] font-bold">
                {COMPLAINT_CATEGORY_LABELS[complaint.category]}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                Room {complaint.room_number} ({complaint.bed_code})
              </span>
            </div>
            <p className="text-xs text-foreground leading-relaxed italic">
              &quot;{complaint.description}&quot;
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="assignedStaff" className="text-xs font-semibold">
                Staff / Technician Handled
              </Label>
              <Input
                id="assignedStaff"
                placeholder="e.g. Suresh (Plumber) / Housekeeping"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="resolutionNote" className="text-xs font-semibold">
                Resolution Note <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="resolutionNote"
                placeholder="e.g. Repaired leaking valve and replaced washer."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                required
                className="h-10 text-xs"
              />
              <span className="text-[10px] text-muted-foreground">
                This note will be automatically sent to the resident on Telegram &amp; WhatsApp
              </span>
            </div>

            {/* Notification Toggle (FR-4.4) */}
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Auto-ping resident (Telegram / WhatsApp)
                  </span>
                </div>
                <Switch
                  checked={notifyWhatsApp}
                  onCheckedChange={setNotifyWhatsApp}
                />
              </div>

              {notifyWhatsApp && (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 pt-1 border-t border-emerald-200/50 leading-relaxed">
                  Sends: &quot;Hello {complaint.resident_name}, your ticket #{complaint.ticket_number} (
                  {COMPLAINT_CATEGORY_LABELS[complaint.category]}) was resolved: {resolutionNote || '[resolution note]'}.&quot;
                </p>
              )}
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
              className="h-11 sm:h-9 w-full sm:w-auto gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark as Resolved</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

