# Product Requirements Document (PRD) & Technical Specification

**Project Name:** PG Master (Multi-Tenant SaaS)
**Target Milestone:** Minimum Viable Product (MVP)
**Document Version:** 1.0.0
**Target Audience:** Engineering, Product, and Operations

---

## 1. Executive Summary & Core Objectives

PG Master is a lightweight, multi-tenant B2B SaaS platform engineered for Paying Guest (PG) and student hostel owners in India. The platform streamlines physical inventory tracking (rooms and beds), resident onboarding/KYC, automated WhatsApp-based rent invoicing, payment settlement, notice period pipeline management, and resident maintenance ticketing.

### 1.1 Key Business Goals

- **Target Scale:** Architecture sized to scale smoothly from a 5-property pilot to 100+ properties (~3,000 to 5,000 active beds) without database re-architecture.
- **Pricing Alignment:** Priced at ₹4,999 to ₹7,999/year per property while maintaining a >70% gross operational profit margin.
- **Frictionless Tenant Experience:** 100% app-less resident interactions conducted strictly through the WhatsApp Business API.

### 1.2 Zero-Cost Infrastructure Constraints

During initial rollout and pilot validation, all core services must operate entirely within reliable, production-grade free tiers:

- **Compute & API:** Stateless serverless functions (Vercel / Cloudflare Pages / Supabase Edge Functions).
- **Primary Database:** PostgreSQL via Supabase / Neon (Free Tier: 500 MB storage, connection pooling, Row-Level Security).
- **Object Storage:** Cloudflare R2 (S3-compatible, 10 GB storage free tier, 0 egress fees) for tenant KYC and complaint attachments.
- **Messaging:** Direct Meta WhatsApp Cloud API (Graph API) integration, eliminating paid BSP intermediaries (Wati, Interakt).
- **Static Assets:** Browser-side compression before direct R2 uploads via presigned URLs to minimize network payload.

---

## 2. User Personas & System Roles

| Role | Interface | Key Responsibilities |
| :--- | :--- | :--- |
| **PG Owner (Super Admin / Manager)** | Web Dashboard (Desktop & Mobile PWA) | Manages room/bed allocations, monitors collections, marks payments, resolves tickets, tracks vacating beds. |
| **Resident (Tenant)** | WhatsApp Chatbot | Receives rent reminders, pays via dynamic UPI deep-links, logs maintenance tickets, submits move-out notices. |
| **Ground Staff (Warden / Cleaner / Cook)** | WhatsApp Alerts / Read-Only Web View | Receives daily room cleaning logs, maintenance alerts, and dinner/meal headcount RSVP tallies. |

---

## 3. Scope of Work (MVP vs. Post-MVP)

### 3.1 In-Scope for MVP

1. **Multi-Tenant Property & Inventory Hierarchy**
   - Organization → Properties → Floors → Rooms → Beds.
   - Single, Double, Triple, and 4+ sharing support.
   - Real-time bed status transitions: `VACANT`, `OCCUPIED`, `NOTICE_PERIOD`, `MAINTENANCE`.
2. **Resident Onboarding & Digital Ledger**
   - Resident directory mapped by phone number (E.164 format).
   - Active stay mapping, move-in dates, agreed monthly rent, and security deposit balance.
3. **Automated WhatsApp Rent Billing**
   - Monthly invoice generation (1st of every month).
   - Dynamic UPI payment links (`upi://pay`) passed via WhatsApp utility templates.
   - One-click manual payment reconciliation (Cash / Bank Transfer / UPI).
4. **Resident WhatsApp Service Bot**
   - Incoming webhook parsing to auto-match sender phone number to active bed.
   - Interactive list menu: View/Pay Rent, Log Complaint, Submit Notice, View Contacts.
5. **Notice Period Pipeline**
   - Standard 30-day notice period logging via WhatsApp.
   - Automatic status flip of bed to `NOTICE_PERIOD` with future availability date shown on owner matrix.
6. **Maintenance & Complaint Desk**
   - Categorized ticket submission (Wi-Fi, Cleaning, Plumbing, Electrical, Food).
   - Owner dashboard to review, assign, and mark resolved with auto-ping back to tenant.

