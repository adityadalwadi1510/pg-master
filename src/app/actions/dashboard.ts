'use server';

import {
  fetchMatrixData,
  onboardResidentDB,
} from '@/lib/db/matrix';
import {
  fetchBillingData,
  recordPaymentDB,
} from '@/lib/db/billing';
import {
  fetchComplaintsData,
  createComplaintDB,
  resolveComplaintDB,
  assignComplaintDB,
} from '@/lib/db/complaints';
import {
  fetchNoticesData,
  logNoticeDB,
  settleStayDB,
} from '@/lib/db/notices';
import {
  fetchOverviewData,
} from '@/lib/db/overview';
import {
  generateMonthlyInvoices,
  buildUpiIntentUri,
  generateUpiQrDataUrl,
} from '@/lib/billing/generator';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ComplaintCategory, PaymentMethod } from '@/types/database';

// 1. Matrix Actions
export async function getMatrixAction() {
  return await fetchMatrixData();
}

export async function onboardResidentAction(params: {
  bedId: string;
  fullName: string;
  phone: string;
  email?: string;
  moveInDate: string;
  securityDeposit: number;
  monthlyRent: number;
  emergencyContact?: string;
}) {
  return await onboardResidentDB(params);
}

// 2. Billing Actions
export async function getBillingAction() {
  return await fetchBillingData();
}

export async function recordPaymentAction(params: {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
}) {
  return await recordPaymentDB(params);
}

// 3. Complaints Actions
export async function getComplaintsAction() {
  return await fetchComplaintsData();
}

export async function createComplaintAction(params: {
  stayId: string;
  category: ComplaintCategory;
  description: string;
  photoUrl?: string;
}) {
  return await createComplaintDB(params);
}

export async function resolveComplaintAction(params: {
  complaintId: string;
  resolutionNote: string;
  notifyWhatsApp?: boolean;
}) {
  return await resolveComplaintDB(params);
}

export async function assignComplaintAction(params: {
  complaintId: string;
  assignedTo: string;
}) {
  return await assignComplaintDB(params);
}

// 4. Notices Actions
export async function getNoticesAction() {
  return await fetchNoticesData();
}

export async function logNoticeAction(params: {
  stayId: string;
  noticeServedDate: string;
  expectedVacateDate: string;
}) {
  return await logNoticeDB(params);
}

export async function settleStayAction(params: {
  stayId: string;
  bedId: string;
  unpaidRent: number;
  utilityDues: number;
  damageDeductions: number;
  depositRefundAmount: number;
  settlementNotes?: string;
  actualVacateDate: string;
}) {
  return await settleStayDB(params);
}

// 5. Overview Action
export async function getOverviewAction() {
  return await fetchOverviewData();
}

// 6. Phase 2: Invoicing & UPI Generator Actions
export async function generateInvoicesAction(options: {
  billingMonth?: string;
  dispatchWhatsApp?: boolean;
}) {
  return await generateMonthlyInvoices(options);
}

export async function getInvoiceUpiAction(params: {
  invoiceNumber: number;
  totalOutstanding: number;
  pgName?: string;
  ownerVpa?: string;
}) {
  const vpa = params.ownerVpa || 'greennest@okhdfcbank';
  const name = params.pgName || 'GreenNest Living PG';

  const upiUri = buildUpiIntentUri({
    ownerVpa: vpa,
    pgName: name,
    totalAmount: params.totalOutstanding,
    invoiceNumber: params.invoiceNumber,
  });

  const qrDataUrl = await generateUpiQrDataUrl(upiUri);

  return {
    upiUri,
    qrDataUrl,
    amount: params.totalOutstanding,
    invoiceNumber: params.invoiceNumber,
    ownerVpa: vpa,
    pgName: name,
  };
}

