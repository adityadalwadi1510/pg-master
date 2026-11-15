export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BedStatus = 'VACANT' | 'OCCUPIED' | 'NOTICE_PERIOD' | 'MAINTENANCE';
export type SharingType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_PLUS';
export type GenderType = 'MALE' | 'FEMALE' | 'COED';
export type StayStatus = 'ACTIVE' | 'NOTICE' | 'COMPLETED' | 'TERMINATED';
export type DepositStatus = 'HELD' | 'SETTLED' | 'REFUNDED';
export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED';
export type PaymentMethod = 'UPI' | 'CASH' | 'BANK_TRANSFER';
export type ComplaintCategory = 'WIFI' | 'CLEANING' | 'PLUMBING' | 'ELECTRICAL' | 'FOOD' | 'OTHER';
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
export type BotSessionState =
  | 'IDLE'
  | 'AWAITING_COMPLAINT_CATEGORY'
  | 'AWAITING_COMPLAINT_DETAILS'
  | 'AWAITING_VACATE_DATE';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          business_name: string;
          owner_name: string;
          phone_number: string;
          upi_vpa: string;
          subscription_status: 'PILOT_ACTIVE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
          created_at: string;
        };
        Insert: {
          id?: string;
          business_name: string;
          owner_name: string;
          phone_number: string;
          upi_vpa: string;
          subscription_status?: 'PILOT_ACTIVE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
          created_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          owner_name?: string;
          phone_number?: string;
          upi_vpa?: string;
          subscription_status?: 'PILOT_ACTIVE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
          created_at?: string;
        };
      };
      organization_members: {
        Row: {
          organization_id: string;
          user_id: string;
          role: 'OWNER' | 'MANAGER';
          created_at: string;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role?: 'OWNER' | 'MANAGER';
          created_at?: string;
        };
        Update: {
          organization_id?: string;
          user_id?: string;
          role?: 'OWNER' | 'MANAGER';
          created_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          gender_type: GenderType | null;
          address: string | null;
          support_phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          gender_type?: GenderType | null;
          address?: string | null;
          support_phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          gender_type?: GenderType | null;
          address?: string | null;
          support_phone?: string | null;
          created_at?: string;
        };
      };
      floors: {
        Row: {
          id: string;
          property_id: string;
          organization_id: string;
          floor_number: number;
          label: string | null;
        };
        Insert: {
          id?: string;
          property_id: string;
          organization_id: string;
          floor_number: number;
          label?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string;
          organization_id?: string;
          floor_number?: number;
          label?: string | null;
        };
      };
      rooms: {
        Row: {
          id: string;
          floor_id: string;
          property_id: string;
          organization_id: string;
          room_number: string;
          sharing_type: SharingType;
          base_rent_per_bed: number;
        };
        Insert: {
          id?: string;
          floor_id: string;
          property_id: string;
          organization_id: string;
          room_number: string;
          sharing_type: SharingType;
          base_rent_per_bed: number;
        };
        Update: {
          id?: string;
          floor_id?: string;
          property_id?: string;
          organization_id?: string;
          room_number?: string;
          sharing_type?: SharingType;
          base_rent_per_bed?: number;
        };
      };
      beds: {
        Row: {
          id: string;
          room_id: string;
          organization_id: string;
          bed_code: string;
          status: BedStatus;
        };
        Insert: {
          id?: string;
          room_id: string;
          organization_id: string;
          bed_code: string;
          status?: BedStatus;
        };
        Update: {
          id?: string;
          room_id?: string;
          organization_id?: string;
          bed_code?: string;
          status?: BedStatus;
        };
      };
      residents: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          phone_number: string;
          email: string | null;
          emergency_contact: string | null;
          permanent_address: string | null;
          id_proof_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          full_name: string;
          phone_number: string;
          email?: string | null;
          emergency_contact?: string | null;
          permanent_address?: string | null;
          id_proof_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          full_name?: string;
          phone_number?: string;
          email?: string | null;
          emergency_contact?: string | null;
          permanent_address?: string | null;
          id_proof_url?: string | null;
          created_at?: string;
        };
      };
      stays: {
        Row: {
          id: string;
          organization_id: string;
          resident_id: string;
          bed_id: string;
          move_in_date: string;
          notice_served_date: string | null;
          expected_vacate_date: string | null;
          actual_vacate_date: string | null;
          monthly_rent: number;
          security_deposit: number;
          damage_deductions: number;
          settlement_notes: string | null;
          deposit_refund_amount: number | null;
          settled_at: string | null;
          deposit_status: DepositStatus;
          status: StayStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          resident_id: string;
          bed_id: string;
          move_in_date: string;
          notice_served_date?: string | null;
          expected_vacate_date?: string | null;
          actual_vacate_date?: string | null;
          monthly_rent: number;
          security_deposit: number;
          damage_deductions?: number;
          settlement_notes?: string | null;
          deposit_refund_amount?: number | null;
          settled_at?: string | null;
          deposit_status?: DepositStatus;
          status?: StayStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          resident_id?: string;
          bed_id?: string;
          move_in_date?: string;
          notice_served_date?: string | null;
          expected_vacate_date?: string | null;
          actual_vacate_date?: string | null;
          monthly_rent?: number;
          security_deposit?: number;
          damage_deductions?: number;
          settlement_notes?: string | null;
          deposit_refund_amount?: number | null;
          settled_at?: string | null;
          deposit_status?: DepositStatus;
          status?: StayStatus;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: number;
          organization_id: string;
          stay_id: string;
          billing_month: string;
          base_rent: number;
          electricity_charges: number;
          maintenance_charges: number;
          addon_charges: number;
          discount_amount: number;
          total_amount: number;
          amount_paid: number;
          status: InvoiceStatus;
          due_date: string;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_number?: number;
          organization_id: string;
          stay_id: string;
          billing_month: string;
          base_rent: number;
          electricity_charges?: number;
          maintenance_charges?: number;
          addon_charges?: number;
          discount_amount?: number;
          amount_paid?: number;
          status?: InvoiceStatus;
          due_date: string;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          stay_id?: string;
          billing_month?: string;
          base_rent?: number;
          electricity_charges?: number;
          maintenance_charges?: number;
          addon_charges?: number;
          discount_amount?: number;
          amount_paid?: number;
          status?: InvoiceStatus;
          due_date?: string;
          paid_at?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          organization_id: string;
          invoice_id: string;
          amount: number;
          method: PaymentMethod;
          reference: string | null;
          paid_at: string;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          invoice_id: string;
          amount: number;
          method: PaymentMethod;
          reference?: string | null;
          paid_at?: string;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          invoice_id?: string;
          amount?: number;
          method?: PaymentMethod;
          reference?: string | null;
          paid_at?: string;
          recorded_by?: string | null;
          created_at?: string;
        };
      };
      complaints: {
        Row: {
          id: string;
          ticket_number: number;
          organization_id: string;
          stay_id: string;
          category: ComplaintCategory;
          description: string | null;
          photo_url: string | null;
          assigned_to: string | null;
          resolution_note: string | null;
          status: ComplaintStatus;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_number?: number;
          organization_id: string;
          stay_id: string;
          category: ComplaintCategory;
          description?: string | null;
          photo_url?: string | null;
          assigned_to?: string | null;
          resolution_note?: string | null;
          status?: ComplaintStatus;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          stay_id?: string;
          category?: ComplaintCategory;
          description?: string | null;
          photo_url?: string | null;
          assigned_to?: string | null;
          resolution_note?: string | null;
          status?: ComplaintStatus;
          resolved_at?: string | null;
          created_at?: string;
        };
      };
      webhook_events: {
        Row: {
          message_id: string;
          received_at: string;
        };
        Insert: {
          message_id: string;
          received_at?: string;
        };
        Update: {
          message_id?: string;
          received_at?: string;
        };
      };
      bot_sessions: {
        Row: {
          phone_number: string;
          stay_id: string | null;
          state: BotSessionState;
          context: Json;
          expires_at: string;
          updated_at: string;
        };
        Insert: {
          phone_number: string;
          stay_id?: string | null;
          state?: BotSessionState;
          context?: Json;
          expires_at: string;
          updated_at?: string;
        };
        Update: {
          phone_number?: string;
          stay_id?: string | null;
          state?: BotSessionState;
          context?: Json;
          expires_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

