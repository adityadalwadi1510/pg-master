import { createAdminClient } from '@/lib/supabase/admin';
import { whatsappClient } from '@/lib/whatsapp/client';
import { sendTelegramNotificationToResident } from '@/lib/telegram/bot';
import QRCode from 'qrcode';

export interface GenerateInvoicesOptions {
  billingMonth?: string;       // Format 'YYYY-MM-01', defaults to current month
  organizationId?: string;     // If specified, generates only for this org
  dispatchWhatsApp?: boolean;  // Whether to send WhatsApp bills to residents
}

export interface InvoiceGenerationResult {
  success: boolean;
  billingMonth: string;
  totalEligibleStays: number;
  createdCount: number;
  skippedCount: number;
  notificationsSent: number;
  totalBilledAmount: number;
  errors: string[];
}

/**
 * Builds standard NPCI UPI Intent URI for instant smartphone app checkout
 * Format: upi://pay?pa={owner_vpa}&pn={pg_name}&am={total_amount}&tr=INV-{invoice_number}&cu=INR
 */
export function buildUpiIntentUri(params: {
  ownerVpa: string;
  pgName: string;
  totalAmount: number;
  invoiceNumber: number;
}): string {
  const cleanVpa = params.ownerVpa.trim();
  const encodedName = encodeURIComponent(params.pgName.trim());
  const formattedAmount = params.totalAmount.toFixed(2);
  const transactionRef = `INV-${params.invoiceNumber}`;

  return `upi://pay?pa=${cleanVpa}&pn=${encodedName}&am=${formattedAmount}&tr=${transactionRef}&cu=INR`;
}

/**
 * Generates high-resolution QR code Data URL from UPI link for scanning
 */
export async function generateUpiQrDataUrl(upiUri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(upiUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate UPI QR code:', err);
    return '';
  }
}

/**
 * Batch generates monthly invoices for all ACTIVE and NOTICE stays (FR-3.1)
 * Idempotent execution via PostgreSQL UNIQUE (stay_id, billing_month)
 */
