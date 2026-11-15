-- =========================================================
-- PG Master: Comprehensive Seed Data for Testing & Dev
-- Organization: GreenNest Living PG (HSR Layout, Bangalore)
-- =========================================================

DO $$
DECLARE
    v_org_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_prop_id UUID := 'b0000000-0000-0000-0000-000000000001';

    -- Floors
    v_floor_0 UUID := 'c0000000-0000-0000-0000-000000000000';
    v_floor_1 UUID := 'c0000000-0000-0000-0000-000000000001';
    v_floor_2 UUID := 'c0000000-0000-0000-0000-000000000002';

    -- Rooms
    v_room_g01 UUID := 'd0000000-0000-0000-0000-000000000001';
    v_room_g02 UUID := 'd0000000-0000-0000-0000-000000000002';
    v_room_101 UUID := 'd0000000-0000-0000-0000-000000000003';
    v_room_102 UUID := 'd0000000-0000-0000-0000-000000000004';
    v_room_201 UUID := 'd0000000-0000-0000-0000-000000000005';
    v_room_202 UUID := 'd0000000-0000-0000-0000-000000000006';

    -- Beds
    v_bed_g01_a UUID := 'e0000000-0000-0000-0000-000000000001';
    v_bed_g01_b UUID := 'e0000000-0000-0000-0000-000000000002';
    v_bed_g02_a UUID := 'e0000000-0000-0000-0000-000000000003';
    v_bed_101_a UUID := 'e0000000-0000-0000-0000-000000000004';
    v_bed_101_b UUID := 'e0000000-0000-0000-0000-000000000005';
    v_bed_101_c UUID := 'e0000000-0000-0000-0000-000000000006';
    v_bed_102_a UUID := 'e0000000-0000-0000-0000-000000000007';
    v_bed_102_b UUID := 'e0000000-0000-0000-0000-000000000008';
    v_bed_201_a UUID := 'e0000000-0000-0000-0000-000000000009';
    v_bed_201_b UUID := 'e0000000-0000-0000-0000-000000000010';
    v_bed_202_a UUID := 'e0000000-0000-0000-0000-000000000011';
    v_bed_202_b UUID := 'e0000000-0000-0000-0000-000000000012';
    v_bed_202_c UUID := 'e0000000-0000-0000-0000-000000000013';
    v_bed_202_d UUID := 'e0000000-0000-0000-0000-000000000014';

    -- Residents
    v_res_rahul UUID := 'f0000000-0000-0000-0000-000000000001';
    v_res_amit  UUID := 'f0000000-0000-0000-0000-000000000002';
    v_res_priyanshu UUID := 'f0000000-0000-0000-0000-000000000003';
    v_res_vikram UUID := 'f0000000-0000-0000-0000-000000000004';
    v_res_rohan UUID := 'f0000000-0000-0000-0000-000000000005';
    v_res_karthik UUID := 'f0000000-0000-0000-0000-000000000006';
    v_res_aniket UUID := 'f0000000-0000-0000-0000-000000000007';

    -- Stays
    v_stay_rahul UUID := '70000000-0000-0000-0000-000000000001';
    v_stay_amit  UUID := '70000000-0000-0000-0000-000000000002';
    v_stay_priyanshu UUID := '70000000-0000-0000-0000-000000000003';
    v_stay_vikram UUID := '70000000-0000-0000-0000-000000000004';
    v_stay_rohan UUID := '70000000-0000-0000-0000-000000000005';
    v_stay_karthik UUID := '70000000-0000-0000-0000-000000000006';
    v_stay_aniket UUID := '70000000-0000-0000-0000-000000000007';

    -- Invoices
    v_inv_rahul UUID := '80000000-0000-0000-0000-000000000001';
    v_inv_amit  UUID := '80000000-0000-0000-0000-000000000002';
    v_inv_priyanshu UUID := '80000000-0000-0000-0000-000000000003';
    v_inv_vikram UUID := '80000000-0000-0000-0000-000000000004';

    -- Payments
    v_pay_amit UUID := '90000000-0000-0000-0000-000000000001';
    v_pay_priyanshu UUID := '90000000-0000-0000-0000-000000000002';

    -- Complaints
    v_comp_wifi UUID := 'a1000000-0000-0000-0000-000000000001';
    v_comp_plumbing UUID := 'a1000000-0000-0000-0000-000000000002';
    v_comp_food UUID := 'a1000000-0000-0000-0000-000000000003';

    v_current_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
    v_due_date DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '4 days')::DATE;