### 3.2 Out-of-Scope (Post-MVP / Phase 2)

- Sub-metered electricity automated OCR / camera meter scanning.
- Biometric hardware / IoT turnstile gate integrations.
- Granular multi-tier RBAC for secondary staff (cooks, cleaners).
- Native iOS / Android apps for owners (responsive web PWA suffices).
- Automated Razorpay Route / Cashfree Split marketplace payouts (direct UPI links suffice for MVP).

---

## 4. Functional Requirements

### 4.1 Room & Bed Inventory Matrix

- **FR-1.1:** System shall render a 2D floor-by-floor visual grid of all rooms and constituent beds.
- **FR-1.2:** Bed states must visually reflect:
  - Green: `VACANT`
  - Red: `OCCUPIED`
  - Amber: `NOTICE_PERIOD`
  - Gray: `MAINTENANCE`
- **FR-1.3:** Clicking a `VACANT` bed shall launch an inline onboarding modal to assign a resident, capture security deposit, set monthly rent, and specify move-in date.
- **FR-1.4:** System shall support prorated rent calculation for residents joining mid-month:

  ```text
  Prorated Rent = (Monthly Rent / 30) × Days Remaining
  ```

### 4.2 Resident Management & KYC

- **FR-2.1:** System shall record resident full name, WhatsApp phone number, email (optional), emergency contact, and permanent address.
- **FR-2.2:** System shall allow direct document uploads (Aadhaar / College ID) compressed in-browser to WebP (<150 KB) and stored on Cloudflare R2.
- **FR-2.3:** System shall prevent duplicate active stays for the same phone number within the same organization.

### 4.3 WhatsApp Bot & Automated Invoicing

- **FR-3.1:** On the 1st of each month at 08:00 AM IST, a serverless background task shall generate `invoices` for all `ACTIVE` and `NOTICE` stays.
- **FR-3.2:** System shall dispatch a pre-approved Meta WhatsApp Utility Template to each resident with the bill breakdown:

  ```text
  Total Due = Base Rent + Electricity + Add-ons - Discounts
  ```

- **FR-3.3:** The WhatsApp template shall provide an actionable **"Pay via UPI"** button embedding:

  ```text
  upi://pay?pa={owner_vpa}&pn={pg_name}&am={total_amount}&tr=INV-{invoice_number}&cu=INR
  ```

- **FR-3.4:** When an unregistered user texts the WhatsApp bot, the system shall reply with a standard fallback prompt directing them to the property admin.

### 4.4 Complaint Ticketing Lifecycle

- **FR-4.1:** Residents can initiate a ticket via WhatsApp by selecting a category: `WIFI`, `CLEANING`, `PLUMBING`, `ELECTRICAL`, `FOOD`, or `OTHER`.
- **FR-4.2:** Resident may optionally supply a short description and a photo. Photo attachments received from Meta webhooks must be fetched, compressed, and persisted to Cloudflare R2.
- **FR-4.3:** PG Owners shall receive a real-time notification on their dashboard complaints feed.
- **FR-4.4:** When an owner updates a ticket to `RESOLVED`, an automated WhatsApp message shall notify the resident with the resolution timestamp.

### 4.5 Notice Period & Deposit Settlement

- **FR-5.1:** Residents can trigger move-out requests via WhatsApp: `/notice`.
- **FR-5.2:** The bot shall validate that the proposed vacating date is at least 30 days from the current date.
- **FR-5.3:** Upon confirmation, the bed status changes to `NOTICE_PERIOD`, displaying the projected release date on the room matrix.
- **FR-5.4:** At checkout, the dashboard shall display a settlement sheet computing:

  ```text
  Refund Amount = Deposit Held - (Unpaid Rent + Utility Dues + Damage Deductions)
  ```

---

## 5. Non-Functional Requirements (NFRs)

