-- =========================================================
-- PG Master: Initial Relational Database Schema & RLS
-- Target: PostgreSQL 13+ (Supabase)
-- =========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 1. Organizations (SaaS Tenants)
-- =========================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    upi_vpa VARCHAR(100) NOT NULL,
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'PILOT_ACTIVE'
        CHECK (subscription_status IN ('PILOT_ACTIVE', 'ACTIVE', 'PAST_DUE', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 2. Organization Members (dashboard login -> tenant mapping, drives RLS)
-- =========================================================
CREATE TABLE IF NOT EXISTS organization_members (
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'MANAGER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id)
);

-- =========================================================
-- 3. Properties
-- =========================================================
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    gender_type VARCHAR(10) CHECK (gender_type IN ('MALE', 'FEMALE', 'COED')),
    address TEXT,
    support_phone VARCHAR(15),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id, organization_id)
);

-- =========================================================
-- 4. Floors
-- =========================================================
CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    floor_number INT NOT NULL,          -- 0 = ground floor
    label VARCHAR(50),                  -- e.g., 'Ground Floor', '1st Floor', 'Terrace'
    UNIQUE (property_id, floor_number),
    UNIQUE (id, property_id, organization_id),
    FOREIGN KEY (property_id, organization_id)
        REFERENCES properties(id, organization_id) ON DELETE CASCADE
);

-- =========================================================
-- 5. Rooms
-- =========================================================
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL,
    property_id UUID NOT NULL,          -- denormalized for fast per-property matrix queries
    organization_id UUID NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    sharing_type VARCHAR(10) NOT NULL
        CHECK (sharing_type IN ('SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_PLUS')),
    base_rent_per_bed NUMERIC(10, 2) NOT NULL CHECK (base_rent_per_bed >= 0),
    UNIQUE (property_id, room_number),
    UNIQUE (id, organization_id),
    FOREIGN KEY (floor_id, property_id, organization_id)
        REFERENCES floors(id, property_id, organization_id) ON DELETE CASCADE
);

-- =========================================================
-- 6. Beds
-- =========================================================
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    bed_code VARCHAR(10) NOT NULL,      -- e.g., 'A', 'B', 'C'
    status VARCHAR(20) NOT NULL DEFAULT 'VACANT'
        CHECK (status IN ('VACANT', 'OCCUPIED', 'NOTICE_PERIOD', 'MAINTENANCE')),
    UNIQUE (room_id, bed_code),
    UNIQUE (id, organization_id),
    FOREIGN KEY (room_id, organization_id)
        REFERENCES rooms(id, organization_id) ON DELETE CASCADE
);

-- =========================================================
-- 7. Residents
-- =========================================================
CREATE TABLE IF NOT EXISTS residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL   -- E.164 digits without '+', e.g., 919876543210
        CHECK (phone_number ~ '^[1-9][0-9]{7,14}$'),
    email VARCHAR(100),
    emergency_contact VARCHAR(15),
    permanent_address TEXT,
    id_proof_url TEXT,                  -- Cloudflare R2 object key of compressed WebP
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, phone_number),
    UNIQUE (id, organization_id)
);

-- =========================================================
-- 8. Stays (Allocations & Security Deposit Management)
-- =========================================================
CREATE TABLE IF NOT EXISTS stays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    resident_id UUID NOT NULL,
    bed_id UUID NOT NULL,
    move_in_date DATE NOT NULL,
    notice_served_date DATE,
    expected_vacate_date DATE,
    actual_vacate_date DATE,
    monthly_rent NUMERIC(10, 2) NOT NULL CHECK (monthly_rent >= 0),
    security_deposit NUMERIC(10, 2) NOT NULL CHECK (security_deposit >= 0),
    -- Settlement sheet (FR-5.4)
    damage_deductions NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (damage_deductions >= 0),
    settlement_notes TEXT,
    deposit_refund_amount NUMERIC(10, 2),
    settled_at TIMESTAMPTZ,
    deposit_status VARCHAR(20) NOT NULL DEFAULT 'HELD'
        CHECK (deposit_status IN ('HELD', 'SETTLED', 'REFUNDED')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'NOTICE', 'COMPLETED', 'TERMINATED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id, organization_id),
    FOREIGN KEY (resident_id, organization_id)
        REFERENCES residents(id, organization_id) ON DELETE RESTRICT,
    FOREIGN KEY (bed_id, organization_id)
        REFERENCES beds(id, organization_id) ON DELETE RESTRICT,
    CHECK (expected_vacate_date IS NULL OR notice_served_date IS NULL
           OR expected_vacate_date >= notice_served_date),
    CHECK (actual_vacate_date IS NULL OR actual_vacate_date >= move_in_date)
);

-- One live stay per resident
CREATE UNIQUE INDEX IF NOT EXISTS uq_stays_live_resident ON stays(resident_id)
    WHERE status IN ('ACTIVE', 'NOTICE');

-- No double-booking of a live bed
CREATE UNIQUE INDEX IF NOT EXISTS uq_stays_live_bed ON stays(bed_id)
    WHERE status IN ('ACTIVE', 'NOTICE');

