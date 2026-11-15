import { createAdminClient } from '@/lib/supabase/admin';
import {
  INITIAL_INVOICES,
  InvoiceWithResident,
  PaymentRecord,
} from '@/lib/mock-billing';
import type { InvoiceStatus, PaymentMethod } from '@/types/database';

export interface BillingFetchResult {
  isLive: boolean;
  invoices: InvoiceWithResident[];
  summary: {
    totalBilled: number;
    totalCollected: number;
    totalPending: number;
    unpaidCount: number;
    overdueCount: number;
  };
  error?: string;
}

/**
 * Fetches all invoices, payments, and resident details from Supabase.
 * Gracefully falls back to mock data if permissions are pending or DB unseeded.
 */
export async function fetchBillingData(): Promise<BillingFetchResult> {
  try {
    const supabase: any = createAdminClient();

    // 1. Fetch invoices with related stays, residents, beds, rooms, and payments
    const { data: invoices, error: invErr } = await supabase
      .from('invoices')
      .select(`
        *,
        payments (*),
        stays (
          id,
          monthly_rent,
          residents ( id, full_name, phone_number ),
          beds (
            id,
            bed_code,
            rooms ( id, room_number )
          )
        )
      `)
      .order('invoice_number', { ascending: false });

    if (invErr || !invoices || invoices.length === 0) {
      // Calculate mock summary
      const totalBilled = INITIAL_INVOICES.reduce((sum, inv) => sum + inv.total_amount, 0);
      const totalCollected = INITIAL_INVOICES.reduce((sum, inv) => sum + inv.amount_paid, 0);
      const totalPending = totalBilled - totalCollected;
      const unpaidCount = INITIAL_INVOICES.filter((inv) => inv.status !== 'PAID').length;
      const overdueCount = INITIAL_INVOICES.filter((inv) => inv.status !== 'PAID' && new Date(inv.due_date) < new Date()).length;

      return {
        isLive: false,
        invoices: INITIAL_INVOICES,
        summary: {
          totalBilled,
          totalCollected,
          totalPending,
          unpaidCount,
          overdueCount,
        },
        error: invErr?.message || 'No invoices found',
      };
    }

    // Transform into UI format
    const transformed: InvoiceWithResident[] = invoices.map((inv: any) => {
      const stay = inv.stays;
      const resident = stay?.residents;
      const bed = stay?.beds;
      const room = bed?.rooms;

      const paymentsList: PaymentRecord[] = (inv.payments || []).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method as PaymentMethod,
        reference: p.reference,
        paid_at: p.paid_at,
      }));

      const totalAmount = Number(inv.total_amount);
      const amountPaid = Number(inv.amount_paid);
      const balanceDue = Math.max(0, totalAmount - amountPaid);

      return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        stay_id: inv.stay_id,
        resident_name: resident?.full_name || 'Resident',
        resident_phone: resident?.phone_number || '',
        room_number: room?.room_number || 'N/A',
        bed_code: bed?.bed_code || 'A',
        billing_month: inv.billing_month,
        base_rent: Number(inv.base_rent),
        electricity_charges: Number(inv.electricity_charges),
        maintenance_charges: Number(inv.maintenance_charges),
        addon_charges: Number(inv.addon_charges),
        discount_amount: Number(inv.discount_amount),
        total_amount: totalAmount,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        status: inv.status as InvoiceStatus,
        due_date: inv.due_date,
        paid_at: inv.paid_at,
        payments: paymentsList,
      };
    });

    const totalBilled = transformed.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalCollected = transformed.reduce((sum, inv) => sum + inv.amount_paid, 0);
    const totalPending = totalBilled - totalCollected;
    const unpaidCount = transformed.filter((inv) => inv.status !== 'PAID').length;
    const overdueCount = transformed.filter((inv) => inv.status !== 'PAID' && new Date(inv.due_date) < new Date()).length;

    return {
      isLive: true,
      invoices: transformed,
      summary: {
        totalBilled,
        totalCollected,
        totalPending,
        unpaidCount,
        overdueCount,
      },
    };
  } catch (error: any) {
    console.error('fetchBillingData failed:', error);
    const totalBilled = INITIAL_INVOICES.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalCollected = INITIAL_INVOICES.reduce((sum, inv) => sum + inv.amount_paid, 0);
    const totalPending = totalBilled - totalCollected;
    const unpaidCount = INITIAL_INVOICES.filter((inv) => inv.status !== 'PAID').length;
    const overdueCount = INITIAL_INVOICES.filter((inv) => inv.status !== 'PAID' && new Date(inv.due_date) < new Date()).length;

    return {
      isLive: false,
      invoices: INITIAL_INVOICES,
      summary: {
        totalBilled,
        totalCollected,
        totalPending,
        unpaidCount,
        overdueCount,
      },
      error: error?.message || 'Database connection error',
    };
  }
}

/**
 * Records a payment in Supabase (FR-3.3)
 * PostgreSQL trigger `trg_payments_sync` will auto-recalculate the invoice balance and status.
 */
export async function recordPaymentDB(params: {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
}) {
  try {
    const supabase: any = createAdminClient();

    // 1. Get invoice to find organization_id
    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('id, organization_id')
      .eq('id', params.invoiceId)
      .single();

    if (invErr || !inv) {
      throw new Error('Invoice not found');
    }

    // 2. Insert payment record
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        organization_id: inv.organization_id,
        invoice_id: params.invoiceId,
        amount: params.amount,
        method: params.method,
        reference: params.reference || null,
        paid_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (payErr) throw payErr;

    return { success: true, payment };
  } catch (err: any) {
    console.error('recordPaymentDB error:', err);
    return { success: false, error: err.message };
  }
}

