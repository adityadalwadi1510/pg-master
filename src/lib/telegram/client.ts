/**
 * Telegram Bot API Client
 * Provides 100% free, zero-approval, instant resident messaging & interactive bot capabilities.
 * Supports inline keyboards, contact verification, dynamic UPI payment links, and webhook dispatch.
 */

export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export class TelegramClient {
  private botToken: string;
  public isConfigured: boolean;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.isConfigured = Boolean(this.botToken);
  }

  /**
   * Internal helper to call Telegram Bot API
   */
  private async callApi(method: string, body: Record<string, unknown>) {
    if (!this.isConfigured) {
      console.log(`🤖 [Telegram Mock / Dev Mode] Call to ${method}:`, JSON.stringify(body, null, 2));
      return { ok: true, result: { message_id: Date.now() } };
    }

    const url = `https://api.telegram.org/bot${this.botToken}/${method}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!data.ok) {
        console.error(`Telegram API Error (${method}):`, data);
        throw new Error(`Telegram error ${data.error_code}: ${data.description}`);
      }

      return data;
    } catch (err: any) {
      console.error(`Failed to execute Telegram API call (${method}):`, err.message);
      throw err;
    }
  }

  /**
   * Send text message with Markdown formatting (falls back to plain text if syntax error occurs)
   */
  async sendMessage(
    chatId: string | number,
    text: string,
    options?: {
      parse_mode?: 'Markdown' | 'HTML';
      reply_markup?: any;
    }
  ) {
    try {
      return await this.callApi('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode ?? 'Markdown',
        reply_markup: options?.reply_markup,
      });
    } catch (err: any) {
      if (options?.parse_mode ?? true) {
        // Fallback to plain text without Markdown formatting
        return this.callApi('sendMessage', {
          chat_id: chatId,
          text: text.replace(/[*_`\[\]]/g, ''),
          reply_markup: options?.reply_markup,
        });
      }
      throw err;
    }
  }

  /**
   * Send message with Inline Keyboard Buttons
   */
  async sendInlineKeyboard(
    chatId: string | number,
    text: string,
    buttons: TelegramInlineButton[][]
  ) {
    return this.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  /**
   * Send Reply Keyboard to request resident contact / phone number
   */
  async sendContactRequest(chatId: string | number, text: string) {
    return this.callApi('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [{ text: '📱 Verify & Share My Phone Number', request_contact: true }],
          [{ text: '❓ Need Help' }],
        ],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
  }

  /**
   * Answer callback query (acknowledges inline button clicks)
   */
  async answerCallbackQuery(callbackQueryId: string, text?: string) {
    return this.callApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
    });
  }

  /**
   * Send Rent Invoice Summary with Dynamic NPCI UPI Deep Link Button
   */
  async sendRentInvoiceMessage(
    chatId: string | number,
    details: {
      roomNumber: string;
      bedCode: string;
      month: string;
      baseRent: number;
      electricity: number;
      totalOutstanding: number;
      dueDate: string;
      invoiceNumber: number | string;
      ownerVpa: string;
      pgName: string;
    }
  ) {
    const upiLink = `upi://pay?pa=${details.ownerVpa}&pn=${encodeURIComponent(
      details.pgName
    )}&am=${details.totalOutstanding}&tr=INV-${details.invoiceNumber}&cu=INR`;

    const summaryText =
      `📄 *Rent Summary — Room ${details.roomNumber} (Bed ${details.bedCode})*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏢 *Property:* ${details.pgName}\n` +
      `📅 *Billing Month:* ${details.month}\n` +
      `🏠 *Base Rent:* ₹${details.baseRent.toLocaleString('en-IN')}\n` +
      `⚡ *Electricity:* ₹${details.electricity.toLocaleString('en-IN')}\n` +
      `💰 *Total Amount Due:* ₹${details.totalOutstanding.toLocaleString('en-IN')}\n` +
      `⏳ *Due Date:* ${details.dueDate}\n\n` +
      `📲 *Pay via UPI (GPay, PhonePe, Paytm, BHIM):*\n` +
      `• UPI ID: \`${details.ownerVpa}\`\n` +
      `• Amount: \`₹${details.totalOutstanding}\`\n\n` +
      `_💡 Tap on the UPI ID above to copy it and pay in any UPI app._`;

    return this.sendInlineKeyboard(chatId, summaryText, [
      [{ text: '🔙 Main Menu', callback_data: 'MAIN_MENU' }],
    ]);
  }

  /**
   * Verify Bot Token and retrieve bot metadata
   */
  async getMe() {
    return this.callApi('getMe', {});
  }

  /**
   * Configure Telegram webhook URL for production (e.g., Vercel deployment)
   */
  async setWebhook(url: string) {
    return this.callApi('setWebhook', { url });
  }

  /**
   * Delete webhook (needed when switching to local polling mode)
   */
  async deleteWebhook() {
    return this.callApi('deleteWebhook', {});
  }

  /**
   * Fetch pending updates in polling mode
   */
  async getUpdates(offset?: number, timeout: number = 30) {
    return this.callApi('getUpdates', {
      offset,
      timeout,
      allowed_updates: ['message', 'callback_query'],
    });
  }
}

export const telegramClient = new TelegramClient();
