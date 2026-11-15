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

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

console.log('----------------------------------------------------');
console.log('📱 PG Master — Meta WhatsApp Cloud API Diagnostic');
console.log('----------------------------------------------------');

const missing = [];
if (!PHONE_NUMBER_ID) missing.push('WHATSAPP_PHONE_NUMBER_ID');
if (!ACCESS_TOKEN) missing.push('WHATSAPP_ACCESS_TOKEN');

if (missing.length > 0) {
  console.error('❌ Missing WhatsApp credentials in .env.local:');
  missing.forEach((v) => console.error(`   - ${v}`));
  console.log('\n👉 Please configure these in your .env.local file and re-run.');
  process.exit(1);
}

console.log(`✅ Phone Number ID: ${PHONE_NUMBER_ID}`);
console.log(`✅ Access Token:    ${ACCESS_TOKEN.slice(0, 10)}...${ACCESS_TOKEN.slice(-5)}`);
if (APP_SECRET) {
  console.log(`✅ App Secret:      Configured (used for Webhook HMAC validation)`);
} else {
  console.log(`ℹ️  App Secret:      Not set (optional in dev, required in production)`);
}

// Check if a target phone number was provided as argument: node scripts/test-whatsapp.mjs 919876543210
const targetPhone = process.argv[2];

if (!targetPhone) {
  console.log('\n💡 To send a live test message, provide your phone number:');
  console.log('   node scripts/test-whatsapp.mjs <country_code_and_number>');
  console.log('   Example: node scripts/test-whatsapp.mjs 919876543210\n');
  process.exit(0);
}

const sanitizedTo = targetPhone.replace(/[^0-9]/g, '');

async function sendTest() {
  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: sanitizedTo,
    type: 'text',
    text: {
      preview_url: false,
      body: '👋 Hello from PG Master! Your WhatsApp Cloud API integration is verified and working perfectly.',
    },
  };

  try {
    console.log(`\n🚀 Sending test message to: +${sanitizedTo}...`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('\n❌ WhatsApp API Error Response:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('\n🎉 SUCCESS! Message delivered to WhatsApp network.');
    console.log(`   Message ID: ${data.messages?.[0]?.id}`);
    console.log('Check WhatsApp on your phone!');
  } catch (err) {
    console.error('\n❌ Request Failed:', err.message);
    process.exit(1);
  }
}

sendTest();

