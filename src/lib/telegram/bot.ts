import { telegramClient } from './client';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ComplaintCategory } from '@/types/database';
import fs from 'fs';
import path from 'path';

interface TelegramSession {
  chatId: number;
  telegramUserId?: number;
  phone?: string;
  residentId?: string;
  residentName?: string;
  stayId?: string;
  roomNumber?: string;
  bedCode?: string;
  baseRent?: number;
  organizationId?: string;
  state?: 'IDLE' | 'AWAITING_PHONE' | 'AWAITING_COMPLAINT_DESC';
  pendingCategory?: ComplaintCategory;
  verifiedAt?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'telegram-auth-sessions.json');

// Helper to load verified sessions from persistent storage
function loadSessions(): Map<number, TelegramSession> {
  const map = new Map<number, TelegramSession>();
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      for (const [key, val] of Object.entries(data)) {
        map.set(Number(key), val as TelegramSession);
      }
    }
  } catch (err) {
    console.warn('Could not read telegram sessions file:', err);
  }
  return map;
}

// Helper to persist sessions
function persistSessions() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const obj: Record<string, TelegramSession> = {};
    for (const [key, val] of sessions.entries()) {
      obj[key.toString()] = val;
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save telegram sessions file:', err);
  }
}

// In-memory sessions store (initialized from disk)
const sessions = loadSessions();
// Phone to ChatId mapping for outgoing notifications
const phoneToChatId = new Map<string, number>();

// Populate phoneToChatId from loaded sessions
for (const [chatId, session] of sessions.entries()) {
  if (session.phone) {
    phoneToChatId.set(normalizePhone(session.phone), chatId);
  }
}

/**
 * Normalizes phone number to standard 10-digit format
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Looks up resident in Supabase by normalized phone number
 */
async function lookupResidentByPhone(phone: string) {
  const normalized = normalizePhone(phone);
  try {
    const supabase: any = createAdminClient();

    const { data: residents, error } = await supabase
      .from('residents')
      .select(`
        id,
        organization_id,
        full_name,
        phone_number,
        stays (
          id,
          monthly_rent,
          status,
          expected_vacate_date,
          beds (
            id,
            bed_code,
            rooms (
              room_number
            )
          )
        )
      `)
      .or(`phone_number.eq.${normalized},phone_number.eq.91${normalized}`)
      .limit(1);

    if (error) {
      console.error('Supabase query error in lookupResidentByPhone:', error);
      return null;
    }

    if (!residents || residents.length === 0) {
      return null;
    }

    const resident = residents[0];
    const stays = resident.stays || [];
    const activeStay = stays.find((s: any) => s.status === 'ACTIVE' || s.status === 'NOTICE') || stays[0];

    return {
      residentId: resident.id,
      residentName: resident.full_name,
      phone: resident.phone_number,
      organizationId: resident.organization_id,
      stayId: activeStay?.id,
      bedId: activeStay?.beds?.id,
      roomNumber: activeStay?.beds?.rooms?.room_number || 'N/A',
      bedCode: activeStay?.beds?.bed_code || 'A',
      baseRent: Number(activeStay?.monthly_rent || 0),
      status: activeStay?.status || 'ACTIVE',
      expectedVacateDate: activeStay?.expected_vacate_date,
      propertyName: 'GreenNest Living PG',
      supportPhone: '+91 98765 43210',
    };
  } catch (err: any) {
    console.error('Error looking up resident in Supabase:', err.message);
    return null;
  }
}

/**
 * Returns main menu inline keyboard
 */
function getMainMenuButtons() {
  return [
    [
      { text: '💳 View & Pay Rent', callback_data: 'VIEW_RENT' },
      { text: '🛠️ Report Complaint', callback_data: 'REPORT_COMPLAINT' },
    ],
    [
      { text: '🚪 Submit Vacate Notice', callback_data: 'VACATE_NOTICE' },
      { text: '📞 Warden & Contacts', callback_data: 'WARDEN_CONTACT' },
    ],
  ];
}

/**
 * Handles incoming Telegram update (webhook or polling)
 */
export async function handleTelegramUpdate(update: any) {
  try {
    // 1. Handle Inline Button Clicks (Callback Queries)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }

    // 2. Handle Text Messages and Contact Sharing
    if (update.message) {
      await handleMessage(update.message);
      return;
    }
  } catch (err: any) {
    console.error('Failed to process Telegram update:', err);
  }
}

/**
 * Handles incoming user message
 */
