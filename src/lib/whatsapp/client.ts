/**
 * Meta WhatsApp Cloud API Client (Direct Graph API Integration)
 * Eliminates paid BSP intermediaries (Wati, Interakt) per Section 1.2
 */

export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;
  private isConfigured: boolean;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.isConfigured = Boolean(this.phoneNumberId && this.accessToken);
  }

  /**
   * Internal helper to POST to Meta Graph API
   */
  private async postMessage(payload: Record<string, unknown>) {
    if (!this.isConfigured) {
      console.log('📱 [WhatsApp Mock / Dev Mode] Outgoing Message Payload:', JSON.stringify(payload, null, 2));
      return { messaging_product: 'whatsapp', contacts: [{ input: payload.to }], messages: [{ id: `mock-${Date.now()}` }] };
    }

    const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Meta WhatsApp Graph API Error:', errorText);
        throw new Error(`WhatsApp API responded with status ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to post message to WhatsApp Graph API:', err);
      throw err;
    }
  }

  /**
   * Send plain text message
   */
  async sendTextMessage(to: string, body: string) {
    return this.postMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/[^0-9]/g, ''),
      type: 'text',
      text: {
        preview_url: false,
        body: body,
      },
    });
  }

  /**
   * Send interactive quick reply buttons (Max 3 buttons per Meta constraints)
   */
  async sendInteractiveButtons(
    to: string,
    body: string,
    buttons: Array<{ id: string; title: string }>
  ) {
    return this.postMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/[^0-9]/g, ''),
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.slice(0, 3).map((btn) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title.slice(0, 20), // Max 20 chars per Meta rule
            },
          })),
        },
      },
    });
  }

  /**
   * Send interactive list menu (Up to 10 items)
   */
  async sendInteractiveList(
    to: string,
    body: string,
    buttonText: string,
    rows: Array<{ id: string; title: string; description?: string }>
  ) {
    return this.postMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/[^0-9]/g, ''),
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: body },
        action: {
          button: buttonText.slice(0, 20),
          sections: [
            {
              title: 'Available Options',
              rows: rows.map((r) => ({
                id: r.id,
                title: r.title.slice(0, 24),
                description: r.description ? r.description.slice(0, 72) : undefined,
              })),
            },
          ],
        },
      },
    });
  }

  /**
   * Send Rent Invoice Summary with Dynamic NPCI UPI Deep Link (Section 7.1.A)
   */
  async sendRentInvoiceMessage(
    to: string,
    details: {
      roomNumber: string;
      bedCode: string;
      month: string;
      baseRent: number;
      electricity: number;
      totalOutstanding: number;
      dueDate: string;
      invoiceNumber: number;
      ownerVpa: string;
      pgName: string;
    }
  ) {
    const upiLink = `upi://pay?pa=${details.ownerVpa}&pn=${encodeURIComponent(
      details.pgName
    )}&am=${details.totalOutstanding}&tr=INV-${details.invoiceNumber}&cu=INR`;

    const summaryText =
      `📄 *Rent Summary - Room ${details.roomNumber} (Bed ${details.bedCode})*\n` +
      `---------------------------------\n` +
      `📅 *Month:* ${details.month}\n` +
      `🏠 *Base Rent:* ₹${details.baseRent.toLocaleString('en-IN')}\n` +
      `⚡ *Electricity:* ₹${details.electricity.toLocaleString('en-IN')}\n` +
      `💰 *Total Outstanding:* ₹${details.totalOutstanding.toLocaleString('en-IN')}\n` +
      `⏳ *Due Date:* ${details.dueDate}\n\n` +
      `📲 *Tap below to pay instantly via any UPI App (GPay, PhonePe, Paytm, BHIM):*\n` +
      `${upiLink}`;

    return this.sendTextMessage(to, summaryText);
  }
}

export const whatsappClient = new WhatsAppClient();

