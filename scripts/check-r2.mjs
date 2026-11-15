import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Read .env.local manually to avoid needing dotenv
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

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'pg-master-media';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

console.log('----------------------------------------------------');
console.log('🔍 PG Master — Cloudflare R2 Connection Diagnostic');
console.log('----------------------------------------------------');

const missing = [];
if (!R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
if (!R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
if (!R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
if (!R2_BUCKET_NAME) missing.push('R2_BUCKET_NAME');

if (missing.length > 0) {
  console.error('❌ Missing required R2 environment variables in .env.local:');
  missing.forEach((v) => console.error(`   - ${v}`));
  console.log('\n👉 Please configure these in your .env.local file and re-run:');
  console.log('   node scripts/check-r2.mjs\n');
  process.exit(1);
}

console.log(`✅ Account ID:     ${R2_ACCOUNT_ID.slice(0, 6)}...${R2_ACCOUNT_ID.slice(-4)}`);
console.log(`✅ Access Key ID:  ${R2_ACCESS_KEY_ID.slice(0, 6)}...`);
console.log(`✅ Bucket Name:    ${R2_BUCKET_NAME}`);
if (R2_PUBLIC_DOMAIN) {
  console.log(`✅ Public Domain:  ${R2_PUBLIC_DOMAIN}`);
} else {
  console.log(`ℹ️  Public Domain:  (Not set - using default r2.cloudflarestorage.com)`);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function runTest() {
  const testKey = `diagnostics/test-${Date.now()}.txt`;
  const testContent = `PG Master R2 verification test run at ${new Date().toISOString()}`;

  try {
    console.log('\n1️⃣  Testing Write (PutObjectCommand)...');
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: testKey,
        Body: Buffer.from(testContent),
        ContentType: 'text/plain',
      })
    );
    console.log(`   ✅ Successfully wrote object to: ${testKey}`);

    console.log('\n2️⃣  Testing Read (GetObjectCommand)...');
    const getRes = await s3.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: testKey,
      })
    );
    const readBody = await getRes.Body.transformToString();
    if (readBody === testContent) {
      console.log('   ✅ Successfully read and verified matching object content.');
    } else {
      console.warn('   ⚠️ Object read, but content did not match.');
    }

    console.log('\n3️⃣  Cleaning up diagnostic test object (DeleteObjectCommand)...');
    await s3.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: testKey,
      })
    );
    console.log('   ✅ Diagnostic test object cleanly removed.');

    console.log('\n🎉 ALL CLOUDFLARE R2 CHECKS PASSED!');
    console.log('Your Cloudflare R2 bucket is fully operational and ready for KYC documents & complaint evidence.');
  } catch (err) {
    console.error('\n❌ R2 Connection Error:');
    console.error(`   Message: ${err.message}`);
    if (err.name) console.error(`   Error Code: ${err.name}`);
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify your R2 Account ID (found on the Cloudflare Dashboard URL or Overview).');
    console.log('2. Ensure the R2 API Token has "Object Read & Write" permissions for the bucket.');
    console.log('3. Ensure the bucket name in .env.local exactly matches the bucket created in Cloudflare.');
    process.exit(1);
  }
}

runTest();

