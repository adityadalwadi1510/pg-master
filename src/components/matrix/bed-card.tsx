'use client';

import React from 'react';
import { BedWithOccupant } from '@/lib/mock-data';
import { BED_STATUS_CONFIG, INVOICE_STATUS_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  UserPlus,
  MoreVertical,
  Wrench,
  CheckCircle,
  Eye,
  Calendar,
  AlertCircle,
  Phone,
} from 'lucide-react';

interface BedCardProps {
  bed: BedWithOccupant;
  onSelectBed: (bed: BedWithOccupant) => void;
  onOpenOnboarding: (bed: BedWithOccupant) => void;
  onStatusChange: (bedId: string, newStatus: BedWithOccupant['status']) => void;
}

export function BedCard({ bed, onSelectBed, onOpenOnboarding, onStatusChange }: BedCardProps) {
  const statusConfig = BED_STATUS_CONFIG[bed.status];
  const isVacant = bed.status === 'VACANT';
  const isOccupied = bed.status === 'OCCUPIED';
  const isNotice = bed.status === 'NOTICE_PERIOD';
  const isMaintenance = bed.status === 'MAINTENANCE';

  return (
    <div
      onClick={() => {
        if (isVacant) {
          onOpenOnboarding(bed);
        } else {
          onSelectBed(bed);
        }
      }}
      className={`group relative rounded-xl border p-3.5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${statusConfig.borderClass} ${statusConfig.bgClass}`}
    >
      {/* Top Header: Bed Label & Status Tag */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-foreground">
            Bed {bed.bed_code}
          </span>
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: statusConfig.dotColor }}
          />
        </div>

        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 font-medium tracking-wide uppercase border ${statusConfig.borderClass} ${statusConfig.textClass}`}
          >
            {statusConfig.label}
          </Badge>

          {/* Quick Context Menu */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 flex items-center justify-center rounded-md hover:bg-muted cursor-pointer transition-colors">
                <MoreVertical className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {isVacant && (
                  <DropdownMenuItem onClick={() => onOpenOnboarding(bed)}>
                    <UserPlus className="mr-2 h-4 w-4 text-emerald-600" />
                    <span>Check In Resident</span>
                  </DropdownMenuItem>
                )}
                {(isOccupied || isNotice) && (
                  <DropdownMenuItem onClick={() => onSelectBed(bed)}>
                    <Eye className="mr-2 h-4 w-4 text-primary" />
                    <span>Resident Details</span>
                  </DropdownMenuItem>
                )}
                {isMaintenance ? (
                  <DropdownMenuItem onClick={() => onStatusChange(bed.id, 'VACANT')}>
                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                    <span>Mark as Vacant</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onStatusChange(bed.id, 'MAINTENANCE')}>
                    <Wrench className="mr-2 h-4 w-4 text-slate-600" />
                    <span>Mark Maintenance</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Middle Content: Resident or State Details */}
      <div className="mt-2.5 min-h-[58px] flex flex-col justify-center">
        {isVacant && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Base: ₹{bed.base_rent.toLocaleString('en-IN')}/mo</p>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <UserPlus className="h-3 w-3" />
              <span>Tap to onboard</span>
            </div>
          </div>
        )}

        {isOccupied && bed.stay && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                {bed.stay.resident_name}
              </span>
              {bed.stay.invoice && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    INVOICE_STATUS_CONFIG[bed.stay.invoice.status].bgClass
                  }`}
                >
                  {bed.stay.invoice.status}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{bed.stay.resident_phone.replace(/^91/, '+91 ')}</span>
            </div>
          </div>
        )}

        {isNotice && bed.stay && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                {bed.stay.resident_name}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                NOTICE
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">
                Leaves: {bed.stay.expected_vacate_date ?? 'In 30 days'}
              </span>
            </div>
          </div>
        )}

        {isMaintenance && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Wrench className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">Blocked for maintenance</span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Quick Price / Stay Date Tag */}
      <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>₹{(bed.stay?.monthly_rent ?? bed.base_rent).toLocaleString('en-IN')}/mo</span>
        {bed.stay ? (
          <span>Since {bed.stay.move_in_date.slice(0, 7)}</span>
        ) : (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Available</span>
        )}
      </div>
    </div>
  );
}
