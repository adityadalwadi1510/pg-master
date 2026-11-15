'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_COMPLAINTS, ComplaintWithResident } from '@/lib/mock-complaints';
import { getComplaintsAction } from '@/app/actions/dashboard';
import { Badge } from '@/components/ui/badge';
import { COMPLAINT_CATEGORY_LABELS } from '@/lib/constants';
import type { ComplaintCategory, ComplaintStatus } from '@/types/database';
import { ComplaintsStats } from '@/components/complaints/complaints-stats';
import { ComplaintCard } from '@/components/complaints/complaint-card';
import { ResolveModal } from '@/components/complaints/resolve-modal';
import { CreateTicketModal } from '@/components/complaints/create-ticket-modal';
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
  PlusCircle,
  MessageSquareWarning,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintWithResident[]>(INITIAL_COMPLAINTS);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load complaints from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadComplaints() {
      try {
        const res = await getComplaintsAction();
        if (isMounted && res.complaints) {
          setComplaints(res.complaints);
          setIsLive(res.isLive);
        }
      } catch (e) {
        console.warn('Complaints live fetch failed, using fallback:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadComplaints();
    return () => {
      isMounted = false;
    };
  }, []);

  // Modals state
  const [resolvingComplaint, setResolvingComplaint] = useState<ComplaintWithResident | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Set ticket to In Progress
  const handleSetInProgress = (complaintId: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              status: 'IN_PROGRESS' as ComplaintStatus,
              assigned_to: c.assigned_to || 'Assigned Staff',
            }
          : c
      )
    );
    toast.info('Ticket marked as In Progress. Staff assigned.');
  };

  // Handle ticket resolution success
  const handleResolveSuccess = (updatedComplaint: ComplaintWithResident) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c))
    );
  };

  // Handle new ticket creation
  const handleCreateSuccess = (newComplaint: ComplaintWithResident) => {
    setComplaints((prev) => [newComplaint, ...prev]);
  };

  // Filtered tickets
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Status filter
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesResident = c.resident_name.toLowerCase().includes(q);
        const matchesRoom = c.room_number.toLowerCase().includes(q);
        const matchesTicket = `#${c.ticket_number}`.includes(q) || `${c.ticket_number}`.includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        return matchesResident || matchesRoom || matchesTicket || matchesDesc;
      }

      return true;
    });
  }, [complaints, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Complaints & Maintenance
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
              Ticketing Feed
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
            Real-time resident service requests via WhatsApp with automated resolution notifications.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 sm:h-9 w-full sm:w-auto gap-1.5 font-bold text-xs shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Log Ticket</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <ComplaintsStats complaints={complaints} />

      {/* Search & Filters */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-3 sm:top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resident, room, ticket #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-10 sm:h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={categoryFilter}
              onValueChange={(val) => { if (val) setCategoryFilter(val); }}
            >
              <SelectTrigger className="w-full sm:w-[170px] text-xs h-10 sm:h-9">
                <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {(Object.keys(COMPLAINT_CATEGORY_LABELS) as ComplaintCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {COMPLAINT_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Filter Tabs (Touch scrollable) */}
        <div className="border-b border-border pb-2">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            <TabsList className="bg-muted/70 p-1 w-full sm:w-auto overflow-x-auto flex justify-start">
              <TabsTrigger value="ALL" className="text-xs font-semibold whitespace-nowrap">
                All ({complaints.length})
              </TabsTrigger>
              <TabsTrigger value="OPEN" className="text-xs font-semibold whitespace-nowrap">
                Open ({complaints.filter((c) => c.status === 'OPEN').length})
              </TabsTrigger>
              <TabsTrigger value="IN_PROGRESS" className="text-xs font-semibold whitespace-nowrap">
                In Progress ({complaints.filter((c) => c.status === 'IN_PROGRESS').length})
              </TabsTrigger>
              <TabsTrigger value="RESOLVED" className="text-xs font-semibold whitespace-nowrap">
                Resolved ({complaints.filter((c) => c.status === 'RESOLVED').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tickets List */}
      {filteredComplaints.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl space-y-2">
          <MessageSquareWarning className="w-8 h-8 mx-auto text-muted-foreground/60" />
          <p className="font-semibold text-foreground">No complaints found matching this filter.</p>
          <p className="text-xs text-muted-foreground">
            Try resetting your search query or category filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setCategoryFilter('ALL');
            }}
            className="mt-2 text-xs h-9"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              onOpenResolve={(c) => setResolvingComplaint(c)}
              onSetInProgress={handleSetInProgress}
            />
          ))}
        </div>
      )}

      {/* Resolve Ticket Modal (FR-4.4) */}
      <ResolveModal
        complaint={resolvingComplaint}
        isOpen={Boolean(resolvingComplaint)}
        onClose={() => setResolvingComplaint(null)}
        onSuccess={handleResolveSuccess}
      />

      {/* Log Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateSuccess={handleCreateSuccess}
      />
    </div>
  );
}