| ID | Category | Requirement |
| :--- | :--- | :--- |
| **NFR-1** | Performance | Dashboard First Contentful Paint (FCP) must remain under 1.5 seconds on a standard 4G mobile network. Bundle sizes must not exceed 250 KB compressed. |
| **NFR-2** | Security & Tenant Isolation | Database queries must strictly isolate tenant records via PostgreSQL Row-Level Security (RLS) policies scoped to the authenticated `organization_id`. |
| **NFR-3** | Webhook Idempotency | Incoming WhatsApp webhook endpoints must implement idempotency checks on `message_id` within a 10-minute sliding window to prevent duplicate ticket generation. |
| **NFR-4** | High Availability on Free Tier | Webhook processing must return an immediate HTTP `200 OK` to Meta within 3 seconds, offloading asynchronous DB writes and storage tasks to edge execution workers. |

---

## 6. Complete Relational Database Schema (PostgreSQL)

**Design notes**

- Requires PostgreSQL 13+ (`gen_random_uuid()` is built in, so no extension is needed). RLS policies use Supabase's `auth.uid()`.
- Every tenant-scoped table carries `organization_id`. Child tables reference parents through composite `(id, organization_id)` foreign keys, so a row can never point at another tenant's data.
- Dashboard users reach data only through RLS. The WhatsApp webhook, the monthly invoice cron, and org sign-up run with the Supabase service role, which bypasses RLS.
- `webhook_events` and `bot_sessions` are internal tables: RLS is enabled with no policies, so only the service role can touch them.

