const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { all, run } = require('../config/database');

async function fixCorruptedPhones() {
  // Find leads where phone looks like a corrupted age value:
  // e.g. "2342635" (from "26 - 35"), "2343645" (from "36 - 45"), etc.
  // These are < 11 digits but start with 234
  const corrupted = await all(
    "SELECT id, name, business_name, phone FROM leads WHERE phone LIKE ? AND LENGTH(phone) < 11",
    ['234%']
  );

  if (corrupted.length === 0) {
    console.log('No corrupted phones found.');
    process.exit(0);
  }

  console.log(`Found ${corrupted.length} leads with corrupted phone numbers:`);
  for (const lead of corrupted) {
    const displayName = lead.business_name || lead.name || 'Unknown';
    console.log(`  Lead #${lead.id} (${displayName}): phone = "${lead.phone}"`);
  }

  // Set phone to NULL so the real WhatsApp number takes effect
  // (webhook.js creates leads with phoneNumber from remoteJid)
  await run("UPDATE leads SET phone = NULL WHERE phone LIKE ? AND LENGTH(phone) < 11", ['234%']);
  console.log(`\nCleared phone for ${corrupted.length} corrupted leads.`);
  console.log('The WhatsApp remoteJid will be used as the phone number on next message.');

  process.exit(0);
}

fixCorruptedPhones().catch(err => { console.error(err); process.exit(1); });
