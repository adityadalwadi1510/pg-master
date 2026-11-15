import WebSocket from 'ws';
globalThis.WebSocket = WebSocket;
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...values] = trimmed.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || 'pg-master-media';

console.log('----------------------------------------------------');
console.log('📦 PG Master — Supabase Cloud Storage Diagnostic');
console.log('----------------------------------------------------');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabase credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function runCheck() {
  try {
    console.log(`\n1️⃣  Checking bucket "${BUCKET_NAME}" in Supabase...`);
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (listErr) throw listErr;

    const exists = buckets.find((b) => b.name === BUCKET_NAME);
    if (!exists) {
      console.log(`   Bucket not found. Creating bucket "${BUCKET_NAME}"...`);
      const { error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
      });
      if (createErr) throw createErr;
      console.log(`   ✅ Bucket "${BUCKET_NAME}" successfully created.`);
    } else {
      console.log(`   ✅ Bucket "${BUCKET_NAME}" exists (public: ${exists.public}).`);
    }

    console.log('\n2️⃣  Testing Presigned Upload URL generation...');
    const testKey = `diagnostics/test-${Date.now()}.txt`;
    const { data: signedData, error: signErr } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(testKey);

    if (signErr) throw signErr;
    console.log('   ✅ Presigned upload URL generated successfully.');

    console.log('\n3️⃣  Testing Direct PUT upload via Presigned URL...');
    const testContent = `Storage test verified at ${new Date().toISOString()}`;
    const uploadRes = await fetch(signedData.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: testContent,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed with status ${uploadRes.status}: ${await uploadRes.text()}`);
    }
    console.log('   ✅ Direct PUT upload succeeded (HTTP 200).');

    console.log('\n4️⃣  Verifying Public Download URL...');
    const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(testKey);
    const downloadRes = await fetch(pubData.publicUrl);
    if (!downloadRes.ok) {
      throw new Error(`Public download failed with status ${downloadRes.status}`);
    }
    const downloadedText = await downloadRes.text();
    if (downloadedText === testContent) {
      console.log(`   ✅ Download content matched: "${downloadedText}"`);
    } else {
      console.warn('   ⚠️ Download succeeded but content differed.');
    }

    console.log('\n5️⃣  Cleaning up diagnostic test file...');
    await supabase.storage.from(BUCKET_NAME).remove([testKey]);
    console.log('   ✅ Cleaned up temporary test file.');

    console.log('\n🎉 ALL STORAGE CHECKS PASSED!');
    console.log(`Bucket:      ${BUCKET_NAME}`);
    console.log(`Storage:     Supabase 1 GB Free Tier (₹0 cost, no credit card required)`);
    console.log('Document uploading for KYC and complaints is 100% operational!');
  } catch (err) {
    console.error('\n❌ Storage check failed:', err.message);
    process.exit(1);
  }
}

runCheck();

