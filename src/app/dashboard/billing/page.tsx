'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_INVOICES, InvoiceWithResident } from '@/lib/mock-billing';
import { getBillingAction } from '@/app/actions/dashboard';
import { BillingStats } from '@/components/billing/billing-stats';
import { InvoiceCard } from '@/components/billing/invoice-card';
import { InvoicesTable } from '@/components/billing/invoices-table';
import { SettlementModal } from '@/components/billing/settlement-modal';
import { BulkReminderDialog } from '@/components/billing/bulk-reminder-dialog';
import { UpiQrDialog } from '@/components/billing/upi-qr-dialog';
import { GenerateInvoicesDialog } from '@/components/billing/generate-invoices-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  MessageSquare,
  Calendar,
  Sparkles,
  Receipt,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceWithResident[]>(INITIAL_INVOICES);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11-01');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [settlementInvoice, setSettlementInvoice] = useState<InvoiceWithResident | null>(null);
  const [qrInvoice, setQrInvoice] = useState<InvoiceWithResident | null>(null);
  const [isBulkReminderOpen, setIsBulkReminderOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  // Load invoices from Supabase
  const loadInvoices = async () => {
    try {
      const res = await getBillingAction();
      if (res.invoices) {
        setInvoices(res.invoices);
        setIsLive(res.isLive);
      }
    } catch (e) {
      console.warn('Billing live fetch failed, using fallback:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Invoices pending payment
  const pendingInvoices = useMemo(() => {
    return invoices.filter(
      (inv) => inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID'
    );
  }, [invoices]);

  // Filtered invoices according to month, search query, and status
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Month filter
      if (inv.billing_month !== selectedMonth) return false;

      // Status filter
      if (filterStatus !== 'ALL' && inv.status !== filterStatus) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = inv.resident_name.toLowerCase().includes(q);
        const matchesRoom = inv.room_number.toLowerCase().includes(q);
        const matchesPhone = inv.resident_phone.includes(q);
        const matchesInvoice = `inv-${inv.invoice_number}`.toLowerCase().includes(q);
        return matchesName || matchesRoom || matchesPhone || matchesInvoice;
      }

      return true;
    });
  }, [invoices, selectedMonth, filterStatus, searchQuery]);

  // Handle settlement success
  const handleSettlementSuccess = (updatedInvoice: InvoiceWithResident) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Billing & Invoices
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
              Rent Ledger
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
            Automated monthly invoicing, WhatsApp payment pings, and cash/UPI settlement.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Selector */}
          <Select value={selectedMonth} onValueChange={(val) => { if (val) setSelectedMonth(val); }}>
            <SelectTrigger className="w-[150px] text-xs h-10 sm:h-9 font-semibold">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary" />
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-11-01">November 2026</SelectItem>
              <SelectItem value="2026-10-01">October 2026</SelectItem>
              <SelectItem value="2026-09-01">September 2026</SelectItem>
            </SelectContent>
          </Select>

          {/* Generate Invoices Trigger */}
          <Button
            size="sm"
            onClick={() => setIsGenerateOpen(true)}
            className="h-10 sm:h-9 gap-1.5 font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Invoices</span>
          </Button>

          {/* Bulk WhatsApp Reminder Trigger */}
          <Button
            size="sm"
            onClick={() => setIsBulkReminderOpen(true)}
            disabled={pendingInvoices.length === 0}
            className="h-10 sm:h-9 gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Remind All Unpaid ({pendingInvoices.length})</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <BillingStats invoices={filteredInvoices} />

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-3 sm:top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resident, room, invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-10 sm:h-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={(val) => { if (val) setFilterStatus(val); }}>
            <SelectTrigger className="w-full sm:w-[150px] text-xs h-10 sm:h-9">
              <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="All Invoices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="UNPAID">Unpaid Only</SelectItem>
              <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
              <SelectItem value="PAID">Fully Paid Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl space-y-2">
          <Receipt className="w-8 h-8 mx-auto text-muted-foreground/60" />
          <p className="font-semibold text-foreground">No invoices found for this selection.</p>
          <p className="text-xs text-muted-foreground">
            Try resetting your search query or status filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('ALL');
            }}
            className="mt-2 text-xs h-9"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile View: Touch-Friendly Card List (<768px) */}
          <div className="md:hidden space-y-3">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onOpenSettlement={(inv) => setSettlementInvoice(inv)}
                onOpenQr={(inv) => setQrInvoice(inv)}
              />
            ))}
          </div>

          {/* Desktop View: Full Responsive Table (≥768px) */}
          <div className="hidden md:block">
            <InvoicesTable
              invoices={filteredInvoices}
              onOpenSettlement={(inv) => setSettlementInvoice(inv)}
              onOpenQr={(inv) => setQrInvoice(inv)}
            />
          </div>
        </>
      )}

      {/* Cash / UPI Payment Settlement Modal */}
      <SettlementModal
        invoice={settlementInvoice}
        isOpen={Boolean(settlementInvoice)}
        onClose={() => setSettlementInvoice(null)}
        onSettlementSuccess={handleSettlementSuccess}
      />

      {/* Instant UPI QR Code Dialog */}
      <UpiQrDialog
        invoice={qrInvoice}
        isOpen={Boolean(qrInvoice)}
        onClose={() => setQrInvoice(null)}
      />

      {/* Batch Monthly Invoices Generator Dialog */}
      <GenerateInvoicesDialog
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={loadInvoices}
      />

      {/* Bulk WhatsApp Reminders Dialog */}
      <BulkReminderDialog
        pendingInvoices={pendingInvoices}
        isOpen={isBulkReminderOpen}
        onClose={() => setIsBulkReminderOpen(false)}
      />
    </div>
  );
}

