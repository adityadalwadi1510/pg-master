import { createAdminClient } from '@/lib/supabase/admin';
import {
  INITIAL_NOTICES,
  StayWithSettlement,
} from '@/lib/mock-notices';
import type { StayStatus, DepositStatus } from '@/types/database';

export interface NoticesFetchResult {
  isLive: boolean;
  activeNotices: StayWithSettlement[];
  settledHistory: StayWithSettlement[];
  summary: {
    activeNoticesCount: number;
    vacanciesIn7Days: number;
    vacanciesIn30Days: number;
    totalDepositsHeld: number;
  };
  error?: string;
}

/**
 * Fetches stays on notice and settled history from Supabase.
 */
export async function fetchNoticesData(): Promise<NoticesFetchResult> {
  try {
    const supabase: any = createAdminClient();

    const { data: stays, error: stayErr } = await supabase
      .from('stays')
      .select(`
        *,
        residents ( id, full_name, phone_number, email ),
        beds (
          id,
          bed_code,
          rooms ( id, room_number )
        )
      `)
      .in('status', ['NOTICE', 'COMPLETED'])
      .order('expected_vacate_date', { ascending: true });

    if (stayErr || !stays || stays.length === 0) {
      const active = INITIAL_NOTICES.filter((n) => n.status === 'NOTICE');
      const settled = INITIAL_NOTICES.filter((n) => n.status === 'COMPLETED');
      const totalDepositsHeld = active.reduce((sum, n) => sum + n.security_deposit, 0);

      return {
        isLive: false,
        activeNotices: active,
        settledHistory: settled,
        summary: {
          activeNoticesCount: active.length,
          vacanciesIn7Days: 0,
          vacanciesIn30Days: active.length,
          totalDepositsHeld,
        },
        error: stayErr?.message || 'No notice stays found',
      };
    }

    const transformed: StayWithSettlement[] = stays.map((s: any) => {
      const resident = s.residents;
      const bed = s.beds;
      const room = bed?.rooms;

      return {
        id: s.id,
        resident_id: s.resident_id,
        resident_name: resident?.full_name || 'Resident',
        resident_phone: resident?.phone_number || '',
        resident_email: resident?.email,
        room_number: room?.room_number || 'N/A',
        bed_code: bed?.bed_code || 'A',
        bed_id: s.bed_id,
        move_in_date: s.move_in_date,
        monthly_rent: Number(s.monthly_rent),
        security_deposit: Number(s.security_deposit),
        notice_served_date: s.notice_served_date,
        expected_vacate_date: s.expected_vacate_date,
        actual_vacate_date: s.actual_vacate_date,
        unpaid_rent: Number(s.unpaid_rent || 0),
        utility_dues: Number(s.utility_dues || 0),
        damage_deductions: Number(s.damage_deductions || 0),
        deposit_refund_amount: s.deposit_refund_amount ? Number(s.deposit_refund_amount) : null,
        settlement_notes: s.settlement_notes,
        deposit_status: s.deposit_status as DepositStatus,
        status: s.status as StayStatus,
        settled_at: s.settled_at,
      };
    });

    const activeNotices = transformed.filter((n) => n.status === 'NOTICE');
    const settledHistory = transformed.filter((n) => n.status === 'COMPLETED');

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000);
    const in30Days = new Date(now.getTime() + 30 * 86400000);

    let vacanciesIn7Days = 0;
    let vacanciesIn30Days = 0;

    activeNotices.forEach((n) => {
      if (n.expected_vacate_date) {
        const vacateDate = new Date(n.expected_vacate_date);
        if (vacateDate <= in7Days) vacanciesIn7Days++;
        if (vacateDate <= in30Days) vacanciesIn30Days++;
      }
    });

    const totalDepositsHeld = activeNotices.reduce((sum, n) => sum + n.security_deposit, 0);

    return {
      isLive: true,
      activeNotices,
      settledHistory,
      summary: {
        activeNoticesCount: activeNotices.length,
        vacanciesIn7Days,
        vacanciesIn30Days,
        totalDepositsHeld,
      },
    };
  } catch (error: any) {
    console.error('fetchNoticesData failed:', error);
    const active = INITIAL_NOTICES.filter((n) => n.status === 'NOTICE');
    const settled = INITIAL_NOTICES.filter((n) => n.status === 'COMPLETED');
    const totalDepositsHeld = active.reduce((sum, n) => sum + n.security_deposit, 0);

    return {
      isLive: false,
      activeNotices: active,
      settledHistory: settled,
      summary: {
        activeNoticesCount: active.length,
        vacanciesIn7Days: 0,
        vacanciesIn30Days: active.length,
        totalDepositsHeld,
      },
      error: error?.message || 'Database connection error',
    };
  }
}

/**
 * Logs a 30-day notice period for an active resident (FR-5.1)
 */
export async function logNoticeDB(params: {
  stayId: string;
  noticeServedDate: string;
  expectedVacateDate: string;
}) {
  try {
    const supabase: any = createAdminClient();

    // 1. Fetch stay to find bed_id
    const { data: stay, error: stayErr } = await supabase
      .from('stays')
      .select('id, bed_id')
      .eq('id', params.stayId)
      .single();

    if (stayErr || !stay) throw new Error('Stay not found');

    // 2. Update stay
    const { error: updateStayErr } = await supabase
      .from('stays')
      .update({
        status: 'NOTICE',
        notice_served_date: params.noticeServedDate,
        expected_vacate_date: params.expectedVacateDate,
      })
      .eq('id', params.stayId);

    if (updateStayErr) throw updateStayErr;

    // 3. Update bed status
    await supabase
      .from('beds')
      .update({ status: 'NOTICE_PERIOD' })
      .eq('id', stay.bed_id);

    return { success: true };
  } catch (err: any) {
    console.error('logNoticeDB error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Settles deposit clearance and marks resident checked out (FR-5.4)
 */
export async function settleStayDB(params: {
  stayId: string;
  bedId: string;
  unpaidRent: number;
  utilityDues: number;
  damageDeductions: number;
  depositRefundAmount: number;
  settlementNotes?: string;
  actualVacateDate: string;
}) {
  try {
    const supabase: any = createAdminClient();

    // 1. Update stay record
    const { error: stayErr } = await supabase
      .from('stays')
      .update({
        status: 'COMPLETED',
        deposit_status: 'SETTLED',
        actual_vacate_date: params.actualVacateDate,
        unpaid_rent: params.unpaidRent,
        utility_dues: params.utilityDues,
        damage_deductions: params.damageDeductions,
        deposit_refund_amount: params.depositRefundAmount,
        settlement_notes: params.settlementNotes || null,
        settled_at: new Date().toISOString(),
      })
      .eq('id', params.stayId);

    if (stayErr) throw stayErr;

    // 2. Mark Bed as VACANT
    const { error: bedErr } = await supabase
      .from('beds')
      .update({ status: 'VACANT' })
      .eq('id', params.bedId);

    if (bedErr) throw bedErr;

    return { success: true };
  } catch (err: any) {
    console.error('settleStayDB error:', err);
    return { success: false, error: err.message };
  }
}

