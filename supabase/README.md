# Supabase Setup Guide for PG Master

This directory contains the complete database setup for **PG Master**, built strictly according to Section 6 of the [Product Requirements Document (PRD)](../requirement.md).

---

## 1. Quick Start via Supabase Dashboard (Recommended)

1. Create a free project on [database.new](https://database.new) (Supabase).
2. Go to **SQL Editor** in your Supabase project dashboard.
3. Copy and run [`supabase/migrations/01_initial_schema.sql`](./migrations/01_initial_schema.sql).
   - This creates all 13 tables, checks, composite foreign keys, generated columns, triggers (`trg_payments_sync`), indexes, and PostgreSQL Row-Level Security (RLS) policies.
4. Copy and run [`supabase/seed.sql`](./seed.sql).
   - This populates a sample 3-floor property (**GreenNest Living PG** in Bangalore) with 6 rooms, 14 beds, 7 residents, active & notice stays, monthly invoices, UPI payments, and complaints.

---

## 2. Linking Your Authenticated User to the Seed Organization

Because Row-Level Security (RLS) restricts data access to authenticated members of each organization:

1. In Supabase Dashboard, go to **Authentication -> Users** and create or sign in with your email account (e.g., `owner@greennest.com`).
2. Copy the generated `User UID` (UUID).
3. In the Supabase **SQL Editor**, run this one-line command replacing `'YOUR_USER_UID'` with your actual UID:

```sql
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('a0000000-0000-0000-0000-000000000001', 'YOUR_USER_UID', 'OWNER')
ON CONFLICT (organization_id, user_id) DO NOTHING;
```

Once linked, your logged-in user has instant, full owner access to the 3-floor GreenNest PG property in the web dashboard!

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`: From Supabase Project Settings -> API -> Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From Supabase Project Settings -> API -> `anon` public key
- `SUPABASE_SERVICE_ROLE_KEY`: From Supabase Project Settings -> API -> `service_role` secret key (for WhatsApp webhook & Cron invoice generator)

