import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/telegram/bot';

/**
 * Production Webhook Receiver for Telegram Bot Updates
 * Processes resident interactions, button taps, and commands.
 */
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Process update asynchronously so response returns sub-500ms
    // preventing Telegram from retrying
    handleTelegramUpdate(update).catch((err) => {
      console.error('Async Telegram update error:', err);
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram webhook parsing error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'PG Master Telegram Webhook Endpoint',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
  });
}