BEGIN

    -- 1. Create Organization
    INSERT INTO organizations (id, business_name, owner_name, phone_number, upi_vpa, subscription_status)
    VALUES (v_org_id, 'GreenNest Living PG', 'Rajesh Kumar', '919876543210', 'greennest@okhdfcbank', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET business_name = EXCLUDED.business_name;

    -- 2. Create Property
    INSERT INTO properties (id, organization_id, name, gender_type, address, support_phone)
    VALUES (v_prop_id, v_org_id, 'GreenNest Luxury PG - HSR Layout', 'MALE', 'Plot 42, 14th Main, Sector 4, HSR Layout, Bengaluru, Karnataka 560102', '919876543210')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- 3. Create Floors (Ground, 1st, 2nd)
    INSERT INTO floors (id, property_id, organization_id, floor_number, label) VALUES
    (v_floor_0, v_prop_id, v_org_id, 0, 'Ground Floor'),
    (v_floor_1, v_prop_id, v_org_id, 1, '1st Floor'),
    (v_floor_2, v_prop_id, v_org_id, 2, '2nd Floor')
    ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label;

    -- 4. Create Rooms
    -- Ground Floor: Room G01 (Double), G02 (Single)
    INSERT INTO rooms (id, floor_id, property_id, organization_id, room_number, sharing_type, base_rent_per_bed) VALUES
    (v_room_g01, v_floor_0, v_prop_id, v_org_id, 'G01', 'DOUBLE', 9000.00),
    (v_room_g02, v_floor_0, v_prop_id, v_org_id, 'G02', 'SINGLE', 15000.00),
    -- 1st Floor: Room 101 (Triple), 102 (Double)
    (v_room_101, v_floor_1, v_prop_id, v_org_id, '101', 'TRIPLE', 8000.00),
    (v_room_102, v_floor_1, v_prop_id, v_org_id, '102', 'DOUBLE', 9000.00),
    -- 2nd Floor: Room 201 (Double), 202 (Four Plus)
    (v_room_201, v_floor_2, v_prop_id, v_org_id, '201', 'DOUBLE', 9500.00),
    (v_room_202, v_floor_2, v_prop_id, v_org_id, '202', 'FOUR_PLUS', 6500.00)
    ON CONFLICT (id) DO UPDATE SET base_rent_per_bed = EXCLUDED.base_rent_per_bed;

    -- 5. Create Beds
    INSERT INTO beds (id, room_id, organization_id, bed_code, status) VALUES
    -- Room G01
    (v_bed_g01_a, v_room_g01, v_org_id, 'A', 'OCCUPIED'),
    (v_bed_g01_b, v_room_g01, v_org_id, 'B', 'VACANT'),
    -- Room G02
    (v_bed_g02_a, v_room_g02, v_org_id, 'A', 'OCCUPIED'),
    -- Room 101
    (v_bed_101_a, v_room_101, v_org_id, 'A', 'OCCUPIED'),
    (v_bed_101_b, v_room_101, v_org_id, 'B', 'NOTICE_PERIOD'),
    (v_bed_101_c, v_room_101, v_org_id, 'C', 'VACANT'),
    -- Room 102
    (v_bed_102_a, v_room_102, v_org_id, 'A', 'MAINTENANCE'),
    (v_bed_102_b, v_room_102, v_org_id, 'B', 'VACANT'),
    -- Room 201
    (v_bed_201_a, v_room_201, v_org_id, 'A', 'OCCUPIED'),
    (v_bed_201_b, v_room_201, v_org_id, 'B', 'OCCUPIED'),
    -- Room 202
    (v_bed_202_a, v_room_202, v_org_id, 'A', 'VACANT'),
    (v_bed_202_b, v_room_202, v_org_id, 'B', 'VACANT'),
    (v_bed_202_c, v_room_202, v_org_id, 'C', 'OCCUPIED'),
    (v_bed_202_d, v_room_202, v_org_id, 'D', 'VACANT')
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 6. Create Residents
    INSERT INTO residents (id, organization_id, full_name, phone_number, email, emergency_contact, permanent_address) VALUES
    (v_res_rahul, v_org_id, 'Rahul Sharma', '919811122233', 'rahul.sharma@example.com', '919811122230', '124 Civil Lines, Jaipur, Rajasthan'),
    (v_res_amit,  v_org_id, 'Amit Verma', '919822233344', 'amit.verma@example.com', '919822233340', 'Sector 15, Chandigarh'),
    (v_res_priyanshu, v_org_id, 'Priyanshu Patel', '919833344455', 'priyanshu@example.com', '919833344450', 'Alkapuri, Vadodara, Gujarat'),
    (v_res_vikram, v_org_id, 'Vikram Singh', '919844455566', 'vikram.singh@example.com', '919844455560', 'Model Town, Ludhiana, Punjab'),
    (v_res_rohan, v_org_id, 'Rohan Gupta', '919855566677', 'rohan.gupta@example.com', '919855566670', 'Kakadeo, Kanpur, UP'),
    (v_res_karthik, v_org_id, 'Karthik Reddy', '919866677788', 'karthik.r@example.com', '919866677780', 'Madhapur, Hyderabad, Telangana'),
    (v_res_aniket, v_org_id, 'Aniket Joshi', '919877788899', 'aniket.j@example.com', '919877788890', 'Kothrud, Pune, Maharashtra')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- 7. Create Stays
    INSERT INTO stays (id, organization_id, resident_id, bed_id, move_in_date, monthly_rent, security_deposit, status, notice_served_date, expected_vacate_date) VALUES
    -- Rahul in G01-A
    (v_stay_rahul, v_org_id, v_res_rahul, v_bed_g01_a, '2026-08-01', 9000.00, 18000.00, 'ACTIVE', NULL, NULL),
    -- Amit in G02-A
    (v_stay_amit, v_org_id, v_res_amit, v_bed_g02_a, '2026-07-15', 15000.00, 30000.00, 'ACTIVE', NULL, NULL),
    -- Priyanshu in 101-A
    (v_stay_priyanshu, v_org_id, v_res_priyanshu, v_bed_101_a, '2026-09-01', 8000.00, 16000.00, 'ACTIVE', NULL, NULL),
    -- Vikram in 101-B (Notice Period)
    (v_stay_vikram, v_org_id, v_res_vikram, v_bed_101_b, '2026-06-01', 8000.00, 16000.00, 'NOTICE', CURRENT_DATE - 10, CURRENT_DATE + 20),
    -- Rohan in 201-A
    (v_stay_rohan, v_org_id, v_res_rohan, v_bed_201_a, '2026-05-01', 9500.00, 19000.00, 'ACTIVE', NULL, NULL),
    -- Karthik in 201-B
    (v_stay_karthik, v_org_id, v_res_karthik, v_bed_201_b, '2026-10-01', 9500.00, 19000.00, 'ACTIVE', NULL, NULL),
    -- Aniket in 202-C
    (v_stay_aniket, v_org_id, v_res_aniket, v_bed_202_c, '2026-10-15', 6500.00, 13000.00, 'ACTIVE', NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 8. Create Invoices for Current Month
    -- Rahul: Unpaid invoice
    INSERT INTO invoices (id, organization_id, stay_id, billing_month, base_rent, electricity_charges, maintenance_charges, addon_charges, discount_amount, due_date)
    VALUES (v_inv_rahul, v_org_id, v_stay_rahul, v_current_month, 9000.00, 450.00, 0, 0, 0, v_due_date)
    ON CONFLICT (stay_id, billing_month) DO UPDATE SET base_rent = EXCLUDED.base_rent;

    -- Amit: Fully Paid invoice
    INSERT INTO invoices (id, organization_id, stay_id, billing_month, base_rent, electricity_charges, maintenance_charges, addon_charges, discount_amount, due_date)
    VALUES (v_inv_amit, v_org_id, v_stay_amit, v_current_month, 15000.00, 600.00, 0, 0, 0, v_due_date)
    ON CONFLICT (stay_id, billing_month) DO UPDATE SET base_rent = EXCLUDED.base_rent;

    -- Priyanshu: Partially Paid invoice
    INSERT INTO invoices (id, organization_id, stay_id, billing_month, base_rent, electricity_charges, maintenance_charges, addon_charges, discount_amount, due_date)
    VALUES (v_inv_priyanshu, v_org_id, v_stay_priyanshu, v_current_month, 8000.00, 350.00, 0, 0, 0, v_due_date)
    ON CONFLICT (stay_id, billing_month) DO UPDATE SET base_rent = EXCLUDED.base_rent;

    -- Vikram: Unpaid invoice (Notice Period)
    INSERT INTO invoices (id, organization_id, stay_id, billing_month, base_rent, electricity_charges, maintenance_charges, addon_charges, discount_amount, due_date)
    VALUES (v_inv_vikram, v_org_id, v_stay_vikram, v_current_month, 8000.00, 400.00, 0, 0, 0, v_due_date)
    ON CONFLICT (stay_id, billing_month) DO UPDATE SET base_rent = EXCLUDED.base_rent;

    -- 9. Insert Payments (Trigger `trg_payments_sync` will auto-update `invoices.amount_paid` and `status`)
    INSERT INTO payments (id, organization_id, invoice_id, amount, method, reference, paid_at) VALUES
    (v_pay_amit, v_org_id, v_inv_amit, 15600.00, 'UPI', 'UPI/234890123490', NOW() - INTERVAL '2 days'),
    (v_pay_priyanshu, v_org_id, v_inv_priyanshu, 5000.00, 'UPI', 'UPI/890123456789', NOW() - INTERVAL '1 day')
    ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount;

    -- 10. Create Complaints
    INSERT INTO complaints (id, organization_id, stay_id, category, description, status, assigned_to, resolved_at, resolution_note) VALUES
    (v_comp_wifi, v_org_id, v_stay_priyanshu, 'WIFI', '5GHz Wi-Fi router on 1st floor dropping connection repeatedly.', 'OPEN', 'Ramesh (Warden)', NULL, NULL),
    (v_comp_plumbing, v_org_id, v_stay_rahul, 'PLUMBING', 'Bathroom basin tap leaking slowly.', 'IN_PROGRESS', 'Suresh (Plumber)', NULL, NULL),
    (v_comp_food, v_org_id, v_stay_amit, 'FOOD', 'Dinner chapati was cold yesterday.', 'RESOLVED', 'Chef Mohan', NOW() - INTERVAL '1 day', 'Spoke with kitchen staff, warmer installed.')
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

END $$;

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

