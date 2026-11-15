import WebSocket from 'ws';
globalThis.WebSocket = WebSocket;
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing connection to Supabase at:', supabaseUrl);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('--- Testing with Service Role Key ---');
    // 1. Query organizations
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('*');
    if (orgError) {
      console.error('Error querying organizations (service_role):', orgError);
    } else {
      console.log(`✅ Organizations found: ${orgs?.length}`);
    }

    console.log('--- Testing with Anon Key ---');
    const { data: anonOrgs, error: anonError } = await anonSupabase.from('organizations').select('*');
    if (anonError) {
      console.error('Error querying organizations (anon):', anonError);
    } else {
      console.log(`✅ Organizations found (anon): ${anonOrgs?.length}`);
    }
    if (orgs && orgs.length > 0) {
      console.log('   First Org:', orgs[0].business_name, `(ID: ${orgs[0].id})`);
    }

    // 2. Query properties
    const { data: props, error: propError } = await supabase.from('properties').select('*');
    if (propError) {
      console.error('Error querying properties:', propError);
      return;
    }
    console.log(`✅ Properties found: ${props?.length}`);

    // 3. Query rooms & beds
    const { data: beds, error: bedError } = await supabase.from('beds').select('*');
    if (bedError) {
      console.error('Error querying beds:', bedError);
      return;
    }
    console.log(`✅ Total Beds found: ${beds?.length}`);

    // 4. Query residents & stays
    const { data: residents, error: resError } = await supabase.from('residents').select('*');
    if (resError) {
      console.error('Error querying residents:', resError);
      return;
    }
    console.log(`✅ Residents found: ${residents?.length}`);

    // 5. Query invoices
    const { data: invoices, error: invError } = await supabase.from('invoices').select('*');
    if (invError) {
      console.error('Error querying invoices:', invError);
      return;
    }
    console.log(`✅ Invoices found: ${invoices?.length}`);

    // 6. Query complaints
    const { data: complaints, error: compError } = await supabase.from('complaints').select('*');
    if (compError) {
      console.error('Error querying complaints:', compError);
      return;
    }
    console.log(`✅ Complaints found: ${complaints?.length}`);

    console.log('\n🎉 ALL DATABASE CHECKS PASSED! Connected to live PostgreSQL successfully.');
  } catch (err) {
    console.error('Connection failed with exception:', err);
  }
}

testConnection();