export async function generateMonthlyInvoices(
  options: GenerateInvoicesOptions = {}
): Promise<InvoiceGenerationResult> {
  const result: InvoiceGenerationResult = {
    success: true,
    billingMonth: '',
    totalEligibleStays: 0,
    createdCount: 0,
    skippedCount: 0,
    notificationsSent: 0,
    totalBilledAmount: 0,
    errors: [],
  };

  try {
    const supabase: any = createAdminClient();

    // 1. Determine target billing month (defaults to current month)
    const targetMonth = options.billingMonth || `${new Date().toISOString().slice(0, 7)}-01`;
    result.billingMonth = targetMonth;

    // Calculate due date (5th of the billing month per Indian PG norms)
    const dateObj = new Date(targetMonth);
    const dueDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-05`;

    // 2. Fetch eligible stays (ACTIVE or NOTICE)
    let stayQuery = supabase
      .from('stays')
      .select(`
        id,
        organization_id,
        resident_id,
        bed_id,
        move_in_date,
        monthly_rent,
        status,
        residents ( id, full_name, phone_number ),
        beds (
          id,
          bed_code,
          rooms ( id, room_number, property_id, properties ( id, name ) )
        ),
        organizations ( id, business_name, upi_vpa )
      `)
      .in('status', ['ACTIVE', 'NOTICE']);

    if (options.organizationId) {
      stayQuery = stayQuery.eq('organization_id', options.organizationId);
    }

    const { data: stays, error: stayErr } = await stayQuery;

    if (stayErr) {
      throw new Error(`Failed to fetch stays: ${stayErr.message}`);
    }

    if (!stays || stays.length === 0) {
      return result;
    }

    result.totalEligibleStays = stays.length;

    // 3. Fetch existing invoices for target billing month to guarantee idempotency
    let invoiceQuery = supabase
      .from('invoices')
      .select('stay_id')
      .eq('billing_month', targetMonth);

    if (options.organizationId) {
      invoiceQuery = invoiceQuery.eq('organization_id', options.organizationId);
    }

    const { data: existingInvoices, error: invErr } = await invoiceQuery;

    if (invErr) {
      console.warn('Error querying existing invoices:', invErr.message);
    }

    const existingStayIds = new Set((existingInvoices || []).map((i: any) => i.stay_id));

    // 4. Generate invoices for stays not yet invoiced
    for (const stay of stays) {
      if (existingStayIds.has(stay.id)) {
        result.skippedCount++;
        continue;
      }

      try {
        const agreedRent = Number(stay.monthly_rent);

        // Check if move-in was during this billing month for prorating
        let baseRent = agreedRent;
        const moveIn = new Date(stay.move_in_date);
        const billingYear = dateObj.getFullYear();
        const billingMonthIdx = dateObj.getMonth();

        if (moveIn.getFullYear() === billingYear && moveIn.getMonth() === billingMonthIdx) {
          const daysInMonth = new Date(billingYear, billingMonthIdx + 1, 0).getDate();
          const activeDays = daysInMonth - moveIn.getDate() + 1;
          baseRent = Math.round((agreedRent / daysInMonth) * activeDays);
        }

        // Insert invoice
        const { data: newInvoice, error: insertErr } = await supabase
          .from('invoices')
          .insert({
            organization_id: stay.organization_id,
            stay_id: stay.id,
            billing_month: targetMonth,
            base_rent: baseRent,
            electricity_charges: 0,
            maintenance_charges: 0,
            addon_charges: 0,
            discount_amount: 0,
            due_date: dueDate,
          })
          .select(`
            id,
            invoice_number,
            total_amount,
            due_date
          `)
          .single();

        if (insertErr) {
          result.errors.push(`Stay ${stay.id}: ${insertErr.message}`);
          continue;
        }

        result.createdCount++;
        result.totalBilledAmount += baseRent;

        // 5. Dispatch WhatsApp notification if requested (FR-3.2)
        if (options.dispatchWhatsApp && stay.residents?.phone_number) {
          const org = stay.organizations;
          const resident = stay.residents;
          const bed = stay.beds;
          const room = bed?.rooms;
          const prop = room?.properties;

          const monthName = dateObj.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
          const pgName = prop?.name || org?.business_name || 'GreenNest PG';
          const upiVpa = org?.upi_vpa || 'greennest@okhdfcbank';

          try {
            await whatsappClient.sendRentInvoiceMessage(resident.phone_number, {
              roomNumber: room?.room_number || 'N/A',
              bedCode: bed?.bed_code || 'A',
              month: monthName,
              baseRent: baseRent,
              electricity: 0,
              totalOutstanding: baseRent,
              dueDate: '05-' + dateObj.toLocaleString('en-IN', { month: 'short' }) + '-' + billingYear,
              invoiceNumber: newInvoice.invoice_number,
              ownerVpa: upiVpa,
              pgName: pgName,
            });
            result.notificationsSent++;
          } catch (whatsappErr: any) {
            console.warn(`WhatsApp dispatch failed for ${resident.phone_number}:`, whatsappErr.message);
          }

          try {
            const upiLink = `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(pgName)}&am=${baseRent}&tr=INV-${newInvoice.invoice_number}&cu=INR`;
            const billText =
              `📄 *New Rent Invoice Generated!*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `🏢 *Property:* ${pgName}\n` +
              `📅 *Month:* ${monthName}\n` +
              `🏠 *Room:* ${room?.room_number || 'N/A'} (Bed ${bed?.bed_code || 'A'})\n` +
              `💰 *Total Amount:* ₹${baseRent.toLocaleString('en-IN')}\n\n` +
              `📲 *Pay via UPI:* ${upiLink}`;
            await sendTelegramNotificationToResident(resident.phone_number, billText);
          } catch (tgErr: any) {
            // Non-blocking
          }
        }
      } catch (itemErr: any) {
        result.errors.push(`Stay ${stay.id}: ${itemErr.message}`);
      }
    }

    return result;
  } catch (fatalErr: any) {
    console.error('generateMonthlyInvoices failed:', fatalErr);
    result.success = false;
    result.errors.push(fatalErr.message);
    return result;
  }
}

