'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ComplaintWithResident } from '@/lib/mock-complaints';
import { COMPLAINT_CATEGORY_LABELS, COMPLAINT_STATUS_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Wifi,
  Sparkles,
  Droplets,
  Zap,
  UtensilsCrossed,
  HelpCircle,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  UserCheck,
  Wrench,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

function formatElapsedTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return isoString.slice(0, 10);
  }
}

interface ComplaintCardProps {
  complaint: ComplaintWithResident;
  onOpenResolve: (complaint: ComplaintWithResident) => void;
  onSetInProgress: (complaintId: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  WIFI: Wifi,
  CLEANING: Sparkles,
  PLUMBING: Droplets,
  ELECTRICAL: Zap,
  FOOD: UtensilsCrossed,
  OTHER: HelpCircle,
};

export function ComplaintCard({
  complaint,
  onOpenResolve,
  onSetInProgress,
}: ComplaintCardProps) {
  const [timeAgo, setTimeAgo] = useState(complaint.created_at.slice(0, 10));

  useEffect(() => {
    setTimeAgo(formatElapsedTime(complaint.created_at));
  }, [complaint.created_at]);

  const statusConfig = COMPLAINT_STATUS_CONFIG[complaint.status];
  const CategoryIcon = CATEGORY_ICONS[complaint.category] || HelpCircle;

  const isOpen = complaint.status === 'OPEN';
  const isInProgress = complaint.status === 'IN_PROGRESS';
  const isResolved = complaint.status === 'RESOLVED';

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent(
      `Hello ${complaint.resident_name}, regarding your complaint #${complaint.ticket_number} (${COMPLAINT_CATEGORY_LABELS[complaint.category]}): `
    );
    window.open(`https://wa.me/${complaint.resident_phone}?text=${message}`, '_blank');
  };

  return (
    <Card className="p-4 border border-border/80 shadow-xs hover:border-border transition-colors bg-card space-y-3">
      {/* Top Header: Ticket Number, Category, Status */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-foreground">
            #{complaint.ticket_number}
          </span>
          <Badge
            variant="outline"
            className="text-[11px] font-semibold gap-1 py-0.5 border-border bg-muted/30"
          >
            <CategoryIcon className="w-3.5 h-3.5 text-primary" />
            <span>{COMPLAINT_CATEGORY_LABELS[complaint.category]}</span>
          </Badge>
        </div>

        <Badge className={`text-[10px] font-bold px-2 py-0.5 ${statusConfig.badgeClass}`}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Resident & Room Details */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">{complaint.resident_name}</span>
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
            Room {complaint.room_number} ({complaint.bed_code})
          </Badge>
        </div>

        <span className="text-[11px] flex items-center gap-1 font-medium" title={complaint.created_at}>
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span>{timeAgo}</span>
        </span>
      </div>

      {/* Description Text */}
      <p className="text-xs text-foreground leading-relaxed bg-muted/20 p-2.5 rounded-lg border border-border/50">
        {complaint.description}
      </p>

      {/* Photo Attachment Preview if available (FR-4.1) */}
      {complaint.photo_url && (
        <div className="pt-0.5">
          <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30 p-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0 border border-border">
                <Image
                  src={complaint.photo_url}
                  alt="Complaint photo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" />
                  Attachment Preview
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Cloudflare R2 WebP Evidence
                </span>
              </div>
            </div>
            <a
              href={complaint.photo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1 px-2.5">
                <ExternalLink className="w-3 h-3" />
                <span>View Full</span>
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Assigned Staff or Resolution Note */}
      <div className="text-xs space-y-1">
        {complaint.assigned_to && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <UserCheck className="w-3.5 h-3.5 text-primary" />
            <span>
              Assigned to: <strong className="text-foreground">{complaint.assigned_to}</strong>
            </span>
          </div>
        )}

        {isResolved && complaint.resolution_note && (
          <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 space-y-0.5">
            <span className="font-bold block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Resolution Note:
            </span>
            <p className="leading-relaxed">{complaint.resolution_note}</p>
            {complaint.resolved_at && (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block pt-0.5">
                Resolved on {complaint.resolved_at.slice(0, 16).replace('T', ' ')}
              </span>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Touch-Friendly Action Buttons (Minimum 44px for thumb tap) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
        {!isResolved ? (
          <>
            <Button
              size="sm"
              onClick={() => onOpenResolve(complaint)}
              className="h-11 sm:h-9 w-full gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Resolved</span>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              {isOpen ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSetInProgress(complaint.id)}
                  className="h-11 sm:h-9 w-full gap-1 text-xs text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 font-semibold"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Start Work</span>
                </Button>
              ) : (
                <div className="h-11 sm:h-9 flex items-center justify-center text-xs font-semibold text-blue-700 bg-blue-50/50 rounded-lg border border-blue-200">
                  <span>In Progress</span>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenWhatsApp}
                className="h-11 sm:h-9 w-full gap-1 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="col-span-2 flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Ticket Closed
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenWhatsApp}
              className="h-8 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              <span>Message Resident</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

