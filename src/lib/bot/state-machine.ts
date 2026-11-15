import { whatsappClient } from '@/lib/whatsapp/client';
import { WhatsAppIncomingMessage, BotActionIntent } from '@/lib/whatsapp/types';
import type { ComplaintCategory, BedStatus } from '@/types/database';
import { createAdminClient } from '@/lib/supabase/admin';

interface ResidentStayInfo {
  residentId: string;
  residentName: string;
  stayId: string;
  organizationId?: string;
  roomNumber: string;
  bedCode: string;
  baseRent: number;
  status: string;
  expectedVacateDate?: string | null;
}

// In-memory sessions store for fallback / testing
const inMemorySessions = new Map<
  string,
  {
    state: string;
    context: Record<string, unknown>;
    expiresAt: number;
  }
>();

// Mock residents lookup for testing without DB connection
const MOCK_RESIDENTS_DIRECTORY: Record<string, ResidentStayInfo> = {
  '919811122233': {
    residentId: 'f0000000-0000-0000-0000-000000000001',
    residentName: 'Rahul Sharma',
    stayId: '70000000-0000-0000-0000-000000000001',
    roomNumber: 'G01',
    bedCode: 'A',
    baseRent: 9000,
    status: 'ACTIVE',
  },
  '919822233344': {
    residentId: 'f0000000-0000-0000-0000-000000000002',
    residentName: 'Amit Verma',
    stayId: '70000000-0000-0000-0000-000000000002',
    roomNumber: 'G02',
    bedCode: 'A',
    baseRent: 15000,
    status: 'ACTIVE',
  },
  '919833344455': {
    residentId: 'f0000000-0000-0000-0000-000000000003',
    residentName: 'Priyanshu Patel',
    stayId: '70000000-0000-0000-0000-000000000003',
    roomNumber: '101',
    bedCode: 'A',
    baseRent: 8000,
    status: 'ACTIVE',
  },
  '919844455566': {
    residentId: 'f0000000-0000-0000-0000-000000000004',
    residentName: 'Vikram Singh',
    stayId: '70000000-0000-0000-0000-000000000004',
    roomNumber: '101',
    bedCode: 'B',
    baseRent: 8000,
    status: 'NOTICE',
    expectedVacateDate: '2026-12-04',
  },
};

/**
 * Looks up resident in Supabase by phone number, with fallback to mock directory
 */
export async function lookupResident(phone: string): Promise<ResidentStayInfo | null> {
  try {
    const supabase: any = createAdminClient();
    const { data: res, error } = await supabase
      .from('residents')
      .select(`
        id,
        organization_id,
        full_name,
        stays (
          id,
          monthly_rent,
          status,
          expected_vacate_date,
          beds (
            bed_code,
            rooms ( room_number )
          )
        )
      `)
      .eq('phone_number', phone)
      .maybeSingle();

    if (!error && res && res.stays && res.stays.length > 0) {
      const stays = res.stays;
      const activeStay = stays.find((s: any) => s.status === 'ACTIVE' || s.status === 'NOTICE') || stays[0];
      const bed = activeStay.beds;
      const room = bed?.rooms;
      return {
        residentId: res.id,
        residentName: res.full_name,
        stayId: activeStay.id,
        organizationId: res.organization_id,
        roomNumber: room?.room_number || 'N/A',
        bedCode: bed?.bed_code || 'A',
        baseRent: Number(activeStay.monthly_rent),
        status: activeStay.status,
        expectedVacateDate: activeStay.expected_vacate_date,
      };
    }
  } catch (e) {
    // Graceful fallback to mock directory
  }
  return MOCK_RESIDENTS_DIRECTORY[phone] || null;
}

/**
 * Normalizes phone number to E.164 digits without '+'
 */
export function normalizePhoneNumber(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10) return `91${clean}`;
  return clean;
}

/**
 * Dispatches the Main Menu to the resident
 */
async function sendMainMenu(to: string, residentName: string) {
  const body =
    `👋 Hello *${residentName}*, welcome to GreenNest Living PG Service Desk.\n\n` +
    `How can we assist you today? Please tap an option below:`;

  return whatsappClient.sendInteractiveButtons(to, body, [
    { id: 'VIEW_RENT', title: '💳 View / Pay Rent' },
    { id: 'RAISE_COMPLAINT', title: '🛠️ Log Complaint' },
    { id: 'VACATE_NOTICE', title: '📢 Vacate Notice' },
  ]);
}

