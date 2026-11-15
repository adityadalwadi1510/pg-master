import type { BedStatus, SharingType, GenderType, InvoiceStatus } from '@/types/database';

export interface BedWithOccupant {
  id: string;
  room_id: string;
  room_number: string;
  floor_id: string;
  floor_number: number;
  floor_label: string;
  bed_code: string;
  status: BedStatus;
  base_rent: number;
  sharing_type: SharingType;
  stay?: {
    id: string;
    resident_id: string;
    resident_name: string;
    resident_phone: string;
    resident_email?: string | null;
    emergency_contact?: string | null;
    move_in_date: string;
    monthly_rent: number;
    security_deposit: number;
    notice_served_date?: string | null;
    expected_vacate_date?: string | null;
    invoice?: {
      id: string;
      invoice_number: number;
      total_amount: number;
      amount_paid: number;
      status: InvoiceStatus;
      due_date: string;
    };
  };
}

export interface RoomWithBeds {
  id: string;
  floor_id: string;
  floor_number: number;
  room_number: string;
  sharing_type: SharingType;
  base_rent_per_bed: number;
  beds: BedWithOccupant[];
}

export interface FloorWithRooms {
  id: string;
  floor_number: number;
  label: string;
  rooms: RoomWithBeds[];
}

export interface PropertyData {
  id: string;
  name: string;
  gender_type: GenderType;
  address: string;
  support_phone: string;
  floors: FloorWithRooms[];
}

