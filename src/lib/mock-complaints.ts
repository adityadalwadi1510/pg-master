import type { ComplaintCategory, ComplaintStatus } from '@/types/database';

export interface ComplaintWithResident {
  id: string;
  ticket_number: number;
  stay_id: string;
  resident_name: string;
  resident_phone: string;
  room_number: string;
  bed_code: string;
  category: ComplaintCategory;
  description: string;
  photo_url?: string | null;
  assigned_to?: string | null;
  resolution_note?: string | null;
  status: ComplaintStatus;
  resolved_at?: string | null;
  created_at: string;
}

export const INITIAL_COMPLAINTS: ComplaintWithResident[] = [
  {
    id: 'comp-001',
    ticket_number: 101,
    stay_id: '70000000-0000-0000-0000-000000000003',
    resident_name: 'Priyanshu Patel',
    resident_phone: '919833344455',
    room_number: '101',
    bed_code: 'A',
    category: 'WIFI',
    description: '5GHz Wi-Fi router on 1st floor dropping connection repeatedly. Speed is dropping below 2 Mbps during office hours.',
    photo_url: null,
    assigned_to: 'Ramesh (Warden)',
    resolution_note: null,
    status: 'OPEN',
    resolved_at: null,
    created_at: '2026-11-14T08:30:00Z',
  },
  {
    id: 'comp-002',
    ticket_number: 102,
    stay_id: '70000000-0000-0000-0000-000000000001',
    resident_name: 'Rahul Sharma',
    resident_phone: '919811122233',
    room_number: 'G01',
    bed_code: 'A',
    category: 'PLUMBING',
    description: 'Bathroom basin tap leaking slowly, water dripping continuously all night.',
    photo_url: null,
    assigned_to: 'Suresh (Plumber)',
    resolution_note: null,
    status: 'IN_PROGRESS',
    resolved_at: null,
    created_at: '2026-11-13T17:45:00Z',
  },
  {
    id: 'comp-003',
    ticket_number: 103,
    stay_id: '70000000-0000-0000-0000-000000000005',
    resident_name: 'Rohan Gupta',
    resident_phone: '919855566677',
    room_number: '201',
    bed_code: 'A',
    category: 'ELECTRICAL',
    description: 'Study table 3-pin power socket switch sparking slightly when connecting laptop charger.',
    photo_url: null,
    assigned_to: null,
    resolution_note: null,
    status: 'OPEN',
    resolved_at: null,
    created_at: '2026-11-14T09:15:00Z',
  },
  {
    id: 'comp-004',
    ticket_number: 104,
    stay_id: '70000000-0000-0000-0000-000000000002',
    resident_name: 'Amit Verma',
    resident_phone: '919822233344',
    room_number: 'G02',
    bed_code: 'A',
    category: 'FOOD',
    description: 'Dinner chapati was dry and cold yesterday. Please check with kitchen staff.',
    photo_url: null,
    assigned_to: 'Chef Mohan',
    resolution_note: 'Spoke with kitchen team. Food warmer container installed at the dining counter.',
    status: 'RESOLVED',
    resolved_at: '2026-11-13T21:00:00Z',
    created_at: '2026-11-13T19:30:00Z',
  },
  {
    id: 'comp-005',
    ticket_number: 105,
    stay_id: '70000000-0000-0000-0000-000000000006',
    resident_name: 'Karthik Reddy',
    resident_phone: '919866677788',
    room_number: '201',
    bed_code: 'B',
    category: 'CLEANING',
    description: 'Balcony dustbin not emptied by morning housekeeping shift.',
    photo_url: null,
    assigned_to: 'Anita (Cleaning Lead)',
    resolution_note: 'Cleared by afternoon housekeeping round. Warden informed.',
    status: 'RESOLVED',
    resolved_at: '2026-11-14T11:00:00Z',
    created_at: '2026-11-14T10:00:00Z',
  },
];

