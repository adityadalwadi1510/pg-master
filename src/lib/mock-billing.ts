import type { InvoiceStatus, PaymentMethod } from '@/types/database';

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  paid_at: string;
}

export interface InvoiceWithResident {
  id: string;
  invoice_number: number;
  stay_id: string;
  resident_name: string;
  resident_phone: string;
  room_number: string;
  bed_code: string;
  billing_month: string; // '2026-11-01'
  base_rent: number;
  electricity_charges: number;
  maintenance_charges: number;
  addon_charges: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
  payments: PaymentRecord[];
}

export const INITIAL_INVOICES: InvoiceWithResident[] = [
  {
    id: '80000000-0000-0000-0000-000000000001',
    invoice_number: 1001,
    stay_id: '70000000-0000-0000-0000-000000000001',
    resident_name: 'Rahul Sharma',
    resident_phone: '919811122233',
    room_number: 'G01',
    bed_code: 'A',
    billing_month: '2026-11-01',
    base_rent: 9000,
    electricity_charges: 450,
    maintenance_charges: 0,
    addon_charges: 0,
    discount_amount: 0,
    total_amount: 9450,
    amount_paid: 0,
    balance_due: 9450,
    status: 'UNPAID',
    due_date: '2026-11-05',
    paid_at: null,
    payments: [],
  },
  {
    id: '80000000-0000-0000-0000-000000000002',
    invoice_number: 1002,
    stay_id: '70000000-0000-0000-0000-000000000002',
    resident_name: 'Amit Verma',
    resident_phone: '919822233344',
    room_number: 'G02',
    bed_code: 'A',
    billing_month: '2026-11-01',
    base_rent: 15000,
    electricity_charges: 600,
    maintenance_charges: 0,
    addon_charges: 0,
    discount_amount: 0,
    total_amount: 15600,
    amount_paid: 15600,
    balance_due: 0,
    status: 'PAID',
    due_date: '2026-11-05',
    paid_at: '2026-11-03T14:30:00Z',
    payments: [
      {
        id: 'pay-001',
        amount: 15600,
        method: 'UPI',
        reference: 'UPI/234890123490',
        paid_at: '2026-11-03T14:30:00Z',
      },
    ],
  },
  {
    id: '80000000-0000-0000-0000-000000000003',
    invoice_number: 1003,
    stay_id: '70000000-0000-0000-0000-000000000003',
    resident_name: 'Priyanshu Patel',
    resident_phone: '919833344455',
    room_number: '101',
    bed_code: 'A',
    billing_month: '2026-11-01',
    base_rent: 8000,
    electricity_charges: 350,
    maintenance_charges: 0,
    addon_charges: 0,
    discount_amount: 0,
    total_amount: 8350,
    amount_paid: 5000,
    balance_due: 3350,
    status: 'PARTIALLY_PAID',
    due_date: '2026-11-05',
    paid_at: null,
    payments: [
      {
        id: 'pay-002',
        amount: 5000,
        method: 'UPI',
        reference: 'UPI/890123456789',
        paid_at: '2026-11-04T10:15:00Z',
      },
    ],
  },
  {
    id: '80000000-0000-0000-0000-000000000004',
    invoice_number: 1004,
    stay_id: '70000000-0000-0000-0000-000000000004',
    resident_name: 'Vikram Singh',
    resident_phone: '919844455566',
    room_number: '101',
    bed_code: 'B',
    billing_month: '2026-11-01',
    base_rent: 8000,
    electricity_charges: 400,
    maintenance_charges: 0,
    addon_charges: 0,
    discount_amount: 0,
    total_amount: 8400,
    amount_paid: 0,
    balance_due: 8400,
    status: 'UNPAID',
    due_date: '2026-11-05',
    paid_at: null,
    payments: [],
  },
  {
    id: '80000000-0000-0000-0000-000000000005',
    invoice_number: 1005,
    stay_id: '70000000-0000-0000-0000-000000000005',
    resident_name: 'Rohan Gupta',
    resident_phone: '919855566677',
    room_number: '201',
    bed_code: 'A',
    billing_month: '2026-11-01',
    base_rent: 9500,
    electricity_charges: 0,
    maintenance_charges: 0,
    addon_charges: 0,
    discount_amount: 0,
    total_amount: 9500,
    amount_paid: 9500,
    balance_due: 0,
    status: 'PAID',
    due_date: '2026-11-05',
    paid_at: '2026-11-02T18:00:00Z',
    payments: [
      {
        id: 'pay-003',
        amount: 9500,
        method: 'BANK_TRANSFER',
        reference: 'IMPS/439201928374',
        paid_at: '2026-11-02T18:00:00Z',
      },
    ],
  },
  {
    id: '80000000-0000-0000-0000-000000000006',
    invoice_number: 1006,
    stay_id: '70000000-0000-0000-0000-000000000006',
    resident_name: 'Karthik Reddy',
    resident_phone: '919866677788',
    room_number: '201',
    bed_code: 'B',
    billing_month: '2026-11-01',
    base_rent: 9500,
    electricity_charges: 0,
    maintenance_charges: 0,
    addon_charges: 0,
    discount_amount: 0,
    total_amount: 9500,
    amount_paid: 9500,
    balance_due: 0,
    status: 'PAID',
    due_date: '2026-11-05',
    paid_at: '2026-11-03T11:20:00Z',
    payments: [
      {
        id: 'pay-004',
        amount: 9500,
        method: 'UPI',
        reference: 'UPI/928374650192',
        paid_at: '2026-11-03T11:20:00Z',
      },
    ],
  },
  {
    id: '80000000-0000-0000-0000-000000000007',
    invoice_number: 1007,
    stay_id: '70000000-0000-0000-0000-000000000007',
    resident_name: 'Aniket Joshi',
    resident_phone: '919877788899',
    room_number: '202',
    bed_code: 'C',
    billing_month: '2026-11-01',
    base_rent: 6500,
    electricity_charges: 0,
    maintenance_charges: 0,
    addon_charges: 0,
    discount_amount: 0,
    total_amount: 6500,
    amount_paid: 6500,
    balance_due: 0,
    status: 'PAID',
    due_date: '2026-11-05',
    paid_at: '2026-11-04T09:45:00Z',
    payments: [
      {
        id: 'pay-005',
        amount: 6500,
        method: 'CASH',
        reference: 'Cash Received at Desk',
        paid_at: '2026-11-04T09:45:00Z',
      },
    ],
  },
];

