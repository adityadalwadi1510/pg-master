import fs from 'fs';
import path from 'path';

// Read .env.local manually
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

const CRON_SECRET = process.env.CRON_SECRET || 'pgmaster_cron_secret_key_123';
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

console.log('----------------------------------------------------');
console.log('⏰ PG Master — Automated Invoice Cron Diagnostic');
console.log('----------------------------------------------------');
console.log(`Target URL:  ${BASE_URL}/api/cron/generate-invoices`);
console.log(`Cron Secret: ${CRON_SECRET.slice(0, 4)}...${CRON_SECRET.slice(-4)}`);

async function runCronTest() {
  try {
    console.log('\n1️⃣  Testing Unauthorized access (without Bearer token)...');
    const unauthRes = await fetch(`${BASE_URL}/api/cron/generate-invoices`);
    console.log(`   Response status: ${unauthRes.status} (${unauthRes.statusText})`);
    if (unauthRes.status === 401) {
      console.log('   ✅ Unauthorized access rejected as expected (401 Unauthorized).');
    } else {
      console.warn(`   ⚠️ Warning: Expected 401, got ${unauthRes.status}`);
    }

    console.log('\n2️⃣  Testing Authorized access (with CRON_SECRET Bearer token)...');
    const authRes = await fetch(`${BASE_URL}/api/cron/generate-invoices`, {
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    const data = await authRes.json();
    console.log(`   Response status: ${authRes.status} (${authRes.statusText})`);
    console.log('   Payload:');
    console.log(JSON.stringify(data, null, 2));

    if (authRes.ok && data.success) {
      console.log('\n🎉 ALL CRON CHECKS PASSED!');
      console.log(`Invoices created: ${data.generatedCount}, skipped/existing: ${data.skippedCount}`);
    } else {
      console.error('\n❌ Cron execution did not report success.');
    }
  } catch (err) {
    console.error('\n❌ Could not connect to local server:', err.message);
    console.log('👉 Make sure the development server is running (`npm run dev`) before testing.');
  }
}

runCronTest();

