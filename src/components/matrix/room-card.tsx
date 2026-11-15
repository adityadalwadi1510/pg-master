'use client';

import React from 'react';
import { RoomWithBeds, BedWithOccupant } from '@/lib/mock-data';
import { BedCard } from './bed-card';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DoorClosed, Users } from 'lucide-react';

interface RoomCardProps {
  room: RoomWithBeds;
  onSelectBed: (bed: BedWithOccupant) => void;
  onOpenOnboarding: (bed: BedWithOccupant) => void;
  onStatusChange: (bedId: string, newStatus: BedWithOccupant['status']) => void;
}

const SHARING_LABELS: Record<string, string> = {
  SINGLE: 'Single Sharing',
  DOUBLE: '2-Sharing (Double)',
  TRIPLE: '3-Sharing (Triple)',
  FOUR_PLUS: '4+ Sharing',
};

export function RoomCard({ room, onSelectBed, onOpenOnboarding, onStatusChange }: RoomCardProps) {
  const totalBeds = room.beds.length;
  const occupiedBeds = room.beds.filter(
    (b) => b.status === 'OCCUPIED' || b.status === 'NOTICE_PERIOD'
  ).length;

  const isFull = occupiedBeds === totalBeds && totalBeds > 0;
  const isVacant = occupiedBeds === 0;

  return (
    <Card className="border border-border/80 shadow-xs hover:border-border transition-colors bg-card overflow-hidden">
      {/* Room Header */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-background border border-border text-foreground shadow-2xs">
            <DoorClosed className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground tracking-tight">
                Room {room.room_number}
              </h3>
              <Badge variant="secondary" className="text-[10px] font-medium py-0 px-1.5">
                {SHARING_LABELS[room.sharing_type] || room.sharing_type}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              ₹{room.base_rent_per_bed.toLocaleString('en-IN')}/bed/mo
            </p>
          </div>
        </div>

        {/* Occupancy indicator */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span
              className={`text-xs font-semibold ${
                isFull
                  ? 'text-rose-600 dark:text-rose-400'
                  : isVacant
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {occupiedBeds}/{totalBeds} Beds
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Beds inside this room */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {room.beds.map((bed) => (
            <BedCard
              key={bed.id}
              bed={bed}
              onSelectBed={onSelectBed}
              onOpenOnboarding={onOpenOnboarding}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