async function handleMessage(message: any) {
  const chatId = message.chat.id;
  const senderId = message.from?.id;
  const text = (message.text || '').trim();
  const contact = message.contact;

  let session: TelegramSession = sessions.get(chatId) || { chatId, state: 'IDLE' };

  // 1. Native Telegram Contact Sharing (The ONLY authorized authentication method)
  if (contact && contact.phone_number) {
    // Cryptographic Ownership Verification:
    // Telegram guarantees contact.user_id matches message.from.id ONLY if the sender
    // shared THEIR OWN registered Telegram phone number (not a forwarded contact card).
    if (!contact.user_id || contact.user_id !== senderId) {
      console.warn(`[SECURITY] Blocked contact spoofing attempt in chat ${chatId}: contact.user_id (${contact.user_id}) !== message.from.id (${senderId})`);
      await telegramClient.sendMessage(
        chatId,
        `🚫 *Security Alert: Verification Blocked*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `The contact card provided does not match your active Telegram account or was forwarded.\n\n` +
        `To prevent identity theft, you must tap the *'📱 Verify & Share My Phone Number'* button below from your own phone.`
      );
      return;
    }

    // Authenticated: Telegram has proven the sender owns this phone number
    await linkResidentByPhone(chatId, contact.phone_number, senderId);
    return;
  }

  // 2. Command /start
  if (text.startsWith('/start')) {
    if (session.residentName && session.telegramUserId === senderId) {
      await showMainMenu(chatId, session);
      return;
    }

    session.state = 'AWAITING_PHONE';
    sessions.set(chatId, session);
    persistSessions();

    await telegramClient.sendContactRequest(
      chatId,
      `👋 *Welcome to the PG Master Resident Portal!*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🔒 *Privacy & Security Protected:*\n` +
      `To ensure that only verified residents can access their room billing, maintenance tickets, and notices, access requires instant phone verification.\n\n` +
      `👇 Tap *'📱 Verify & Share My Phone Number'* below to securely link your room:`
    );
    return;
  }

  // 3. Prevent Manual Phone Number Typing (Strict Security Rule)
  // If a user tries to type a phone number in text, reject it and enforce button verification
  const cleanDigits = text.replace(/[^0-9]/g, '');
  if (cleanDigits.length >= 10 && cleanDigits.length <= 13) {
    console.log(`[SECURITY] Intercepted manual phone number typing attempt: ${cleanDigits} in chat ${chatId}`);
    await telegramClient.sendContactRequest(
      chatId,
      `🔒 *Security Notice: Manual Entry Blocked*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `To protect tenant privacy and prevent unauthorized access to your account, manually typing phone numbers is strictly prohibited.\n\n` +
      `👉 Please tap *'📱 Verify & Share My Phone Number'* below. Telegram will cryptographically verify that this phone number belongs to your active SIM card.`
    );
    return;
  }

  // 4. Session Authenticity Check for Subsequent Operations
  if (!session.residentName || !session.stayId || session.telegramUserId !== senderId) {
    session.state = 'AWAITING_PHONE';
    sessions.set(chatId, session);
    persistSessions();

    await telegramClient.sendContactRequest(
      chatId,
      `🔒 *Authentication Required*\n\n` +
      `You are not currently authenticated. Tap *'📱 Verify & Share My Phone Number'* below to access your room details:`
    );
    return;
  }

  // 5. Handling complaint description input
  if (session.state === 'AWAITING_COMPLAINT_DESC' && session.pendingCategory) {
    await submitComplaint(chatId, session, text);
    return;
  }

  // 6. Quick Text Commands for Authenticated Residents
  const lower = text.toLowerCase();
  if (lower === 'rent' || lower === '/rent') {
    await handleViewRent(chatId, session);
    return;
  }
  if (lower === 'complaint' || lower === '/complaint') {
    await showComplaintCategories(chatId);
    return;
  }
  if (lower === 'notice' || lower === '/notice') {
    await showVacateNoticePrompt(chatId, session);
    return;
  }
  if (lower === 'menu' || lower === '/menu') {
    await showMainMenu(chatId, session);
    return;
  }

  // Default menu for authenticated resident
  await showMainMenu(chatId, session);
}

/**
 * Links a cryptographically verified resident by phone number and displays welcome menu
 */
async function linkResidentByPhone(
  chatId: number,
  rawPhone: string,
  telegramUserId: number
): Promise<boolean> {
  const resident = await lookupResidentByPhone(rawPhone);

  if (!resident) {
    console.log(`[AUTH] Verified Telegram phone ${rawPhone} (user ${telegramUserId}) not found in active database.`);
    await telegramClient.sendMessage(
      chatId,
      `⚠️ *Unregistered Number*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Your verified Telegram number \`${rawPhone}\` is not registered in the active PG resident directory.\n\n` +
      `Please ensure that the phone number on your PG check-in form matches this Telegram number, or contact your property warden.`
    );
    return false;
  }

  const session: TelegramSession = {
    chatId,
    telegramUserId,
    phone: resident.phone,
    residentId: resident.residentId,
    residentName: resident.residentName,
    stayId: resident.stayId,
    roomNumber: resident.roomNumber,
    bedCode: resident.bedCode,
    baseRent: resident.baseRent,
    organizationId: resident.organizationId,
    state: 'IDLE',
    verifiedAt: new Date().toISOString(),
  };

  sessions.set(chatId, session);
  persistSessions();
  phoneToChatId.set(normalizePhone(resident.phone), chatId);

  console.log(`[AUTH] Successfully authenticated resident "${resident.residentName}" (Phone: ${resident.phone}) to Telegram user ${telegramUserId}`);

  await telegramClient.sendMessage(
    chatId,
    `✅ *Identity Verified Successfully!*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Welcome, *${resident.residentName}*!\n` +
    `🏠 *Room ${resident.roomNumber} (Bed ${resident.bedCode})*\n` +
    `🏢 *${resident.propertyName}*\n\n` +
    `Your Telegram account is now securely linked to your room.`
  );

  await showMainMenu(chatId, session);
  return true;
}

/**
 * Displays main menu
 */
async function showMainMenu(chatId: number, session: TelegramSession) {
  const name = session.residentName || 'Resident';
  const room = session.roomNumber ? `Room ${session.roomNumber} (Bed ${session.bedCode})` : 'PG Portal';

  await telegramClient.sendInlineKeyboard(
    chatId,
    `🏠 *PG Master Portal — ${room}*\n\n` +
    `Hi *${name}*, choose an option below:`,
    getMainMenuButtons()
  );
}

/**
 * Handles callback queries from inline buttons
 */
async function handleCallbackQuery(query: any) {
  const chatId = query.message.chat.id;
  const fromId = query.from?.id;
  const data = query.data;
  const session: TelegramSession = sessions.get(chatId) || { chatId, state: 'IDLE' };

  await telegramClient.answerCallbackQuery(query.id);

  // Security check: Must be authenticated
  if (!session.residentName || !session.stayId) {
    await telegramClient.sendContactRequest(
      chatId,
      `🔒 *Authentication Required*\n\n` +
      `Please verify your phone number to access room services:\n` +
      `Tap *'📱 Verify & Share My Phone Number'* below:`
    );
    return;
  }

  // Security check: Query sender must match the authenticated Telegram user
  if (session.telegramUserId && fromId && session.telegramUserId !== fromId) {
    console.warn(`[SECURITY] Blocked button query from unverified user: ${fromId} on session of ${session.telegramUserId}`);
    await telegramClient.sendMessage(chatId, '🚫 Unauthorized button interaction.');
    return;
  }

  if (data === 'MAIN_MENU') {
    session.state = 'IDLE';
    sessions.set(chatId, session);
    persistSessions();
    await showMainMenu(chatId, session);
    return;
  }

  if (data === 'VIEW_RENT') {
    await handleViewRent(chatId, session);
    return;
  }

  if (data === 'REPORT_COMPLAINT') {
    await showComplaintCategories(chatId);
    return;
  }

  if (data.startsWith('COMPLAINT_CAT_')) {
    const category = data.replace('COMPLAINT_CAT_', '') as ComplaintCategory;
    session.state = 'AWAITING_COMPLAINT_DESC';
    session.pendingCategory = category;
    sessions.set(chatId, session);
    persistSessions();

    const categoryLabels: Record<string, string> = {
      WIFI: '📶 Wi-Fi / Internet',
      PLUMBING: '🚰 Plumbing & Water',
      ELECTRICAL: '⚡ Electrical & Power',
      FOOD: '🍲 Food & Mess',
      CLEANING: '🧹 Room Cleaning',
      OTHER: '📦 Other Issue',
    };

    await telegramClient.sendInlineKeyboard(
      chatId,
      `📝 *Report ${categoryLabels[category] || category}*\n\n` +
      `Please reply with a brief description of the issue.\n` +
      `_Example: "Washbasin tap leaking slowly" or "Wi-Fi router dropping on 1st floor"_`,
      [[{ text: '🔙 Cancel', callback_data: 'MAIN_MENU' }]]
    );
    return;
  }

  if (data === 'VACATE_NOTICE') {
    await showVacateNoticePrompt(chatId, session);
    return;
  }

  if (data === 'CONFIRM_VACATE_NOTICE') {
    await confirmVacateNotice(chatId, session);
    return;
  }

  if (data === 'WARDEN_CONTACT') {
    await telegramClient.sendInlineKeyboard(
      chatId,
      `📞 *Warden & Emergency Contacts*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Property Warden:* Ramesh (+91 98111 22334)\n` +
      `🔧 *Maintenance Desk:* (+91 98222 33445)\n` +
      `🚨 *Emergency / Admin:* (+91 98333 44556)\n` +
      `⏰ *Office Hours:* 08:00 AM – 10:00 PM`,
      [[{ text: '🔙 Back to Menu', callback_data: 'MAIN_MENU' }]]
    );
    return;
  }
}

/**
 * Displays rent breakdown with UPI payment button
 */
async function handleViewRent(chatId: number, session: TelegramSession) {
  if (!session.stayId) {
    await telegramClient.sendMessage(chatId, '⚠️ No active stay record found. Please contact the warden.');
    return;
  }

  try {
    const supabase: any = createAdminClient();

    // Look for pending invoices for this stay
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('stay_id', session.stayId)
      .eq('status', 'PENDING')
      .order('billing_month', { ascending: false })
      .limit(1);

    const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const pendingInv = invoices && invoices.length > 0 ? invoices[0] : null;

    const baseRent = pendingInv ? Number(pendingInv.base_rent) : Number(session.baseRent || 8000);
    const electricity = pendingInv ? Number(pendingInv.electricity_amount || 0) : 0;
    const total = pendingInv ? Number(pendingInv.total_amount) : baseRent;
    const dueDate = pendingInv?.due_date || '5th of this month';
    const invNumber = pendingInv?.invoice_number || '101';

    // Get PG UPI VPA
    let upiVpa = 'greennest@okaxis';
    let pgName = 'GreenNest Living PG';
    if (session.organizationId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('business_name, upi_vpa')
        .eq('id', session.organizationId)
        .maybeSingle();
      if (org) {
        if (org.upi_vpa) upiVpa = org.upi_vpa;
        if (org.business_name) pgName = org.business_name;
      }
    }

    await telegramClient.sendRentInvoiceMessage(chatId, {
      roomNumber: session.roomNumber || 'N/A',
      bedCode: session.bedCode || 'A',
      month: pendingInv?.billing_month || currentMonth,
      baseRent,
      electricity,
      totalOutstanding: total,
      dueDate,
      invoiceNumber: invNumber,
      ownerVpa: upiVpa,
      pgName,
    });
  } catch (err: any) {
    console.error('Error fetching rent details:', err.message);
    await telegramClient.sendMessage(chatId, '⚠️ Could not fetch rent details. Please try again later.');
  }
}

/**
 * Shows complaint category selection
 */
async function showComplaintCategories(chatId: number) {
  await telegramClient.sendInlineKeyboard(
    chatId,
    `🛠️ *Select Maintenance Category (FR-4.1)*\n\n` +
    `Choose the category that best describes your issue:`,
    [
      [
        { text: '📶 Wi-Fi', callback_data: 'COMPLAINT_CAT_WIFI' },
        { text: '🚰 Plumbing', callback_data: 'COMPLAINT_CAT_PLUMBING' },
      ],
      [
        { text: '⚡ Electrical', callback_data: 'COMPLAINT_CAT_ELECTRICAL' },
        { text: '🍲 Food / Mess', callback_data: 'COMPLAINT_CAT_FOOD' },
      ],
      [
        { text: '🧹 Cleaning', callback_data: 'COMPLAINT_CAT_CLEANING' },
        { text: '📦 Other', callback_data: 'COMPLAINT_CAT_OTHER' },
      ],
      [{ text: '🔙 Back to Menu', callback_data: 'MAIN_MENU' }],
    ]
  );
}

/**
 * Submits complaint to Supabase
 */
async function submitComplaint(chatId: number, session: TelegramSession, description: string) {
  const category = session.pendingCategory || 'OTHER';

  try {
    const supabase: any = createAdminClient();

    const { data: ticket, error } = await supabase
      .from('complaints')
      .insert({
        organization_id: session.organizationId,
        stay_id: session.stayId,
        category,
        description,
        status: 'OPEN',
      })
      .select('ticket_number')
      .single();

    if (error) throw error;

    const ticketNumber = ticket?.ticket_number || 'New';

    session.state = 'IDLE';
    session.pendingCategory = undefined;
    sessions.set(chatId, session);
    persistSessions();

    await telegramClient.sendInlineKeyboard(
      chatId,
      `✅ *Maintenance Ticket Logged!*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎫 *Ticket #:* #${ticketNumber}\n` +
      `📁 *Category:* ${category}\n` +
      `📝 *Issue:* ${description}\n` +
      `⏳ *Status:* OPEN\n\n` +
      `The PG warden has been notified. You will receive an instant notification here once resolved!`,
      [[{ text: '🔙 Main Menu', callback_data: 'MAIN_MENU' }]]
    );
  } catch (err: any) {
    console.error('Failed to log complaint in Supabase:', err.message);
    await telegramClient.sendMessage(chatId, `⚠️ Failed to log ticket: ${err.message}. Please try again.`);
  }
}

/**
 * Shows vacate notice confirmation
 */
async function showVacateNoticePrompt(chatId: number, session: TelegramSession) {
  const today = new Date();
  const vacateDate = new Date(today);
  vacateDate.setDate(today.getDate() + 30);

  const formattedDate = vacateDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  await telegramClient.sendInlineKeyboard(
    chatId,
    `🚪 *Move-out Notice Submission (FR-5.1)*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `As per PG policy, a *30-day notice period* applies.\n\n` +
    `📅 *Notice Served Today:* ${today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}\n` +
    `🗓️ *Expected Vacate Date:* *${formattedDate}*\n\n` +
    `Your security deposit settlement sheet will be generated upon checkout inspection.\n\n` +
    `Do you confirm your move-out request?`,
    [
      [{ text: `✅ Confirm Move-out (${formattedDate})`, callback_data: 'CONFIRM_VACATE_NOTICE' }],
      [{ text: '❌ Cancel & Keep Stay', callback_data: 'MAIN_MENU' }],
    ]
  );
}

/**
 * Confirms vacate notice and updates Supabase stay & bed records
 */
async function confirmVacateNotice(chatId: number, session: TelegramSession) {
  if (!session.stayId) {
    await telegramClient.sendMessage(chatId, '⚠️ Active stay not found.');
    return;
  }

  try {
    const supabase: any = createAdminClient();
    const today = new Date();
    const vacateDate = new Date(today);
    vacateDate.setDate(today.getDate() + 30);

    const servedIso = today.toISOString().split('T')[0];
    const vacateIso = vacateDate.toISOString().split('T')[0];

    // 1. Update stay status to NOTICE
    const { data: stay, error: stayErr } = await supabase
      .from('stays')
      .update({
        status: 'NOTICE',
        notice_served_date: servedIso,
        expected_vacate_date: vacateIso,
      })
      .eq('id', session.stayId)
      .select('bed_id')
      .single();

    if (stayErr) throw stayErr;

    // 2. Update bed status to NOTICE_PERIOD
    if (stay?.bed_id) {
      await supabase
        .from('beds')
        .update({ status: 'NOTICE_PERIOD' })
        .eq('id', stay.bed_id);
    }

    await telegramClient.sendInlineKeyboard(
      chatId,
      `📋 *Move-out Notice Confirmed*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Your vacate notice has been officially recorded in the PG Master system.\n\n` +
      `🗓️ *Move-out Date:* ${vacateIso}\n` +
      `💰 *Deposit Status:* HELD (will be settled on checkout)\n\n` +
      `The property manager will reach out for checkout inspection details.`,
      [[{ text: '🔙 Main Menu', callback_data: 'MAIN_MENU' }]]
    );
  } catch (err: any) {
    console.error('Failed to confirm vacate notice in Supabase:', err.message);
    await telegramClient.sendMessage(chatId, `⚠️ Error recording notice: ${err.message}`);
  }
}

/**
 * Sends notification to resident via Telegram if their phone is linked
 */
export async function sendTelegramNotificationToResident(
  phone: string,
  text: string
): Promise<boolean> {
  const norm = normalizePhone(phone);
  let chatId = phoneToChatId.get(norm);

  // Reload dynamically if not cached in this process
  if (!chatId) {
    const loaded = loadSessions();
    for (const [cId, session] of loaded.entries()) {
      if (session.phone && normalizePhone(session.phone) === norm) {
        chatId = cId;
        phoneToChatId.set(norm, cId);
        break;
      }
    }
  }

  if (!chatId) {
    console.log(`[TELEGRAM NOTIFY] No active Telegram session found for phone ${norm}`);
    return false;
  }

  try {
    await telegramClient.sendMessage(chatId, text);
    console.log(`[TELEGRAM NOTIFY] Sent message to chat ${chatId} for phone ${norm}`);
    return true;
  } catch (err: any) {
    console.error('Failed to send Telegram notification to resident:', err.message);
    return false;
  }
}
