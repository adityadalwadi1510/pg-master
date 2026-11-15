'use client';

import React from 'react';
import { StayWithSettlement } from '@/lib/mock-notices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Calendar,
  IndianRupee,
  Receipt,
  Phone,
  MessageSquare,
  CheckCircle2,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface NoticeCardProps {
  stay: StayWithSettlement;
  onOpenSettlement: (stay: StayWithSettlement) => void;
}

export function NoticeCard({ stay, onOpenSettlement }: NoticeCardProps) {
  const [daysRemaining, setDaysRemaining] = React.useState<number>(30);

  React.useEffect(() => {
    if (stay.expected_vacate_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(stay.expected_vacate_date);
      target.setHours(0, 0, 0, 0);
      const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setDaysRemaining(diff);
    }
  }, [stay.expected_vacate_date]);

  const estRefund = stay.security_deposit - (stay.unpaid_rent + stay.utility_dues + stay.damage_deductions);

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent(
      `Hello ${stay.resident_name}, regarding your notice period for Room ${stay.room_number} (expected move-out: ${stay.expected_vacate_date}): `
    );
    window.open(`https://wa.me/${stay.resident_phone}?text=${message}`, '_blank');
  };

  return (
    <Card className="p-4 border border-border/80 shadow-xs hover:border-border transition-colors bg-card space-y-3">
      {/* Header: Resident, Room, and Days Remaining Badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground tracking-tight">
              {stay.resident_name}
            </h3>
            <Badge variant="outline" className="text-[10px] font-semibold">
              Room {stay.room_number} ({stay.bed_code})
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3" />
            <span>{stay.resident_phone.replace(/^91/, '+91 ')}</span>
          </span>
        </div>

        <Badge
          className={`text-[10px] font-bold px-2 py-0.5 ${
            daysRemaining <= 7
              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
          }`}
        >
          {daysRemaining > 0 ? `${daysRemaining} Days Left` : 'Vacate Due Today'}
        </Badge>
      </div>

      {/* Notice Timeline Info */}
      <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Notice Served:
          </span>
          <span className="font-semibold text-foreground">{stay.notice_served_date}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-600" />
            Projected Vacate:
          </span>
          <span className="font-bold text-amber-800 dark:text-amber-200">
            {stay.expected_vacate_date}
          </span>
        </div>
      </div>

      {/* Financial Pre-Clearance Matrix */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs p-2.5 bg-muted/30 rounded-lg border border-border/60">
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase font-medium">Deposit Held</span>
          <span className="font-bold text-foreground">
            ₹{stay.security_deposit.toLocaleString('en-IN')}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase font-medium">Unpaid Dues</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">
            ₹{(stay.unpaid_rent + stay.utility_dues).toLocaleString('en-IN')}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase font-medium">Est. Refund</span>
          <span
            className={`font-black ${
              estRefund >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
            }`}
          >
            ₹{Math.abs(estRefund).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <Separator />

      {/* Touch-Friendly Action Buttons (Minimum 44px for thumb tap) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
        <Button
          size="sm"
          onClick={() => onOpenSettlement(stay)}
          className="h-11 sm:h-9 w-full gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Receipt className="w-4 h-4" />
          <span>Settle Deposit & Checkout</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenWhatsApp}
          className="h-11 sm:h-9 w-full gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp Chat</span>
        </Button>
      </div>
    </Card>
  );
}