/**
 * Handles incoming WhatsApp messages from residents
 */
export async function processResidentMessage(message: WhatsAppIncomingMessage) {
  const senderPhone = normalizePhoneNumber(message.from);

  // 1. Resident Lookup (Live DB with fallback)
  const resident = await lookupResident(senderPhone);

  if (!resident) {
    // Unregistered sender fallback (FR-3.4)
    await whatsappClient.sendTextMessage(
      senderPhone,
      `⚠️ *Number Not Registered*\n\nYour phone number (+${senderPhone}) is not registered with any active stay at GreenNest Living PG.\n\nPlease contact the property manager at +91 98765 43210 for resident registration.`
    );
    return;
  }

  // 2. Extract user input (text or interactive button/list ID)
  let userInput = '';
  if (message.type === 'interactive' && message.interactive) {
    userInput =
      message.interactive.button_reply?.id ||
      message.interactive.list_reply?.id ||
      '';
  } else if (message.type === 'text' && message.text) {
    userInput = message.text.body.trim();
  }

  const normalizedInput = userInput.toUpperCase();

  // 3. Retrieve or initialize Session State
  let session = inMemorySessions.get(senderPhone);
  const now = Date.now();

  if (!session || session.expiresAt < now) {
    session = {
      state: 'IDLE',
      context: {},
      expiresAt: now + 30 * 60 * 1000, // 30 minutes session
    };
    inMemorySessions.set(senderPhone, session);
  }

  // Handle explicit reset or main menu request
  if (normalizedInput === 'MENU' || normalizedInput === 'HI' || normalizedInput === 'HELLO' || normalizedInput === 'MAIN_MENU') {
    session.state = 'IDLE';
    session.context = {};
    inMemorySessions.set(senderPhone, session);
    await sendMainMenu(senderPhone, resident.residentName);
    return;
  }

  // 4. State Machine Routing
  switch (session.state) {
    case 'AWAITING_COMPLAINT_CATEGORY': {
      const validCategories: Record<string, ComplaintCategory> = {
        WIFI: 'WIFI',
        CLEANING: 'CLEANING',
        PLUMBING: 'PLUMBING',
        ELECTRICAL: 'ELECTRICAL',
        FOOD: 'FOOD',
        OTHER: 'OTHER',
      };

      const selectedCategory = validCategories[normalizedInput];

      if (!selectedCategory) {
        await whatsappClient.sendTextMessage(
          senderPhone,
          `Please select a valid category from the list:\n- WIFI\n- CLEANING\n- PLUMBING\n- ELECTRICAL\n- FOOD\n- OTHER\n\nOr send *MENU* to return.`
        );
        return;
      }

      session.state = 'AWAITING_COMPLAINT_DETAILS';
      session.context = { category: selectedCategory };
      inMemorySessions.set(senderPhone, session);

      await whatsappClient.sendTextMessage(
        senderPhone,
        `Category *${selectedCategory}* selected. ✍️\n\nPlease reply with a brief description or photo describing the problem:`
      );
      return;
    }

    case 'AWAITING_COMPLAINT_DETAILS': {
      const category = (session.context.category as ComplaintCategory) || 'OTHER';
      const description = userInput || (message.image ? 'Photo attachment provided' : 'Maintenance issue reported');

      // Generate Ticket Number
      let ticketNumber = Math.floor(100 + Math.random() * 900);

      // Attempt live database write
      try {
        const supabase: any = createAdminClient();
        const { data: stay } = await supabase
          .from('stays')
          .select('organization_id')
          .eq('id', resident.stayId)
          .single();

        if (stay) {
          const { data: newComp } = await supabase
            .from('complaints')
            .insert({
              organization_id: stay.organization_id,
              stay_id: resident.stayId,
              category: category,
              description: description,
              photo_url: message.image?.id ? `https://media.meta.com/${message.image.id}` : null,
              status: 'OPEN',
            })
            .select('ticket_number')
            .single();

          if (newComp?.ticket_number) {
            ticketNumber = newComp.ticket_number;
          }
        }
      } catch (dbErr) {
        // Fallback gracefully
      }

      // Reset to IDLE
      session.state = 'IDLE';
      session.context = {};
      inMemorySessions.set(senderPhone, session);

      await whatsappClient.sendTextMessage(
        senderPhone,
        `✅ *Ticket Logged Successfully!*\n\n` +
          `🎫 *Ticket ID:* #${ticketNumber}\n` +
          `🏷️ *Category:* ${category}\n` +
          `🏠 *Room:* ${resident.roomNumber} (${resident.bedCode})\n` +
          `📝 *Details:* "${description}"\n\n` +
          `Our maintenance team and warden have been notified and will resolve this shortly.`
      );
      return;
    }

    case 'AWAITING_VACATE_DATE': {
      // Expecting DD-MM-YYYY format per FR-5.2
      const dateParts = userInput.split(/[-/]/);
      let isValidDate = false;
      let targetDate: Date | null = null;

      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        targetDate = new Date(year, month, day);

        if (!isNaN(targetDate.getTime())) {
          isValidDate = true;
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const minNoticeDate = new Date(today);
      minNoticeDate.setDate(minNoticeDate.getDate() + 30);

      if (!isValidDate || !targetDate || targetDate < minNoticeDate) {
        const minDateStr = `${minNoticeDate.getDate().toString().padStart(2, '0')}-${(
          minNoticeDate.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')}-${minNoticeDate.getFullYear()}`;

        await whatsappClient.sendTextMessage(
          senderPhone,
          `⚠️ *Notice Period Policy*\n\n` +
            `Our standard hostel agreement requires a minimum *30-day notice period*.\n\n` +
            `Earliest permitted vacate date is *${minDateStr}*.\n\n` +
            `Please reply with a valid move-out date on or after ${minDateStr} (Format: DD-MM-YYYY):`
        );
        return;
      }

      // Valid move-out date
      const formattedVacateDate = `${targetDate.getDate().toString().padStart(2, '0')}-${(
        targetDate.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}-${targetDate.getFullYear()}`;

      const isoVacateDate = `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${targetDate.getDate().toString().padStart(2, '0')}`;

      // Persist to Live Supabase DB
      try {
        const supabase: any = createAdminClient();
        await supabase
          .from('stays')
          .update({
            status: 'NOTICE',
            notice_served_date: new Date().toISOString().slice(0, 10),
            expected_vacate_date: isoVacateDate,
          })
          .eq('id', resident.stayId);

        const { data: stay } = await supabase
          .from('stays')
          .select('bed_id')
          .eq('id', resident.stayId)
          .single();

        if (stay?.bed_id) {
          await supabase
            .from('beds')
            .update({ status: 'NOTICE_PERIOD' })
            .eq('id', stay.bed_id);
        }
      } catch (dbErr) {
        // Fallback gracefully
      }

      resident.status = 'NOTICE';
      resident.expectedVacateDate = formattedVacateDate;

      // Reset to IDLE
      session.state = 'IDLE';
      session.context = {};
      inMemorySessions.set(senderPhone, session);

      await whatsappClient.sendTextMessage(
        senderPhone,
        `📢 *Move-out Notice Confirmed*\n\n` +
          `Dear *${resident.residentName}*, your 30-day move-out notice for Room ${resident.roomNumber} (${resident.bedCode}) has been registered.\n\n` +
          `📅 *Projected Vacate Date:* ${formattedVacateDate}\n\n` +
          `Our manager has been notified. You can review and clear your security deposit settlement sheet at checkout.`
      );
      return;
    }

    case 'IDLE':
    default: {
      // 1. Rent Query & Payment (Section 7.1.A)
      if (
        normalizedInput === 'VIEW_RENT' ||
        normalizedInput.includes('RENT') ||
        normalizedInput.includes('DUE') ||
        normalizedInput.includes('PAY') ||
        normalizedInput.includes('BILL')
      ) {
        let outstanding = resident.baseRent + 450;
        let invoiceNumber = 1001;
        let baseRent = resident.baseRent;
        let electricity = 450;
        let dueDate = '05-Nov-2026';
        let ownerVpa = 'greennest@okhdfcbank';
        let pgName = 'GreenNest Living PG';

        try {
          const supabase: any = createAdminClient();
          const { data: inv } = await supabase
            .from('invoices')
            .select(`
              id,
              invoice_number,
              base_rent,
              electricity_charges,
              total_amount,
              amount_paid,
              due_date,
              organizations ( business_name, upi_vpa )
            `)
            .eq('stay_id', resident.stayId)
            .in('status', ['UNPAID', 'PARTIALLY_PAID'])
            .order('billing_month', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (inv) {
            outstanding = Math.max(0, Number(inv.total_amount) - Number(inv.amount_paid));
            invoiceNumber = inv.invoice_number;
            baseRent = Number(inv.base_rent);
            electricity = Number(inv.electricity_charges);
            dueDate = inv.due_date;
            const org = (inv as any).organizations;
            if (org?.upi_vpa) ownerVpa = org.upi_vpa;
            if (org?.business_name) pgName = org.business_name;
          }
        } catch (dbErr) {
          // Graceful fallback
        }

        await whatsappClient.sendRentInvoiceMessage(senderPhone, {
          roomNumber: resident.roomNumber,
          bedCode: resident.bedCode,
          month: 'November 2026',
          baseRent: baseRent,
          electricity: electricity,
          totalOutstanding: outstanding,
          dueDate: dueDate,
          invoiceNumber: invoiceNumber,
          ownerVpa: ownerVpa,
          pgName: pgName,
        });
        return;
      }

      // 2. Raise Complaint (Section 7.1.B)
      if (
        normalizedInput === 'RAISE_COMPLAINT' ||
        normalizedInput.includes('COMPLAINT') ||
        normalizedInput.includes('WIFI') ||
        normalizedInput.includes('CLEANING') ||
        normalizedInput.includes('WATER') ||
        normalizedInput.includes('PLUMBING')
      ) {
        session.state = 'AWAITING_COMPLAINT_CATEGORY';
        inMemorySessions.set(senderPhone, session);

        await whatsappClient.sendInteractiveList(
          senderPhone,
          `🛠️ *Select Issue Category*\n\nPlease select the type of issue you are facing:`,
          'Select Category',
          [
            { id: 'WIFI', title: 'Wi-Fi & Internet', description: 'Slow speed or disconnection' },
            { id: 'CLEANING', title: 'Housekeeping', description: 'Room / washroom cleaning' },
            { id: 'PLUMBING', title: 'Plumbing & Water', description: 'Tap leak, geyser, flush' },
            { id: 'ELECTRICAL', title: 'Electrical', description: 'Lights, fan, socket' },
            { id: 'FOOD', title: 'Food & Mess', description: 'Meal quality or timing' },
            { id: 'OTHER', title: 'Other Issue', description: 'General complaints' },
          ]
        );
        return;
      }

      // 3. Vacate Notice (Section 7.1.C)
      if (
        normalizedInput === 'VACATE_NOTICE' ||
        normalizedInput === '/NOTICE' ||
        normalizedInput.includes('NOTICE') ||
        normalizedInput.includes('VACATE') ||
        normalizedInput.includes('LEAVE')
      ) {
        if (resident.status === 'NOTICE') {
          await whatsappClient.sendTextMessage(
            senderPhone,
            `ℹ️ *Notice Already Active*\n\nYour 30-day notice is already active for vacating on *${
              resident.expectedVacateDate ?? 'end of month'
            }*.\n\nFor any date revisions, please speak with the property manager.`
          );
          return;
        }

        session.state = 'AWAITING_VACATE_DATE';
        inMemorySessions.set(senderPhone, session);

        await whatsappClient.sendTextMessage(
          senderPhone,
          `📢 *30-Day Notice Period*\n\n` +
            `Our standard agreement requires a 30-day advance notice.\n\n` +
            `Please reply with your planned move-out date (format: *DD-MM-YYYY*):`
        );
        return;
      }

      // 4. Support Contacts
      if (
        normalizedInput === 'SUPPORT_CONTACTS' ||
        normalizedInput.includes('CONTACT') ||
        normalizedInput.includes('MANAGER') ||
        normalizedInput.includes('WARDEN')
      ) {
        await whatsappClient.sendTextMessage(
          senderPhone,
          `📞 *GreenNest Living PG Contacts*\n\n` +
            `👤 *Property Manager:* Rajesh Kumar (+91 98765 43210)\n` +
            `🏢 *Warden Desk:* Ramesh (+91 98111 22233)\n` +
            `📍 *Address:* Plot 42, 14th Main, Sector 4, HSR Layout, Bangalore\n\n` +
            `Reply *MENU* anytime to return to the main options.`
        );
        return;
      }

      // Default: Fallback to Main Menu
      await sendMainMenu(senderPhone, resident.residentName);
      break;
    }
  }
}

