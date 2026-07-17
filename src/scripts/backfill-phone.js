const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { db, run, get, all } = require('../config/database');

async function backfillPhones() {
  const leads = await all("SELECT id, phone FROM leads WHERE phone IS NULL OR phone = ''");
  console.log(`Found ${leads.length} leads without phone number`);
  if (leads.length === 0) {
    console.log('All leads have a phone number. Nothing to do.');
    process.exit(0);
  }

  console.log('Phone number comes from WhatsApp remoteJid at lead creation.');
  console.log('Leads without a phone cannot be backfilled from assessment answers.');
  console.log('These leads were likely created outside the WhatsApp flow without a phone.');
  for (const lead of leads) {
    console.log(`  ✗ Lead #${lead.id}: no phone (cannot recover)`);
  }
  process.exit(0);
}

backfillPhones().catch(err => { console.error(err); process.exit(1); });
