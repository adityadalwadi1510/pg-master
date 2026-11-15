import { NextRequest, NextResponse } from 'next/server';
import { generateMonthlyInvoices } from '@/lib/billing/generator';

/**
 * Monthly Invoicing Cron Job (FR-3.1 & FR-3.2)
 * Scheduled to run on the 1st of every month at 08:00 AM IST (02:30 AM UTC)
 *
 * Security: Protected by Bearer token matching CRON_SECRET
 */
async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Verify CRON_SECRET if configured in production
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also allow Vercel-specific cron invocation header
    const isVercelCron = req.headers.get('x-vercel-cron') === '1';

    if (!isVercelCron) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing CRON_SECRET token.' },
        { status: 401 }
      );
    }
  }

  // Parse optional target month query parameter (e.g. ?month=2026-12-01)
  const url = new URL(req.url);
  const targetMonth = url.searchParams.get('month') || undefined;
  const dispatchWhatsApp = url.searchParams.get('notify') !== 'false';

  console.log(`⏰ [Monthly Cron] Running automated invoice generation for ${targetMonth || 'current month'}...`);

  const result = await generateMonthlyInvoices({
    billingMonth: targetMonth,
    dispatchWhatsApp: dispatchWhatsApp,
  });

  return NextResponse.json({
    message: 'Monthly invoice batch run completed',
    timestamp: new Date().toISOString(),
    metrics: result,
  });
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

