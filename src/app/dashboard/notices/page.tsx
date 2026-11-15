'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_NOTICES, StayWithSettlement } from '@/lib/mock-notices';
import { getNoticesAction } from '@/app/actions/dashboard';
import { Badge } from '@/components/ui/badge';
import { NoticePipelineStats } from '@/components/notices/notice-pipeline-stats';
import { NoticeCard } from '@/components/notices/notice-card';
import { SettledHistoryTable } from '@/components/notices/settled-history-table';
import { SettlementSheetModal } from '@/components/notices/settlement-sheet-modal';
import { LogNoticeModal } from '@/components/notices/log-notice-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, PlusCircle, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function NoticesPage() {
  const [stays, setStays] = useState<StayWithSettlement[]>(INITIAL_NOTICES);
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'HISTORY'>('PIPELINE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load notices from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadNotices() {
      try {
        const res = await getNoticesAction();
        if (isMounted) {
          const combined = [...res.activeNotices, ...res.settledHistory];
          if (combined.length > 0) {
            setStays(combined);
          }
          setIsLive(res.isLive);
        }
      } catch (e) {
        console.warn('Notices live fetch failed, using fallback:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadNotices();
    return () => {
      isMounted = false;
    };
  }, []);

  // Modals state
  const [settlingStay, setSettlingStay] = useState<StayWithSettlement | null>(null);
  const [isLogNoticeOpen, setIsLogNoticeOpen] = useState(false);

  // Active pipeline vs completed history
  const activeNotices = useMemo(
    () => stays.filter((s) => s.status === 'NOTICE'),
    [stays]
  );
  const completedHistory = useMemo(
    () => stays.filter((s) => s.status === 'COMPLETED'),
    [stays]
  );

  // Handle settlement success
  const handleSettlementSuccess = (updatedStay: StayWithSettlement) => {
    setStays((prev) =>
      prev.map((s) => (s.id === updatedStay.id ? updatedStay : s))
    );
  };

  // Handle new notice logged
  const handleLogNoticeSuccess = (newNotice: StayWithSettlement) => {
    setStays((prev) => [newNotice, ...prev]);
  };

  // Filtered active notices
  const filteredActiveNotices = useMemo(() => {
    if (!searchQuery.trim()) return activeNotices;
    const q = searchQuery.toLowerCase().trim();
    return activeNotices.filter(
      (s) =>
        s.resident_name.toLowerCase().includes(q) ||
        s.room_number.toLowerCase().includes(q) ||
        s.resident_phone.includes(q)
    );
  }, [activeNotices, searchQuery]);

  // Filtered completed history
  const filteredCompletedHistory = useMemo(() => {
    if (!searchQuery.trim()) return completedHistory;
    const q = searchQuery.toLowerCase().trim();
    return completedHistory.filter(
      (s) =>
        s.resident_name.toLowerCase().includes(q) ||
        s.room_number.toLowerCase().includes(q) ||
        s.resident_phone.includes(q)
    );
  }, [completedHistory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Notice Period & Deposits
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
              Checkout Pipeline
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
          <p className="text-xs text-muted-foreground mt-0.5">
            30-day vacancy projection matrix and security deposit clearance sheet (FR-5.1–FR-5.4).
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsLogNoticeOpen(true)}
            className="h-10 sm:h-9 w-full sm:w-auto gap-1.5 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Log Move-out Notice</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <NoticePipelineStats stays={stays} />

      {/* Search & Tabs */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-3 sm:top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resident, room, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-10 sm:h-9"
            />
          </div>

          <div className="border-b border-border pb-1 w-full sm:w-auto">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as 'PIPELINE' | 'HISTORY')}
              className="w-full sm:w-auto"
            >
              <TabsList className="bg-muted/70 p-1 w-full sm:w-auto flex">
                <TabsTrigger value="PIPELINE" className="text-xs font-semibold flex-1 sm:flex-none">
                  Active Pipeline ({activeNotices.length})
                </TabsTrigger>
                <TabsTrigger value="HISTORY" className="text-xs font-semibold flex-1 sm:flex-none">
                  Settled Checkouts ({completedHistory.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'PIPELINE' ? (
        filteredActiveNotices.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-xl space-y-2">
            <Clock className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">No active 30-day notices found.</p>
            <p className="text-xs text-muted-foreground">
              All resident stays are active and stable.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActiveNotices.map((stay) => (
              <NoticeCard
                key={stay.id}
                stay={stay}
                onOpenSettlement={(s) => setSettlingStay(s)}
              />
            ))}
          </div>
        )
      ) : (
        <SettledHistoryTable stays={filteredCompletedHistory} />
      )}

      {/* Security Deposit Settlement Modal (FR-5.4) */}
      <SettlementSheetModal
        stay={settlingStay}
        isOpen={Boolean(settlingStay)}
        onClose={() => setSettlingStay(null)}
        onSettlementSuccess={handleSettlementSuccess}
      />

      {/* Log Move-Out Notice Modal (FR-5.1 & FR-5.2) */}
      <LogNoticeModal
        isOpen={isLogNoticeOpen}
        onClose={() => setIsLogNoticeOpen(false)}
        onLogNoticeSuccess={handleLogNoticeSuccess}
      />
    </div>
  );
}

