import type { StayStatus, DepositStatus } from '@/types/database';

export interface StayWithSettlement {
  id: string;
  resident_id: string;
  resident_name: string;
  resident_phone: string;
  resident_email?: string | null;
  room_number: string;
  bed_code: string;
  bed_id: string;
  move_in_date: string;
  monthly_rent: number;
  security_deposit: number;
  notice_served_date: string | null;
  expected_vacate_date: string | null;
  actual_vacate_date: string | null;
  unpaid_rent: number;
  utility_dues: number;
  damage_deductions: number;
  deposit_refund_amount: number | null;
  settlement_notes: string | null;
  deposit_status: DepositStatus;
  status: StayStatus;
  settled_at: string | null;
}

export const INITIAL_NOTICES: StayWithSettlement[] = [
  {
    id: '70000000-0000-0000-0000-000000000004',
    resident_id: 'f0000000-0000-0000-0000-000000000004',
    resident_name: 'Vikram Singh',
    resident_phone: '919844455566',
    resident_email: 'vikram.singh@example.com',
    room_number: '101',
    bed_code: 'B',
    bed_id: 'e0000000-0000-0000-0000-000000000005',
    move_in_date: '2026-06-01',
    monthly_rent: 8000,
    security_deposit: 16000,
    notice_served_date: '2026-11-04',
    expected_vacate_date: '2026-12-04',
    actual_vacate_date: null,
    unpaid_rent: 8400,
    utility_dues: 0,
    damage_deductions: 0,
    deposit_refund_amount: null,
    settlement_notes: null,
    deposit_status: 'HELD',
    status: 'NOTICE',
    settled_at: null,
  },
  {
    id: '70000000-0000-0000-0000-000000000007',
    resident_id: 'f0000000-0000-0000-0000-000000000007',
    resident_name: 'Aniket Joshi',
    resident_phone: '919877788899',
    resident_email: 'aniket.j@example.com',
    room_number: '202',
    bed_code: 'C',
    bed_id: 'e0000000-0000-0000-0000-000000000013',
    move_in_date: '2026-10-15',
    monthly_rent: 6500,
    security_deposit: 13000,
    notice_served_date: '2026-11-10',
    expected_vacate_date: '2026-12-10',
    actual_vacate_date: null,
    unpaid_rent: 0,
    utility_dues: 0,
    damage_deductions: 0,
    deposit_refund_amount: null,
    settlement_notes: null,
    deposit_status: 'HELD',
    status: 'NOTICE',
    settled_at: null,
  },
  {
    id: '70000000-0000-0000-0000-000000000099',
    resident_id: 'f0000000-0000-0000-0000-000000000099',
    resident_name: 'Deepak Rao',
    resident_phone: '919812345678',
    resident_email: 'deepak.rao@example.com',
    room_number: '102',
    bed_code: 'B',
    bed_id: 'e0000000-0000-0000-0000-000000000008',
    move_in_date: '2026-03-01',
    monthly_rent: 9000,
    security_deposit: 18000,
    notice_served_date: '2026-10-01',
    expected_vacate_date: '2026-10-31',
    actual_vacate_date: '2026-10-31',
    unpaid_rent: 0,
    utility_dues: 650,
    damage_deductions: 500,
    deposit_refund_amount: 16850,
    settlement_notes: 'Room inspected. Key returned. Lost cupboard lock deduction ₹500. Electricity charges ₹650.',
    deposit_status: 'SETTLED',
    status: 'COMPLETED',
    settled_at: '2026-10-31T16:00:00Z',
  },
];

