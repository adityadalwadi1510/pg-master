'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OverviewKpiCards } from '@/components/overview/overview-kpi-cards';
import { CollectionTrendChart } from '@/components/overview/collection-trend-chart';
import { OccupancyDistribution } from '@/components/overview/occupancy-distribution';
import { ActionAlerts } from '@/components/overview/action-alerts';
import { RecentActivity } from '@/components/overview/recent-activity';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getOverviewAction } from '@/app/actions/dashboard';
import {
  Grid3X3,
  Receipt,
  Building,
} from 'lucide-react';

export default function OverviewPage() {
  const [metrics, setMetrics] = useState({
    totalBeds: 14,
    occupiedBeds: 7,
    noticeBeds: 2,
    vacantBeds: 4,
    maintenanceBeds: 1,
    occupancyRate: 64,
    totalExpected: 67300,
    totalCollected: 45600,
    totalPending: 21700,
    openComplaints: 2,
    activeNotices: 1,
  });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadOverview() {
      try {
        const res = await getOverviewAction();
        if (isMounted && res) {
          setIsLive(res.isLive);
          if (res.isLive) {
            setMetrics({
              totalBeds: res.occupancy.totalBeds,
              occupiedBeds: res.occupancy.occupiedBeds,
              noticeBeds: res.occupancy.noticeBeds,
              vacantBeds: res.occupancy.vacantBeds,
              maintenanceBeds: Math.max(0, res.occupancy.totalBeds - res.occupancy.occupiedBeds - res.occupancy.vacantBeds - res.occupancy.noticeBeds),
              occupancyRate: Math.round(res.occupancy.occupancyRate),
              totalExpected: res.financial.billed,
              totalCollected: res.financial.collected,
              totalPending: res.financial.pending,
              openComplaints: res.operations.openComplaints,
              activeNotices: res.operations.activeNotices,
            });
          }
        }
      } catch (e) {
        console.warn('Overview live fetch fallback:', e);
      }
    }
    loadOverview();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Financial Overview
            </h1>
            <Badge variant="outline" className="text-xs font-semibold py-0.5">
              November 2026
            </Badge>
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
            <span>GreenNest Luxury Men&apos;s PG • 3 Floors • {metrics.totalBeds} Beds</span>
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard/rooms" className="w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              className="h-10 sm:h-9 w-full gap-1.5 text-xs font-semibold"
            >
              <Grid3X3 className="w-3.5 h-3.5 text-primary" />
              <span>Room Matrix</span>
            </Button>
          </Link>
          <Link href="/dashboard/billing" className="w-full sm:w-auto">
            <Button
              size="sm"
              className="h-10 sm:h-9 w-full gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Collect Rent</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: KPI Stats Cards */}
      <OverviewKpiCards
        totalExpected={metrics.totalExpected}
        totalCollected={metrics.totalCollected}
        totalPending={metrics.totalPending}
        occupancyRate={metrics.occupancyRate}
        occupiedBeds={metrics.occupiedBeds}
        totalBeds={metrics.totalBeds}
      />

      {/* Row 2: Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CollectionTrendChart />
        </div>
        <div className="lg:col-span-1">
          <OccupancyDistribution
            total={metrics.totalBeds}
            occupied={metrics.occupiedBeds}
            notice={metrics.noticeBeds}
            vacant={metrics.vacantBeds}
            maintenance={metrics.maintenanceBeds}
          />
        </div>
      </div>

      {/* Row 3: Action Alerts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActionAlerts
            unpaidCount={2}
            unpaidAmount={metrics.totalPending}
            openComplaintsCount={metrics.openComplaints}
            activeNoticesCount={metrics.activeNotices}
          />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
