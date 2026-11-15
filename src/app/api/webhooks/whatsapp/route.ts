import { NextRequest, NextResponse } from 'next/server';
import { verifyMetaSignature } from '@/lib/whatsapp/crypto';
import { WhatsAppWebhookPayload } from '@/lib/whatsapp/types';
import { processResidentMessage } from '@/lib/bot/state-machine';

// Sliding 10-minute idempotency cache (NFR-3)
const processedMessageIds = new Map<string, number>();

function isDuplicateMessage(messageId: string): boolean {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;

  // Purge entries older than 10 minutes
  for (const [id, timestamp] of processedMessageIds.entries()) {
    if (now - timestamp > tenMinutes) {
      processedMessageIds.delete(id);
    }
  }

  if (processedMessageIds.has(messageId)) {
    return true;
  }

  processedMessageIds.set(messageId, now);
  return false;
}

/**
 * GET Handler: Meta Webhook Subscription Verification
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'pgmaster_verify_token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WhatsApp Webhook verified successfully by Meta.');
    return new Response(challenge ?? '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('❌ WhatsApp Webhook verification failed. Invalid verify token or mode.');
  return new Response('Forbidden', { status: 403 });
}

/**
 * POST Handler: Meta Webhook Event Ingestion
 * NFR-3: Idempotency check on message_id
 * NFR-4: Sub-3-second HTTP 200 OK turnaround
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const appSecret = process.env.WHATSAPP_APP_SECRET || '';

    // 1. Signature Verification
    if (appSecret && !verifyMetaSignature(rawBody, signature, appSecret)) {
      console.warn('❌ Invalid Meta webhook HMAC SHA-256 signature.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: WhatsAppWebhookPayload = JSON.parse(rawBody);

    // 2. Validate WhatsApp object structure
    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    // 3. Extract and Process Messages Asynchronously (NFR-4)
    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const messages = change.value?.messages || [];
        for (const message of messages) {
          // Idempotency check (NFR-3)
          if (isDuplicateMessage(message.id)) {
            console.log(`⚡ Duplicate message delivery skipped: ${message.id}`);
            continue;
          }

          // Asynchronous dispatch so HTTP 200 returns immediately
          processResidentMessage(message).catch((err) => {
            console.error(`Error processing message ${message.id}:`, err);
          });
        }
      }
    }

    // Immediate 200 OK turnaround to Meta within <500ms
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in WhatsApp webhook route:', error);
    // Meta requires 200 OK even on internal processing error to avoid endless retry storms
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 200 });
  }
}

