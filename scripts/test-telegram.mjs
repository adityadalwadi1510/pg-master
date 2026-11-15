import WebSocket from 'ws';
globalThis.WebSocket = WebSocket;
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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

console.log('----------------------------------------------------');
console.log('🤖 PG Master — Telegram Resident Bot Diagnostic');
console.log('----------------------------------------------------');

if (!BOT_TOKEN) {
  console.log('❌ TELEGRAM_BOT_TOKEN is not configured in .env.local\n');
  console.log('👉 Quick 30-Second Setup:');
  console.log('1. Open Telegram and search for: @BotFather');
  console.log('2. Send: /newbot');
  console.log('3. Enter a Bot Name (e.g., "PG Master Bot")');
  console.log('4. Enter a Username ending in bot (e.g., "pg_master_yourname_bot")');
  console.log('5. BotFather will reply with your API token (e.g., 7812345678:AAH...)');
  console.log('6. Add it to .env.local:');
  console.log('   TELEGRAM_BOT_TOKEN=your_token_here\n');
  console.log('Then re-run: node scripts/test-telegram.mjs\n');
  process.exit(1);
}

console.log(`✅ Token Found: ${BOT_TOKEN.slice(0, 8)}...${BOT_TOKEN.slice(-5)}`);

async function checkBot() {
  try {
    console.log('\n1️⃣  Verifying bot credentials with Telegram API...');
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const data = await res.json();

    if (!data.ok) {
      console.error('❌ Telegram API Error:', data.description);
      process.exit(1);
    }

    const bot = data.result;
    console.log(`   ✅ Bot Verified: "${bot.first_name}" (@${bot.username})`);
    console.log(`   🔗 Direct Chat Link: https://t.me/${bot.username}`);

    const isPollMode = process.argv.includes('--poll');

    if (!isPollMode) {
      console.log('\n🎉 TELEGRAM BOT IS READY!');
      console.log('To run the bot locally right now in live interactive polling mode:');
      console.log('   node scripts/test-telegram.mjs --poll');
      console.log('\nYou can then open https://t.me/' + bot.username + ' and start chatting!');
      process.exit(0);
    }

    // Polling Mode for Instant Local Interactive Testing
    console.log('\n2️⃣  Starting Local Polling Mode...');
    console.log('   Deleting any stale webhooks for clean polling...');
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);

    // Dynamically import bot handler
    const { handleTelegramUpdate } = await import('../src/lib/telegram/bot.ts');

    console.log(`\n🚀 Bot is now LIVE & listening for messages!`);
    console.log(`📱 Open https://t.me/${bot.username} on your phone and tap START.`);
    console.log('   (Press Ctrl+C to stop)\n');

    let offset = 0;
    while (true) {
      try {
        const pollRes = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=20`
        );
        const pollData = await pollRes.json();
        if (pollData.ok && pollData.result && pollData.result.length > 0) {
          for (const update of pollData.result) {
            offset = update.update_id + 1;
            const sender = update.message?.from?.first_name || update.callback_query?.from?.first_name || 'User';
            const text = update.message?.text || update.callback_query?.data || '(button/contact)';
            console.log(`📩 [${new Date().toLocaleTimeString()}] Received from ${sender}: ${text}`);
            await handleTelegramUpdate(update);
          }
        }
      } catch (pollErr) {
        console.error('Polling loop warning:', pollErr.message);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
}

checkBot();
