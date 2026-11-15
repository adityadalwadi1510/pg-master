import { createAdminClient } from '@/lib/supabase/admin';
import { whatsappClient } from '@/lib/whatsapp/client';
import { sendTelegramNotificationToResident } from '@/lib/telegram/bot';
import {
  INITIAL_COMPLAINTS,
  ComplaintWithResident,
} from '@/lib/mock-complaints';
import type { ComplaintCategory, ComplaintStatus } from '@/types/database';

export interface ComplaintsFetchResult {
  isLive: boolean;
  complaints: ComplaintWithResident[];
  summary: {
    totalCount: number;
    openCount: number;
    inProgressCount: number;
    resolvedCount: number;
  };
  error?: string;
}

/**
 * Fetches all complaints from Supabase with resident, room, and bed details.
 */
export async function fetchComplaintsData(): Promise<ComplaintsFetchResult> {
  try {
    const supabase: any = createAdminClient();

    const { data: complaints, error: compErr } = await supabase
      .from('complaints')
      .select(`
        *,
        stays (
          id,
          residents ( id, full_name, phone_number ),
          beds (
            id,
            bed_code,
            rooms ( id, room_number )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (compErr || !complaints || complaints.length === 0) {
      const openCount = INITIAL_COMPLAINTS.filter((c) => c.status === 'OPEN').length;
      const inProgressCount = INITIAL_COMPLAINTS.filter((c) => c.status === 'IN_PROGRESS').length;
      const resolvedCount = INITIAL_COMPLAINTS.filter((c) => c.status === 'RESOLVED').length;

      return {
        isLive: false,
        complaints: INITIAL_COMPLAINTS,
        summary: {
          totalCount: INITIAL_COMPLAINTS.length,
          openCount,
          inProgressCount,
          resolvedCount,
        },
        error: compErr?.message || 'No complaints found',
      };
    }

    const transformed: ComplaintWithResident[] = complaints.map((c: any) => {
      const stay = c.stays;
      const resident = stay?.residents;
      const bed = stay?.beds;
      const room = bed?.rooms;

      return {
        id: c.id,
        ticket_number: c.ticket_number,
        stay_id: c.stay_id,
        resident_name: resident?.full_name || 'Resident',
        resident_phone: resident?.phone_number || '',
        room_number: room?.room_number || 'N/A',
        bed_code: bed?.bed_code || 'A',
        category: c.category as ComplaintCategory,
        description: c.description,
        photo_url: c.photo_url,
        assigned_to: c.assigned_to,
        resolution_note: c.resolution_note,
        status: c.status as ComplaintStatus,
        resolved_at: c.resolved_at,
        created_at: c.created_at,
      };
    });

    const openCount = transformed.filter((c) => c.status === 'OPEN').length;
    const inProgressCount = transformed.filter((c) => c.status === 'IN_PROGRESS').length;
    const resolvedCount = transformed.filter((c) => c.status === 'RESOLVED').length;

    return {
      isLive: true,
      complaints: transformed,
      summary: {
        totalCount: transformed.length,
        openCount,
        inProgressCount,
        resolvedCount,
      },
    };
  } catch (error: any) {
    console.error('fetchComplaintsData failed:', error);
    const openCount = INITIAL_COMPLAINTS.filter((c) => c.status === 'OPEN').length;
    const inProgressCount = INITIAL_COMPLAINTS.filter((c) => c.status === 'IN_PROGRESS').length;
    const resolvedCount = INITIAL_COMPLAINTS.filter((c) => c.status === 'RESOLVED').length;

    return {
      isLive: false,
      complaints: INITIAL_COMPLAINTS,
      summary: {
        totalCount: INITIAL_COMPLAINTS.length,
        openCount,
        inProgressCount,
        resolvedCount,
      },
      error: error?.message || 'Database connection error',
    };
  }
}

/**
 * Creates a new complaint ticket in Supabase (FR-4.1)
 */
export async function createComplaintDB(params: {
  stayId: string;
  category: ComplaintCategory;
  description: string;
  photoUrl?: string;
}) {
  try {
    const supabase: any = createAdminClient();

    const { data: stay, error: stayErr } = await supabase
      .from('stays')
      .select('id, organization_id')
      .eq('id', params.stayId)
      .single();

    if (stayErr || !stay) {
      throw new Error('Stay not found');
    }

    const { data: complaint, error: compErr } = await supabase
      .from('complaints')
      .insert({
        organization_id: stay.organization_id,
        stay_id: params.stayId,
        category: params.category,
        description: params.description,
        photo_url: params.photoUrl || null,
        status: 'OPEN',
      })
      .select('*')
      .single();

    if (compErr) throw compErr;

    return { success: true, complaint };
  } catch (err: any) {
    console.error('createComplaintDB error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Resolves a complaint in Supabase (FR-4.4)
 */
export async function resolveComplaintDB(params: {
  complaintId: string;
  resolutionNote: string;
  notifyWhatsApp?: boolean;
}) {
  try {
    const supabase: any = createAdminClient();

    const { data: updated, error } = await supabase
      .from('complaints')
      .update({
        status: 'RESOLVED',
        resolved_at: new Date().toISOString(),
        resolution_note: params.resolutionNote,
      })
      .eq('id', params.complaintId)
      .select('*, stays ( residents ( phone_number, full_name ) )')
      .single();

    if (error) throw error;

    // Dispatch automated resolution ping (WhatsApp & Telegram) per FR-4.4
    if (params.notifyWhatsApp !== false) {
      const phone = updated?.stays?.residents?.phone_number;
      if (phone) {
        const resolutionMsg =
          `🛠️ *Maintenance Ticket Resolved!*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🎫 *Ticket #:* #${updated.ticket_number}\n` +
          `📁 *Category:* ${updated.category}\n` +
          `📝 *Issue Description:* ${updated.description || 'N/A'}\n` +
          `✅ *Resolution Note:* "${params.resolutionNote}"\n` +
          `⏱️ *Resolved At:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n\n` +
          `Thank you for helping us keep our property in top condition!`;

        try {
          await whatsappClient.sendTextMessage(phone, resolutionMsg);
        } catch (waErr: any) {
          console.warn('WhatsApp resolution ping failed:', waErr.message);
        }

        try {
          await sendTelegramNotificationToResident(phone, resolutionMsg);
        } catch (tgErr: any) {
          console.warn('Telegram resolution ping failed:', tgErr.message);
        }
      }
    }

    return { success: true, complaint: updated };
  } catch (err: any) {
    console.error('resolveComplaintDB error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Assigns a technician or staff member to a complaint
 */
export async function assignComplaintDB(params: {
  complaintId: string;
  assignedTo: string;
}) {
  try {
    const supabase: any = createAdminClient();

    const { data: updated, error } = await supabase
      .from('complaints')
      .update({
        assigned_to: params.assignedTo,
        status: 'IN_PROGRESS',
      })
      .eq('id', params.complaintId)
      .select('*')
      .single();

    if (error) throw error;

    return { success: true, complaint: updated };
  } catch (err: any) {
    console.error('assignComplaintDB error:', err);
    return { success: false, error: err.message };
  }
}

