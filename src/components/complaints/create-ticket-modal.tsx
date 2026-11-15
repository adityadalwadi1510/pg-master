'use client';

import React, { useState } from 'react';
import { ComplaintWithResident } from '@/lib/mock-complaints';
import { COMPLAINT_CATEGORY_LABELS } from '@/lib/constants';
import type { ComplaintCategory } from '@/types/database';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentUploader } from '@/components/ui/document-uploader';
import { createComplaintAction } from '@/app/actions/dashboard';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: (newComplaint: ComplaintWithResident) => void;
}

export function CreateTicketModal({
  isOpen,
  onClose,
  onCreateSuccess,
}: CreateTicketModalProps) {
  const [residentName, setResidentName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('WIFI');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!residentName.trim() || !roomNumber.trim() || !description.trim()) {
      toast.error('Please fill in resident name, room number, and description.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newTicketNumber = Math.floor(100 + Math.random() * 900);
      const newTicket: ComplaintWithResident = {
        id: `comp-${Date.now()}`,
        ticket_number: newTicketNumber,
        stay_id: `stay-${Date.now()}`,
        resident_name: residentName.trim(),
        resident_phone: phoneNumber.trim() || '919876543210',
        room_number: roomNumber.trim().toUpperCase(),
        bed_code: 'A',
        category: category,
        description: description.trim(),
        photo_url: photoUrl.trim() || null,
        assigned_to: assignedTo.trim() || null,
        resolution_note: null,
        status: 'OPEN',
        resolved_at: null,
        created_at: new Date().toISOString(),
      };

      setIsSubmitting(false);
      toast.success(`Complaint #${newTicketNumber} logged successfully!`);
      onCreateSuccess(newTicket);
      onClose();

      // Reset form
      setResidentName('');
      setRoomNumber('');
      setPhoneNumber('');
      setDescription('');
      setAssignedTo('');
      setPhotoUrl('');
    }, 350);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Log Maintenance Ticket</DialogTitle>
              <DialogDescription className="text-xs">
                Manual desk entry for resident complaint
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cResident" className="text-xs font-semibold">
                  Resident Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="cResident"
                  placeholder="e.g. Rahul Sharma"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cRoom" className="text-xs font-semibold">
                  Room Number <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="cRoom"
                  placeholder="e.g. 101 or G01"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cCategory" className="text-xs font-semibold">
                  Category <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) => setCategory(val as ComplaintCategory)}
                >
                  <SelectTrigger id="cCategory" className="h-10 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(COMPLAINT_CATEGORY_LABELS) as ComplaintCategory[]).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {COMPLAINT_CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cAssignee" className="text-xs font-semibold">
                  Assign Staff (Optional)
                </Label>
                <Input
                  id="cAssignee"
                  placeholder="e.g. Suresh (Plumber)"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cDesc" className="text-xs font-semibold">
                Issue Description <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="cDesc"
                placeholder="Describe the complaint in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>

            {/* Photo Attachment (FR-4.2: Stored on Cloudflare R2, compressed in-browser to WebP <150 KB) */}
            <div className="pt-1">
              <DocumentUploader
                label="Photo Evidence / Attachment"
                description="Tap to capture or upload"
                category="complaints"
                value={photoUrl}
                onChange={setPhotoUrl}
              />
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
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Ticket</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

