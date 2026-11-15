import type { BedStatus, InvoiceStatus, ComplaintStatus, ComplaintCategory } from '@/types/database';

export const BED_STATUS_CONFIG: Record<
  BedStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string; dotColor: string }
> = {
  VACANT: {
    label: 'Vacant',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-300 dark:border-emerald-700',
    dotColor: '#10B981',
  },
  OCCUPIED: {
    label: 'Occupied',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-300 dark:border-rose-700',
    dotColor: '#F43F5E',
  },
  NOTICE_PERIOD: {
    label: 'Notice Period',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-300 dark:border-amber-700',
    dotColor: '#F59E0B',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    bgClass: 'bg-slate-100 dark:bg-slate-800/40',
    textClass: 'text-slate-700 dark:text-slate-300',
    borderClass: 'border-slate-300 dark:border-slate-700',
    dotColor: '#64748B',
  },
};

export const INVOICE_STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'; bgClass: string; textClass: string }
> = {
  PAID: {
    label: 'Paid',
    badgeVariant: 'default',
    bgClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    textClass: 'text-emerald-700',
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    badgeVariant: 'secondary',
    bgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    textClass: 'text-blue-700',
  },
  UNPAID: {
    label: 'Unpaid',
    badgeVariant: 'destructive',
    bgClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    textClass: 'text-rose-700',
  },
  WAIVED: {
    label: 'Waived',
    badgeVariant: 'outline',
    bgClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    textClass: 'text-slate-700',
  },
};

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  WIFI: 'Wi-Fi & Internet',
  CLEANING: 'Housekeeping & Cleaning',
  PLUMBING: 'Plumbing & Water',
  ELECTRICAL: 'Electrical & Power',
  FOOD: 'Food & Mess',
  OTHER: 'General & Other',
};

export const COMPLAINT_STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; badgeClass: string }
> = {
  OPEN: {
    label: 'Open',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  RESOLVED: {
    label: 'Resolved',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  REJECTED: {
    label: 'Rejected',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
};

