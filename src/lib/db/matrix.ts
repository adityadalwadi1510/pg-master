import { createAdminClient } from '@/lib/supabase/admin';
import {
  INITIAL_PROPERTY_DATA,
  PropertyData,
  FloorWithRooms,
  RoomWithBeds,
  BedWithOccupant,
} from '@/lib/mock-data';
import type { BedStatus, SharingType } from '@/types/database';

export interface MatrixFetchResult {
  isLive: boolean;
  data: PropertyData;
  error?: string;
}

/**
 * Fetches the property matrix (floors, rooms, beds, stays, residents) from Supabase.
 * Gracefully falls back to mock data if permissions are pending or DB is unseeded.
 */
export async function fetchMatrixData(): Promise<MatrixFetchResult> {
  try {
    const supabase: any = createAdminClient();

    // 1. Fetch first property
    const { data: prop, error: propErr } = await supabase
      .from('properties')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (propErr || !prop) {
      return {
        isLive: false,
        data: INITIAL_PROPERTY_DATA,
        error: propErr?.message || 'No property found in database',
      };
    }

    // 2. Fetch floors
    const { data: floors, error: floorErr } = await supabase
      .from('floors')
      .select('*')
      .eq('property_id', prop.id)
      .order('floor_number', { ascending: true });

    if (floorErr || !floors || floors.length === 0) {
      return {
        isLive: false,
        data: INITIAL_PROPERTY_DATA,
        error: floorErr?.message || 'No floors found',
      };
    }

    // 3. Fetch rooms
    const { data: rooms, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('property_id', prop.id);

    if (roomErr) {
      return { isLive: false, data: INITIAL_PROPERTY_DATA, error: roomErr.message };
    }

    // 4. Fetch beds
    const { data: beds, error: bedErr } = await supabase
      .from('beds')
      .select('*')
      .eq('organization_id', prop.organization_id);

    if (bedErr) {
      return { isLive: false, data: INITIAL_PROPERTY_DATA, error: bedErr.message };
    }

    // 5. Fetch active stays & residents
    const { data: stays, error: stayErr } = await supabase
      .from('stays')
      .select('*, residents(*)')
      .eq('organization_id', prop.organization_id)
      .in('status', ['ACTIVE', 'NOTICE']);

    if (stayErr) {
      console.warn('Stays fetch error, continuing without stays:', stayErr.message);
    }

    // 6. Fetch current month invoices
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', prop.organization_id)
      .eq('billing_month', currentMonth);

    // Map stays by bed_id
    const stayByBed = new Map<string, any>();
    if (stays) {
      for (const stay of stays) {
        stayByBed.set(stay.bed_id, stay);
      }
    }

    // Map invoices by stay_id
    const invoiceByStay = new Map<string, any>();
    if (invoices) {
      for (const inv of invoices) {
        invoiceByStay.set(inv.stay_id, inv);
      }
    }

    // Assemble hierarchical tree
    const floorList: FloorWithRooms[] = floors.map((fl: any) => {
      const floorRooms = (rooms || []).filter((r: any) => r.floor_id === fl.id);

      const mappedRooms: RoomWithBeds[] = floorRooms.map((rm: any) => {
        const roomBeds = (beds || []).filter((b: any) => b.room_id === rm.id);

        const mappedBeds: BedWithOccupant[] = roomBeds.map((b: any) => {
          const stay = stayByBed.get(b.id);
          const resident = stay?.residents;
          const invoice = stay ? invoiceByStay.get(stay.id) : null;

          return {
            id: b.id,
            room_id: rm.id,
            room_number: rm.room_number,
            floor_id: fl.id,
            floor_number: fl.floor_number,
            floor_label: fl.label || `Floor ${fl.floor_number}`,
            bed_code: b.bed_code,
            status: b.status as BedStatus,
            base_rent: Number(rm.base_rent_per_bed),
            sharing_type: rm.sharing_type as SharingType,
            stay: stay && resident
              ? {
                  id: stay.id,
                  resident_id: resident.id,
                  resident_name: resident.full_name,
                  resident_phone: resident.phone_number,
                  resident_email: resident.email,
                  emergency_contact: resident.emergency_contact,
                  move_in_date: stay.move_in_date,
                  monthly_rent: Number(stay.monthly_rent),
                  security_deposit: Number(stay.security_deposit),
                  notice_served_date: stay.notice_served_date,
                  expected_vacate_date: stay.expected_vacate_date,
                  invoice: invoice
                    ? {
                        id: invoice.id,
                        invoice_number: invoice.invoice_number,
                        total_amount: Number(invoice.total_amount),
                        amount_paid: Number(invoice.amount_paid),
                        status: invoice.status,
                        due_date: invoice.due_date,
                      }
                    : undefined,
                }
              : undefined,
          };
        });

        return {
          id: rm.id,
          floor_id: fl.id,
          floor_number: fl.floor_number,
          room_number: rm.room_number,
          sharing_type: rm.sharing_type as SharingType,
          base_rent_per_bed: Number(rm.base_rent_per_bed),
          beds: mappedBeds,
        };
      });

      return {
        id: fl.id,
        floor_number: fl.floor_number,
        label: fl.label || `Floor ${fl.floor_number}`,
        rooms: mappedRooms,
      };
    });

    return {
      isLive: true,
      data: {
        id: prop.id,
        name: prop.name,
        gender_type: prop.gender_type,
        address: prop.address || '',
        support_phone: prop.support_phone || '',
        floors: floorList,
      },
    };
  } catch (error: any) {
    console.error('fetchMatrixData failed:', error);
    return {
      isLive: false,
      data: INITIAL_PROPERTY_DATA,
      error: error?.message || 'Database connection error',
    };
  }
}

/**
 * Onboards a resident into a bed in Supabase (FR-2.1)
 */
export async function onboardResidentDB(params: {
  bedId: string;
  fullName: string;
  phone: string;
  email?: string;
  moveInDate: string;
  securityDeposit: number;
  monthlyRent: number;
  emergencyContact?: string;
}) {
  try {
    const supabase: any = createAdminClient();

    // 1. Get bed & property org
    const { data: bed, error: bedErr } = await supabase
      .from('beds')
      .select('id, organization_id, status')
      .eq('id', params.bedId)
      .single();

    if (bedErr || !bed) {
      throw new Error('Bed not found');
    }

    const orgId = bed.organization_id;

    // 2. Insert or update resident by phone
    const { data: existingRes } = await supabase
      .from('residents')
      .select('id')
      .eq('phone_number', params.phone)
      .maybeSingle();

    let residentId = existingRes?.id;

    if (!residentId) {
      const { data: newRes, error: resErr } = await supabase
        .from('residents')
        .insert({
          organization_id: orgId,
          full_name: params.fullName,
          phone_number: params.phone,
          email: params.email || null,
          emergency_contact: params.emergencyContact || null,
        })
        .select('id')
        .single();

      if (resErr) throw resErr;
      residentId = newRes.id;
    } else {
      // FR-2.3: Prevent duplicate active stays for the same phone number within the same organization
      const { data: existingActiveStay } = await supabase
        .from('stays')
        .select('id, status, bed_id, beds ( bed_code, rooms ( room_number ) )')
        .eq('resident_id', residentId)
        .eq('organization_id', orgId)
        .in('status', ['ACTIVE', 'NOTICE'])
        .maybeSingle();

      if (existingActiveStay) {
        const room = existingActiveStay.beds?.rooms?.room_number || 'another bed';
        throw new Error(
          `Resident with phone ${params.phone} already has an active stay in Room ${room}. A resident cannot have multiple concurrent stays.`
        );
      }
    }

    // 3. Create Stay record
    const { data: newStay, error: stayErr } = await supabase
      .from('stays')
      .insert({
        organization_id: orgId,
        resident_id: residentId,
        bed_id: params.bedId,
        move_in_date: params.moveInDate,
        monthly_rent: params.monthlyRent,
        security_deposit: params.securityDeposit,
        status: 'ACTIVE',
      })
      .select('id')
      .single();

    if (stayErr) throw stayErr;

    // 4. Mark Bed as OCCUPIED
    const { error: updateBedErr } = await supabase
      .from('beds')
      .update({ status: 'OCCUPIED' })
      .eq('id', params.bedId);

    if (updateBedErr) throw updateBedErr;

    // 5. Generate first month prorated invoice
    const moveIn = new Date(params.moveInDate);
    const year = moveIn.getFullYear();
    const month = moveIn.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const activeDays = daysInMonth - moveIn.getDate() + 1;
    const proratedRent = Math.round((params.monthlyRent / daysInMonth) * activeDays);
    const billingMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const dueDate = `${year}-${String(month + 1).padStart(2, '0')}-05`;

    await supabase.from('invoices').insert({
      organization_id: orgId,
      stay_id: newStay.id,
      billing_month: billingMonth,
      base_rent: proratedRent,
      electricity_charges: 0,
      maintenance_charges: 0,
      addon_charges: 0,
      discount_amount: 0,
      due_date: dueDate,
    });

    return { success: true, stayId: newStay.id };
  } catch (err: any) {
    console.error('onboardResidentDB error:', err);
    return { success: false, error: err.message };
  }
}

