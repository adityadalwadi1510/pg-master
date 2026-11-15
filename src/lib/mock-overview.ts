export interface MonthlyTrendData {
  month: string;
  billed: number;
  collected: number;
}

export interface ActivityItem {
  id: string;
  type: 'PAYMENT' | 'COMPLAINT' | 'NOTICE' | 'CHECKIN';
  title: string;
  description: string;
  timeAgo: string;
  amount?: number;
}

export const MONTHLY_TREND_DATA: MonthlyTrendData[] = [
  { month: 'Jun', billed: 48000, collected: 48000 },
  { month: 'Jul', billed: 56000, collected: 56000 },
  { month: 'Aug', billed: 64000, collected: 62000 },
  { month: 'Sep', billed: 68000, collected: 66000 },
  { month: 'Oct', billed: 72000, collected: 71350 },
  { month: 'Nov', billed: 67300, collected: 45600 },
];

export const RECENT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'PAYMENT',
    title: 'UPI Payment Received',
    description: 'Amit Verma paid rent for Room G02 (Bed A)',
    timeAgo: '2 hours ago',
    amount: 15600,
  },
  {
    id: 'act-2',
    type: 'COMPLAINT',
    title: 'Wi-Fi Ticket Logged',
    description: 'Priyanshu Patel reported 5GHz router drop on 1st Floor',
    timeAgo: '4 hours ago',
  },
  {
    id: 'act-3',
    type: 'NOTICE',
    title: '30-Day Move-out Notice',
    description: 'Vikram Singh served vacate notice for Room 101 (Bed B)',
    timeAgo: '1 day ago',
  },
  {
    id: 'act-4',
    type: 'PAYMENT',
    title: 'Partial Rent Received',
    description: 'Priyanshu Patel paid ₹5,000 via UPI (INV-1003)',
    timeAgo: '1 day ago',
    amount: 5000,
  },
  {
    id: 'act-5',
    type: 'CHECKIN',
    title: 'New Resident Onboarded',
    description: 'Aniket Joshi checked in to Room 202 (Bed C)',
    timeAgo: '3 days ago',
  },
];