-- =========================================================
-- 9. Invoices (Rent & Monthly Billing)
-- =========================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,  -- shown as INV-{n}, used as UPI `tr`
    organization_id UUID NOT NULL,
    stay_id UUID NOT NULL,
    billing_month DATE NOT NULL
        CHECK (billing_month = date_trunc('month', billing_month)::date),  -- 'YYYY-MM-01'
    base_rent NUMERIC(10, 2) NOT NULL CHECK (base_rent >= 0),
    electricity_charges NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (electricity_charges >= 0),
    maintenance_charges NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (maintenance_charges >= 0),
    addon_charges NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (addon_charges >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    -- FR-3.2: Total Due = Base Rent + Electricity + Add-ons - Discounts
    total_amount NUMERIC(10, 2) GENERATED ALWAYS AS (
        base_rent + electricity_charges + maintenance_charges + addon_charges - discount_amount
    ) STORED,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,   -- maintained by trg_payments_sync
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID'
        CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'WAIVED')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (stay_id, billing_month),                 -- makes the monthly cron idempotent
    UNIQUE (id, organization_id),
    FOREIGN KEY (stay_id, organization_id)
        REFERENCES stays(id, organization_id) ON DELETE CASCADE,
    CHECK (discount_amount <= base_rent + electricity_charges + maintenance_charges + addon_charges)
);

-- =========================================================
-- 10. Payments (one row per receipt; supports partial payments)
-- =========================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    method VARCHAR(20) NOT NULL CHECK (method IN ('UPI', 'CASH', 'BANK_TRANSFER')),
    reference VARCHAR(100),             -- UPI UTR / bank reference
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (invoice_id, organization_id)
        REFERENCES invoices(id, organization_id) ON DELETE RESTRICT
);

-- Keep invoices.amount_paid / status / paid_at in sync with payments
CREATE OR REPLACE FUNCTION sync_invoice_payments() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_invoice UUID := COALESCE(NEW.invoice_id, OLD.invoice_id);
BEGIN
    UPDATE invoices i SET
        amount_paid = p.total,
        status = CASE
            WHEN i.status = 'WAIVED'       THEN 'WAIVED'
            WHEN p.total >= i.total_amount THEN 'PAID'
            WHEN p.total > 0               THEN 'PARTIALLY_PAID'
            ELSE 'UNPAID'
        END,
        paid_at = CASE WHEN p.total >= i.total_amount THEN p.last_paid END
    FROM (
        SELECT COALESCE(SUM(amount), 0) AS total, MAX(paid_at) AS last_paid
        FROM payments WHERE invoice_id = v_invoice
    ) p
    WHERE i.id = v_invoice;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_sync ON payments;
CREATE TRIGGER trg_payments_sync
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION sync_invoice_payments();

-- =========================================================
-- 11. Complaints
-- =========================================================
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,   -- shown to resident as #{n}
    organization_id UUID NOT NULL,
    stay_id UUID NOT NULL,
    category VARCHAR(30) NOT NULL
        CHECK (category IN ('WIFI', 'CLEANING', 'PLUMBING', 'ELECTRICAL', 'FOOD', 'OTHER')),
    description TEXT,                   -- optional per FR-4.2
    photo_url TEXT,                     -- Cloudflare R2 object key
    assigned_to VARCHAR(100),           -- free text for MVP
    resolution_note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (stay_id, organization_id)
        REFERENCES stays(id, organization_id) ON DELETE CASCADE,
    CHECK (status <> 'RESOLVED' OR resolved_at IS NOT NULL)
);

-- =========================================================
-- 12. Webhook Events (NFR-3 idempotency)
-- =========================================================
CREATE TABLE IF NOT EXISTS webhook_events (
    message_id VARCHAR(128) PRIMARY KEY,    -- Meta 'wamid.*'
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 13. Bot Sessions (conversation state for multi-step WhatsApp flows)
-- =========================================================
CREATE TABLE IF NOT EXISTS bot_sessions (
    phone_number VARCHAR(15) PRIMARY KEY,
    stay_id UUID REFERENCES stays(id) ON DELETE CASCADE,
    state VARCHAR(40) NOT NULL DEFAULT 'IDLE'
        CHECK (state IN ('IDLE', 'AWAITING_COMPLAINT_CATEGORY',
                         'AWAITING_COMPLAINT_DETAILS', 'AWAITING_VACATE_DATE')),
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Row-Level Security (RLS) Configuration (NFR-2)
-- =========================================================
CREATE OR REPLACE FUNCTION user_org_ids() RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
$$;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_member_access ON organizations;
CREATE POLICY org_member_access ON organizations
    FOR ALL TO authenticated
    USING (id IN (SELECT user_org_ids()))
    WITH CHECK (id IN (SELECT user_org_ids()));

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS own_memberships ON organization_members;
CREATE POLICY own_memberships ON organization_members
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['properties', 'floors', 'rooms', 'beds', 'residents',
                             'stays', 'invoices', 'payments', 'complaints'] LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON %I FOR ALL TO authenticated
                 USING (organization_id IN (SELECT user_org_ids()))
                 WITH CHECK (organization_id IN (SELECT user_org_ids()))', t);
    END LOOP;
END $$;

-- Webhook events & bot sessions are internal tables (Service-Role only)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- Indexes for Sub-Millisecond Tenant Filtering
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_org_members_user        ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_property_floor    ON rooms(property_id, floor_id);
CREATE INDEX IF NOT EXISTS idx_beds_status             ON beds(room_id, status);
CREATE INDEX IF NOT EXISTS idx_residents_phone         ON residents(phone_number);
CREATE INDEX IF NOT EXISTS idx_stays_org_status        ON stays(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_stay_status    ON invoices(stay_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_org_month      ON invoices(organization_id, billing_month);
CREATE INDEX IF NOT EXISTS idx_payments_invoice        ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_complaints_org_status   ON complaints(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON webhook_events(received_at);

-- =========================================================
-- Permissions: Grant access to Supabase API roles (NFR-2)
-- =========================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