```sql
-- =========================================================
-- 1. Organizations (SaaS Tenants)
-- =========================================================
CREATE TABLE organizations (
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
CREATE TABLE organization_members (
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'MANAGER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id)
);

-- =========================================================
-- 3. Properties
-- =========================================================
CREATE TABLE properties (
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
CREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    floor_number INT NOT NULL,          -- 0 = ground floor
    label VARCHAR(50),                  -- e.g., 'Ground Floor', 'Terrace'
    UNIQUE (property_id, floor_number),
    UNIQUE (id, property_id, organization_id),
    FOREIGN KEY (property_id, organization_id)
        REFERENCES properties(id, organization_id) ON DELETE CASCADE
);

-- =========================================================
-- 5. Rooms
-- =========================================================
CREATE TABLE rooms (
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
CREATE TABLE beds (
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
CREATE TABLE residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL   -- E.164 digits without '+', e.g., 919876543210
        CHECK (phone_number ~ '^[1-9][0-9]{7,14}$'),
    email VARCHAR(100),
    emergency_contact VARCHAR(15),
    permanent_address TEXT,
    id_proof_url TEXT,                  -- R2 object key of compressed WebP
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, phone_number),
    UNIQUE (id, organization_id)
);

-- =========================================================
-- 8. Stays (Allocations & Security Deposit Management)
-- =========================================================
CREATE TABLE stays (
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

-- FR-2.3: one live stay per resident (resident is unique per org + phone)
CREATE UNIQUE INDEX uq_stays_live_resident ON stays(resident_id)
    WHERE status IN ('ACTIVE', 'NOTICE');
-- No double-booking of a bed
CREATE UNIQUE INDEX uq_stays_live_bed ON stays(bed_id)
    WHERE status IN ('ACTIVE', 'NOTICE');

-- =========================================================
-- 9. Invoices (Rent & Monthly Billing)
-- =========================================================
CREATE TABLE invoices (
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
    UNIQUE (stay_id, billing_month),                 -- makes the monthly cron safe to re-run
    UNIQUE (id, organization_id),
    FOREIGN KEY (stay_id, organization_id)
        REFERENCES stays(id, organization_id) ON DELETE CASCADE,
    CHECK (discount_amount <= base_rent + electricity_charges + maintenance_charges + addon_charges)
);

-- =========================================================
-- 10. Payments (one row per receipt; supports partial payments)
-- =========================================================
CREATE TABLE payments (
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
CREATE FUNCTION sync_invoice_payments() RETURNS trigger
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

CREATE TRIGGER trg_payments_sync
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION sync_invoice_payments();

-- =========================================================
-- 11. Complaints
-- =========================================================
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,   -- shown to resident as #{n}
    organization_id UUID NOT NULL,
    stay_id UUID NOT NULL,
    category VARCHAR(30) NOT NULL
        CHECK (category IN ('WIFI', 'CLEANING', 'PLUMBING', 'ELECTRICAL', 'FOOD', 'OTHER')),
    description TEXT,                   -- optional per FR-4.2
    photo_url TEXT,                     -- R2 object key
    assigned_to VARCHAR(100),           -- free text for MVP (staff RBAC is Phase 2)
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
-- Webhook does: INSERT ... ON CONFLICT (message_id) DO NOTHING RETURNING message_id;
-- no row returned => duplicate delivery, skip. A scheduled job purges rows
-- older than the idempotency window.
CREATE TABLE webhook_events (
    message_id VARCHAR(128) PRIMARY KEY,    -- Meta 'wamid.*'
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 13. Bot Sessions (conversation state for multi-step flows)
-- =========================================================
CREATE TABLE bot_sessions (
    phone_number VARCHAR(15) PRIMARY KEY,
    stay_id UUID REFERENCES stays(id) ON DELETE CASCADE,
    state VARCHAR(40) NOT NULL DEFAULT 'IDLE'
        CHECK (state IN ('IDLE', 'AWAITING_COMPLAINT_CATEGORY',
                         'AWAITING_COMPLAINT_DETAILS', 'AWAITING_VACATE_DATE')),
    context JSONB NOT NULL DEFAULT '{}'::jsonb,   -- e.g., {"category": "WIFI"}
    expires_at TIMESTAMPTZ NOT NULL,              -- stale sessions fall back to the main menu
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Row-Level Security (NFR-2)
-- =========================================================
CREATE FUNCTION user_org_ids() RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
$$;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_member_access ON organizations
    FOR ALL TO authenticated
    USING (id IN (SELECT user_org_ids()))
    WITH CHECK (id IN (SELECT user_org_ids()));

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_memberships ON organization_members
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['properties', 'floors', 'rooms', 'beds', 'residents',
                             'stays', 'invoices', 'payments', 'complaints'] LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON %I FOR ALL TO authenticated
                 USING (organization_id IN (SELECT user_org_ids()))
                 WITH CHECK (organization_id IN (SELECT user_org_ids()))', t);
    END LOOP;
END $$;

-- Service-role only (no policies)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- Indexes
-- =========================================================
CREATE INDEX idx_org_members_user        ON organization_members(user_id);
CREATE INDEX idx_rooms_property_floor    ON rooms(property_id, floor_id);
CREATE INDEX idx_beds_status             ON beds(room_id, status);
CREATE INDEX idx_residents_phone         ON residents(phone_number);       -- webhook sender lookup
CREATE INDEX idx_stays_org_status        ON stays(organization_id, status);
CREATE INDEX idx_invoices_stay_status    ON invoices(stay_id, status);
CREATE INDEX idx_invoices_org_month      ON invoices(organization_id, billing_month);
CREATE INDEX idx_payments_invoice        ON payments(invoice_id);
CREATE INDEX idx_complaints_org_status   ON complaints(organization_id, status);
CREATE INDEX idx_webhook_events_received ON webhook_events(received_at);
```

---

## 7. WhatsApp Webhook & Bot Architecture

```text
                [Incoming Webhook from Meta Cloud API]
                                  │
                                  ▼
                  [Validate HMAC SHA256 Signature]
                                  │
                                  ▼
              [Extract Sender Phone: e.g., 919876543210]
                                  │
                                  ▼
                     [Query: residents + stays]
                                  │
            ┌─────────────────────┴─────────────────────┐
            │ Found                                     │ Not Found
            ▼                                           ▼
   [Active Stay Exists?]                       [Send Unregistered Text]
      ├── No  ──► Send "No Active Booking"      "Number not registered with
      └── Yes ──► Render Resident Menu:          any PG. Contact property admin."
                  1. 💳 View / Pay Rent Due
                  2. 🛠️ Log Complaint
                  3. 📢 Vacate Notice
                  4. 📞 Support Contacts
```

### 7.1 Bot Interaction Specifications

#### A. Rent Query & Payment (Action: `VIEW_RENT`)

