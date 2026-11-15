'use client';

import React from 'react';
import { FloorWithRooms, BedWithOccupant } from '@/lib/mock-data';
import { RoomCard } from './room-card';
import { Layers } from 'lucide-react';

interface FloorViewProps {
  floor: FloorWithRooms;
  filterStatus?: string;
  onSelectBed: (bed: BedWithOccupant) => void;
  onOpenOnboarding: (bed: BedWithOccupant) => void;
  onStatusChange: (bedId: string, newStatus: BedWithOccupant['status']) => void;
}

export function FloorView({
  floor,
  filterStatus = 'ALL',
  onSelectBed,
  onOpenOnboarding,
  onStatusChange,
}: FloorViewProps) {
  // Filter rooms or beds if filter is active
  const filteredRooms = floor.rooms
    .map((room) => {
      if (filterStatus === 'ALL') return room;
      const filteredBeds = room.beds.filter((bed) => bed.status === filterStatus);
      return {
        ...room,
        beds: filteredBeds,
      };
    })
    .filter((room) => room.beds.length > 0);

  const totalFloorBeds = floor.rooms.reduce((acc, r) => acc + r.beds.length, 0);
  const vacantFloorBeds = floor.rooms.reduce(
    (acc, r) => acc + r.beds.filter((b) => b.status === 'VACANT').length,
    0
  );

  return (
    <div className="space-y-3">
      {/* Floor Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight">
              {floor.label}
            </h2>
            <span className="text-xs text-muted-foreground">
              {floor.rooms.length} Rooms • {totalFloorBeds} Total Beds ({vacantFloorBeds} Vacant)
            </span>
          </div>
        </div>
      </div>

      {/* Rooms in this floor */}
      {filteredRooms.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
          No beds match the current filter on this floor.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onSelectBed={onSelectBed}
              onOpenOnboarding={onOpenOnboarding}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

