import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Note: NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
// This client bypasses PostgreSQL Row-Level Security (RLS) and is
// strictly for serverless webhooks, WhatsApp bot handling, and monthly cron execution.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase Service Role environment variables.');
  }

  return createClient<any>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

