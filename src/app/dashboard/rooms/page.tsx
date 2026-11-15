'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  INITIAL_PROPERTY_DATA,
  FloorWithRooms,
  BedWithOccupant,
} from '@/lib/mock-data';
import type { BedStatus } from '@/types/database';
import { getMatrixAction } from '@/app/actions/dashboard';
import { MatrixStats } from '@/components/matrix/matrix-stats';
import { FloorView } from '@/components/matrix/floor-view';
import { OnboardingModal } from '@/components/matrix/onboarding-modal';
import { BedDetailsSheet } from '@/components/matrix/bed-details-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Building,
  Database,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function RoomsMatrixPage() {
  const [property, setProperty] = useState(INITIAL_PROPERTY_DATA);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live Supabase data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await getMatrixAction();
        if (isMounted && res.data) {
          setProperty(res.data);
          setIsLive(res.isLive);
        }
      } catch (e) {
        console.warn('Matrix live fetch failed, using fallback:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Modals state
  const [onboardingBed, setOnboardingBed] = useState<BedWithOccupant | null>(null);
  const [selectedBed, setSelectedBed] = useState<BedWithOccupant | null>(null);

  // Flatten all beds for overall stats
  const allBeds = useMemo(() => {
    const list: BedWithOccupant[] = [];
    property.floors.forEach((f) => {
      f.rooms.forEach((r) => {
        r.beds.forEach((b) => {
          list.push(b);
        });
      });
    });
    return list;
  }, [property]);

  // Handle bed status change (e.g., mark as maintenance or vacant)
  const handleStatusChange = (bedId: string, newStatus: BedWithOccupant['status']) => {
    setProperty((prev) => {
      const newFloors: FloorWithRooms[] = prev.floors.map((floor) => ({
        ...floor,
        rooms: floor.rooms.map((room) => ({
          ...room,
          beds: room.beds.map((bed): BedWithOccupant => {
            if (bed.id === bedId) {
              return {
                ...bed,
                status: newStatus,
                stay: newStatus === 'VACANT' ? undefined : bed.stay,
              };
            }
            return bed;
          }),
        })),
      }));
      return { ...prev, floors: newFloors };
    });

    toast.info(`Bed marked as ${newStatus}`);
  };

  // Handle resident onboarding success
  const handleOnboardingSuccess = (updatedBed: BedWithOccupant) => {
    setProperty((prev) => {
      const newFloors: FloorWithRooms[] = prev.floors.map((floor) => ({
        ...floor,
        rooms: floor.rooms.map((room) => ({
          ...room,
          beds: room.beds.map((bed): BedWithOccupant => {
            if (bed.id === updatedBed.id) {
              return updatedBed;
            }
            return bed;
          }),
        })),
      }));
      return { ...prev, floors: newFloors };
    });
  };

  // Handle bed checkout / vacating
  const handleVacateBed = (bedId: string) => {
    handleStatusChange(bedId, 'VACANT');
    toast.success('Resident checked out. Bed is now Vacant and ready for onboarding.');
  };

  // Handle setting 30-day notice period
  const handleToggleNotice = (bedId: string) => {
    setProperty((prev) => {
      const newFloors: FloorWithRooms[] = prev.floors.map((floor) => ({
        ...floor,
        rooms: floor.rooms.map((room) => ({
          ...room,
          beds: room.beds.map((bed): BedWithOccupant => {
            if (bed.id === bedId && bed.stay) {
              const expectedDate = new Date();
              expectedDate.setDate(expectedDate.getDate() + 30);
              const noticeState: BedStatus = 'NOTICE_PERIOD';
              return {
                ...bed,
                status: noticeState,
                stay: {
                  ...bed.stay,
                  notice_served_date: new Date().toISOString().slice(0, 10),
                  expected_vacate_date: expectedDate.toISOString().slice(0, 10),
                },
              };
            }
            return bed;
          }),
        })),
      }));
      return { ...prev, floors: newFloors };
    });

    toast.warning('30-Day Move-out notice logged. Bed status set to NOTICE_PERIOD.');
  };

  // Filtered floors according to floor tab & search
  const visibleFloors = useMemo(() => {
    let floors = property.floors;

    if (selectedFloorId !== 'ALL') {
      floors = floors.filter((f) => f.id === selectedFloorId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      floors = floors
        .map((f) => ({
          ...f,
          rooms: f.rooms
            .map((r) => ({
              ...r,
              beds: r.beds.filter(
                (b) =>
                  b.room_number.toLowerCase().includes(q) ||
                  b.bed_code.toLowerCase().includes(q) ||
                  b.stay?.resident_name.toLowerCase().includes(q) ||
                  b.stay?.resident_phone.includes(q)
              ),
            }))
            .filter((r) => r.beds.length > 0),
        }))
        .filter((f) => f.rooms.length > 0);
    }

    return floors;
  }, [property, selectedFloorId, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Property Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Room & Bed Matrix
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
              2D Inventory Grid
            </span>
            {isLive ? (
              <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Supabase
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-600 border-amber-500/30 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Demo Mode
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" />
            <span>{property.name}</span>
            <span>•</span>
            <span>{property.address}</span>
          </p>
        </div>

        {/* Quick Filter Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resident, room, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-10 sm:h-9"
            />
          </div>

          <Select
            value={filterStatus}
            onValueChange={(val) => {
              if (val) setFilterStatus(val);
            }}
          >
            <SelectTrigger className="w-full sm:w-[140px] text-xs h-10 sm:h-9">
              <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Beds</SelectItem>
              <SelectItem value="VACANT">Vacant Only</SelectItem>
              <SelectItem value="OCCUPIED">Occupied Only</SelectItem>
              <SelectItem value="NOTICE_PERIOD">In Notice Only</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <MatrixStats beds={allBeds} />

      {/* Floor Filter Tabs & Color Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-3">
        <Tabs value={selectedFloorId} onValueChange={setSelectedFloorId} className="w-full sm:w-auto">
          <TabsList className="bg-muted/70 p-1 w-full sm:w-auto overflow-x-auto flex justify-start">
            <TabsTrigger value="ALL" className="text-xs font-semibold whitespace-nowrap">
              All Floors ({property.floors.length})
            </TabsTrigger>
            {property.floors.map((floor) => (
              <TabsTrigger key={floor.id} value={floor.id} className="text-xs font-semibold whitespace-nowrap">
                {floor.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Color Legend (Always visible and wrapped on mobile) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Vacant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Notice Period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span>Maintenance</span>
          </div>
        </div>
      </div>

      {/* 2D Floors Grid */}
      <div className="space-y-8">
        {visibleFloors.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-xl space-y-2">
            <p className="font-semibold text-foreground">No rooms or beds match your query.</p>
            <p className="text-xs text-muted-foreground">
              Try resetting your search query or status filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('ALL');
                setSelectedFloorId('ALL');
              }}
              className="mt-2 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          visibleFloors.map((floor) => (
            <FloorView
              key={floor.id}
              floor={floor}
              filterStatus={filterStatus}
              onSelectBed={(bed) => setSelectedBed(bed)}
              onOpenOnboarding={(bed) => setOnboardingBed(bed)}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* Inline Resident Onboarding Modal (FR-1.3 & FR-1.4) */}
      <OnboardingModal
        bed={onboardingBed}
        isOpen={Boolean(onboardingBed)}
        onClose={() => setOnboardingBed(null)}
        onSuccess={handleOnboardingSuccess}
      />

      {/* Bed Details & Resident Sheet */}
      <BedDetailsSheet
        bed={selectedBed}
        isOpen={Boolean(selectedBed)}
        onClose={() => setSelectedBed(null)}
        onVacateBed={handleVacateBed}
        onToggleNotice={handleToggleNotice}
      />
    </div>
  );
}