- **Trigger:** User taps button or sends text matching `rent`, `due`, `pay`, `bills`.
- **Logic:** Query `invoices` where `stay_id = resident.active_stay_id` and `status IN ('UNPAID', 'PARTIALLY_PAID')`, ordered by `due_date ASC`, `LIMIT 1`.
- **Response Payload (Interactive Message with URL Button):**

  ```text
  Rent Summary - Room 204 (Bed B)
  ---------------------------------
  Month: November 2026
  Base Rent: ₹8,000
  Electricity: ₹650
  Total Outstanding: ₹8,650
  Due Date: 05-Nov-2026

  Tap below to complete payment via any UPI App:
  [Pay via UPI] -> upi://pay?pa=owner@okhdfcbank&pn=CityLivingPG&am=8650&tr=INV-9821&cu=INR
  ```

#### B. Log Complaint (Action: `RAISE_COMPLAINT`)

- **Trigger:** User selects *Log Complaint* or sends `cleaning`, `wifi`, `water`.
- **State Machine:**
  1. Prompt user with interactive radio selection: [Wi-Fi], [Cleaning], [Plumbing], [Electrical], [Food].
  2. Await a single text or photo message containing details.
  3. Insert into `complaints` table with status `OPEN`.
- **Response:** `"Ticket logged! Ticket ID: #{ticket_number}. Our maintenance team has been notified."`

#### C. Notice Period (Action: `VACATE_NOTICE`)

- **Trigger:** User sends `/notice` or selects *Vacate Notice*.
- **State Machine:**
  1. Bot checks if stay status is already `NOTICE`.
  2. If not, bot replies: `"Our standard notice period is 30 days. Please reply with your planned move-out date (format: DD-MM-YYYY):"`
  3. Upon receiving a valid date (≥ today + 30 days):
     - Set `stays.status = 'NOTICE'`, `stays.notice_served_date = NOW()`, `stays.expected_vacate_date = input_date`.
     - Update `beds.status = 'NOTICE_PERIOD'`.
     - Dispatch WhatsApp notification to owner and confirm to resident.

---

## 8. Dashboard UI / UX Specifications

### 8.1 Primary Navigation

| Route | Purpose |
| :--- | :--- |
| `/dashboard/overview` | High-level financial KPIs (Expected vs. Collected, Pending Count, Vacancy Rate). |
| `/dashboard/rooms` | Visual Floor/Room/Bed allocation matrix. |
| `/dashboard/billing` | Invoices table, bulk WhatsApp reminder triggers, cash-settlement modals. |
| `/dashboard/complaints` | Actionable ticketing feed. |
| `/dashboard/notices` | 30-day vacancy pipeline and security deposit clearance tracker. |

### 8.2 UI Design Standards

**Color Palette:**

| Color | Hex | Usage |
| :--- | :--- | :--- |
| Emerald | `#10B981` | Vacant beds, Paid status |
| Rose | `#F43F5E` | Occupied beds, Overdue invoices |
| Amber | `#F59E0B` | Beds in notice period, Open complaints |
| Slate | `#64748B` | Maintenance beds, Neutral metadata |

**Component Performance:** Use virtualized lists (`@tanstack/react-virtual` or CSS `content-visibility`) for properties managing over 100 beds to maintain steady 60 FPS scrolling on mobile web.

---

## 9. Implementation Roadmap & Milestones

```text
Phase 1: Database & Core Web Portal (Days 1–5)
├── Set up Supabase project with RLS policies and seed data
├── Build Room/Bed Matrix UI with drag/click allocation modals
└── Build Resident Directory and Quick Check-in forms

Phase 2: Messaging & Invoicing Pipeline (Days 6–9)
├── Integrate Meta WhatsApp Cloud API webhooks
├── Implement stateless resident bot menu (Rent, Complaint, Notice)
└── Build invoice generator with dynamic UPI intent string generation

Phase 3: Storage & Maintenance Board (Days 10–12)
├── Set up Cloudflare R2 presigned URL pipeline with client-side WebP compression
└── Build Owner Complaints Inbox with one-click resolution pings

Phase 4: Pilot Deployment & Validation (Days 13–15)
├── Onboard first 2 pilot PGs with existing physical registers
└── Monitor edge webhook logs, UPI payment reconciliations, and bot latency
```