export const INITIAL_PROPERTY_DATA: PropertyData = {
  id: 'b0000000-0000-0000-0000-000000000001',
  name: "GreenNest Luxury Men's PG - HSR Layout",
  gender_type: 'MALE',
  address: 'Plot 42, 14th Main, Sector 4, HSR Layout, Bengaluru, Karnataka 560102',
  support_phone: '+91 98765 43210',
  floors: [
    {
      id: 'c0000000-0000-0000-0000-000000000000',
      floor_number: 0,
      label: 'Ground Floor',
      rooms: [
        {
          id: 'd0000000-0000-0000-0000-000000000001',
          floor_id: 'c0000000-0000-0000-0000-000000000000',
          floor_number: 0,
          room_number: 'G01',
          sharing_type: 'DOUBLE',
          base_rent_per_bed: 9000,
          beds: [
            {
              id: 'e0000000-0000-0000-0000-000000000001',
              room_id: 'd0000000-0000-0000-0000-000000000001',
              room_number: 'G01',
              floor_id: 'c0000000-0000-0000-0000-000000000000',
              floor_number: 0,
              floor_label: 'Ground Floor',
              bed_code: 'A',
              status: 'OCCUPIED',
              base_rent: 9000,
              sharing_type: 'DOUBLE',
              stay: {
                id: '70000000-0000-0000-0000-000000000001',
                resident_id: 'f0000000-0000-0000-0000-000000000001',
                resident_name: 'Rahul Sharma',
                resident_phone: '919811122233',
                resident_email: 'rahul.sharma@example.com',
                emergency_contact: '919811122230',
                move_in_date: '2026-08-01',
                monthly_rent: 9000,
                security_deposit: 18000,
                invoice: {
                  id: '80000000-0000-0000-0000-000000000001',
                  invoice_number: 1001,
                  total_amount: 9450,
                  amount_paid: 0,
                  status: 'UNPAID',
                  due_date: '2026-11-05',
                },
              },
            },
            {
              id: 'e0000000-0000-0000-0000-000000000002',
              room_id: 'd0000000-0000-0000-0000-000000000001',
              room_number: 'G01',
              floor_id: 'c0000000-0000-0000-0000-000000000000',
              floor_number: 0,
              floor_label: 'Ground Floor',
              bed_code: 'B',
              status: 'VACANT',
              base_rent: 9000,
              sharing_type: 'DOUBLE',
            },
          ],
        },
        {
          id: 'd0000000-0000-0000-0000-000000000002',
          floor_id: 'c0000000-0000-0000-0000-000000000000',
          floor_number: 0,
          room_number: 'G02',
          sharing_type: 'SINGLE',
          base_rent_per_bed: 15000,
          beds: [
            {
              id: 'e0000000-0000-0000-0000-000000000003',
              room_id: 'd0000000-0000-0000-0000-000000000002',
              room_number: 'G02',
              floor_id: 'c0000000-0000-0000-0000-000000000000',
              floor_number: 0,
              floor_label: 'Ground Floor',
              bed_code: 'A',
              status: 'OCCUPIED',
              base_rent: 15000,
              sharing_type: 'SINGLE',
              stay: {
                id: '70000000-0000-0000-0000-000000000002',
                resident_id: 'f0000000-0000-0000-0000-000000000002',
                resident_name: 'Amit Verma',
                resident_phone: '919822233344',
                resident_email: 'amit.verma@example.com',
                emergency_contact: '919822233340',
                move_in_date: '2026-07-15',
                monthly_rent: 15000,
                security_deposit: 30000,
                invoice: {
                  id: '80000000-0000-0000-0000-000000000002',
                  invoice_number: 1002,
                  total_amount: 15600,
                  amount_paid: 15600,
                  status: 'PAID',
                  due_date: '2026-11-05',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      floor_number: 1,
      label: '1st Floor',
      rooms: [
        {
          id: 'd0000000-0000-0000-0000-000000000003',
          floor_id: 'c0000000-0000-0000-0000-000000000001',
          floor_number: 1,
          room_number: '101',
          sharing_type: 'TRIPLE',
          base_rent_per_bed: 8000,
          beds: [
            {
              id: 'e0000000-0000-0000-0000-000000000004',
              room_id: 'd0000000-0000-0000-0000-000000000003',
              room_number: '101',
              floor_id: 'c0000000-0000-0000-0000-000000000001',
              floor_number: 1,
              floor_label: '1st Floor',
              bed_code: 'A',
              status: 'OCCUPIED',
              base_rent: 8000,
              sharing_type: 'TRIPLE',
              stay: {
                id: '70000000-0000-0000-0000-000000000003',
                resident_id: 'f0000000-0000-0000-0000-000000000003',
                resident_name: 'Priyanshu Patel',
                resident_phone: '919833344455',
                resident_email: 'priyanshu@example.com',
                move_in_date: '2026-09-01',
                monthly_rent: 8000,
                security_deposit: 16000,
                invoice: {
                  id: '80000000-0000-0000-0000-000000000003',
                  invoice_number: 1003,
                  total_amount: 8350,
                  amount_paid: 5000,
                  status: 'PARTIALLY_PAID',
                  due_date: '2026-11-05',
                },
              },
            },
            {
              id: 'e0000000-0000-0000-0000-000000000005',
              room_id: 'd0000000-0000-0000-0000-000000000003',
              room_number: '101',
              floor_id: 'c0000000-0000-0000-0000-000000000001',
              floor_number: 1,
              floor_label: '1st Floor',
              bed_code: 'B',
              status: 'NOTICE_PERIOD',
              base_rent: 8000,
              sharing_type: 'TRIPLE',
              stay: {
                id: '70000000-0000-0000-0000-000000000004',
                resident_id: 'f0000000-0000-0000-0000-000000000004',
                resident_name: 'Vikram Singh',
                resident_phone: '919844455566',
                resident_email: 'vikram.singh@example.com',
                move_in_date: '2026-06-01',
                monthly_rent: 8000,
                security_deposit: 16000,
                notice_served_date: '2026-11-04',
                expected_vacate_date: '2026-12-04',
                invoice: {
                  id: '80000000-0000-0000-0000-000000000004',
                  invoice_number: 1004,
                  total_amount: 8400,
                  amount_paid: 0,
                  status: 'UNPAID',
                  due_date: '2026-11-05',
                },
              },
            },
            {
              id: 'e0000000-0000-0000-0000-000000000006',
              room_id: 'd0000000-0000-0000-0000-000000000003',
              room_number: '101',
              floor_id: 'c0000000-0000-0000-0000-000000000001',
              floor_number: 1,
              floor_label: '1st Floor',
              bed_code: 'C',
              status: 'VACANT',
              base_rent: 8000,
              sharing_type: 'TRIPLE',
            },
          ],
        },
        {
          id: 'd0000000-0000-0000-0000-000000000004',
          floor_id: 'c0000000-0000-0000-0000-000000000001',
          floor_number: 1,
          room_number: '102',
          sharing_type: 'DOUBLE',
          base_rent_per_bed: 9000,
          beds: [
            {
              id: 'e0000000-0000-0000-0000-000000000007',
              room_id: 'd0000000-0000-0000-0000-000000000004',
              room_number: '102',
              floor_id: 'c0000000-0000-0000-0000-000000000001',
              floor_number: 1,
              floor_label: '1st Floor',
              bed_code: 'A',
              status: 'MAINTENANCE',
              base_rent: 9000,
              sharing_type: 'DOUBLE',
            },
            {
              id: 'e0000000-0000-0000-0000-000000000008',
              room_id: 'd0000000-0000-0000-0000-000000000004',
              room_number: '102',
              floor_id: 'c0000000-0000-0000-0000-000000000001',
              floor_number: 1,
              floor_label: '1st Floor',
              bed_code: 'B',
              status: 'VACANT',
              base_rent: 9000,
              sharing_type: 'DOUBLE',
            },
          ],
        },
      ],
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      floor_number: 2,
      label: '2nd Floor',
      rooms: [
        {
          id: 'd0000000-0000-0000-0000-000000000005',
          floor_id: 'c0000000-0000-0000-0000-000000000002',
          floor_number: 2,
          room_number: '201',
          sharing_type: 'DOUBLE',
          base_rent_per_bed: 9500,
          beds: [
            {
              id: 'e0000000-0000-0000-0000-000000000009',
              room_id: 'd0000000-0000-0000-0000-000000000005',
              room_number: '201',
              floor_id: 'c0000000-0000-0000-0000-000000000002',
              floor_number: 2,
              floor_label: '2nd Floor',
              bed_code: 'A',
              status: 'OCCUPIED',
              base_rent: 9500,
              sharing_type: 'DOUBLE',
              stay: {
                id: '70000000-0000-0000-0000-000000000005',
                resident_id: 'f0000000-0000-0000-0000-000000000005',
                resident_name: 'Rohan Gupta',
                resident_phone: '919855566677',
                resident_email: 'rohan.gupta@example.com',
                move_in_date: '2026-05-01',
                monthly_rent: 9500,
                security_deposit: 19000,
                invoice: {
                  id: '80000000-0000-0000-0000-000000000005',
                  invoice_number: 1005,
                  total_amount: 9500,
                  amount_paid: 9500,
                  status: 'PAID',
                  due_date: '2026-11-05',
                },
              },
            },
            {
              id: 'e0000000-0000-0000-0000-000000000010',
              room_id: 'd0000000-0000-0000-0000-000000000005',
              room_number: '201',
              floor_id: 'c0000000-0000-0000-0000-000000000002',
              floor_number: 2,
              floor_label: '2nd Floor',
              bed_code: 'B',
              status: 'OCCUPIED',
              base_rent: 9500,
              sharing_type: 'DOUBLE',
              stay: {
                id: '70000000-0000-0000-0000-000000000006',
                resident_id: 'f0000000-0000-0000-0000-000000000006',
                resident_name: 'Karthik Reddy',
                resident_phone: '919866677788',
                resident_email: 'karthik.r@example.com',
                move_in_date: '2026-10-01',
                monthly_rent: 9500,
                security_deposit: 19000,
                invoice: {
                  id: '80000000-0000-0000-0000-000000000006',
                  invoice_number: 1006,
                  total_amount: 9500,
                  amount_paid: 9500,
                  status: 'PAID',
                  due_date: '2026-11-05',
                },
              },
            },
          ],
        },
        {
          id: 'd0000000-0000-0000-0000-000000000006',
          floor_id: 'c0000000-0000-0000-0000-000000000002',
          floor_number: 2,
          room_number: '202',
          sharing_type: 'FOUR_PLUS',
          base_rent_per_bed: 6500,
          beds: [
            {
              id: 'e0000000-0000-0000-0000-000000000011',
              room_id: 'd0000000-0000-0000-0000-000000000006',
              room_number: '202',
              floor_id: 'c0000000-0000-0000-0000-000000000002',
              floor_number: 2,
              floor_label: '2nd Floor',
              bed_code: 'A',
              status: 'VACANT',
              base_rent: 6500,
              sharing_type: 'FOUR_PLUS',
            },
            {
              id: 'e0000000-0000-0000-0000-000000000012',
              room_id: 'd0000000-0000-0000-0000-000000000006',
              room_number: '202',
              floor_id: 'c0000000-0000-0000-0000-000000000002',
              floor_number: 2,
              floor_label: '2nd Floor',
              bed_code: 'B',
              status: 'VACANT',
              base_rent: 6500,
              sharing_type: 'FOUR_PLUS',
            },
            {
              id: 'e0000000-0000-0000-0000-000000000013',
              room_id: 'd0000000-0000-0000-0000-000000000006',
              room_number: '202',
              floor_id: 'c0000000-0000-0000-0000-000000000002',
              floor_number: 2,
              floor_label: '2nd Floor',
              bed_code: 'C',
              status: 'OCCUPIED',
              base_rent: 6500,
              sharing_type: 'FOUR_PLUS',
              stay: {
                id: '70000000-0000-0000-0000-000000000007',
                resident_id: 'f0000000-0000-0000-0000-000000000007',
                resident_name: 'Aniket Joshi',
                resident_phone: '919877788899',
                resident_email: 'aniket.j@example.com',
                move_in_date: '2026-10-15',
                monthly_rent: 6500,
                security_deposit: 13000,
                invoice: {
                  id: '80000000-0000-0000-0000-000000000007',
                  invoice_number: 1007,
                  total_amount: 6500,
                  amount_paid: 6500,
                  status: 'PAID',
                  due_date: '2026-11-05',
                },
              },
            },
            {
              id: 'e0000000-0000-0000-0000-000000000014',
              room_id: 'd0000000-0000-0000-0000-000000000006',
              room_number: '202',
              floor_id: 'c0000000-0000-0000-0000-000000000002',
              floor_number: 2,
              floor_label: '2nd Floor',
              bed_code: 'D',
              status: 'VACANT',
              base_rent: 6500,
              sharing_type: 'FOUR_PLUS',
            },
          ],
        },
      ],
    },
  ],
};

