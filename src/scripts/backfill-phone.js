const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { db, run, get, all } = require('../config/database');

const PREFIX_MAP = {
  'school': 'SCH', 'manufacturing': 'MFG', 'hospital': 'HOS', 'healthcare': 'HOS',
  'church': 'CHR', 'family': 'FAM', 'personal': 'FAM', 'individual': 'FAM',
  'young': 'YPR', 'retirement': 'RET', 'income': 'INC', 'health': 'HLT',
  'entrepreneur': 'ENT', 'sme': 'SME', 'business': 'SME'
};
const PREFIXES = [...new Set(Object.values(PREFIX_MAP))];

// Personal funnels use _009 for AGE, not phone — skip these
const PERSONAL_PREFIXES = ['FAM', 'INC', 'HLT', 'RET', 'YPR', 'ENT', 'HOM', 'MOT'];

function getPhoneFromAnswers(answers) {
  if (!answers) return null;
  const prefix = answers.template_selection?.template_id;
  // For personal funnels, _009 is the age question — skip
  if (prefix && !PERSONAL_PREFIXES.includes(prefix)) {
    const val = answers[`${prefix}_009`];
    if (val && typeof val === 'string' && val.length >= 7) return val;
  }
  // Fallback: try all prefixes but skip personal ones
  for (const p of PREFIXES) {
    if (PERSONAL_PREFIXES.includes(p)) continue;
    const val = answers[`${p}_009`];
    if (val && typeof val === 'string' && val.length >= 7) return val;
  }
  return null;
}

async function backfillPhones() {
  const leads = await all("SELECT id, name, business_name, phone, assessment_data, assessment_id FROM leads WHERE phone IS NULL OR phone = ''");
  console.log(`Found ${leads.length} leads without phone number`);

  let updated = 0;
  let errors = 0;

  for (const lead of leads) {
    try {
      let phone = null;

      if (lead.assessment_data) {
        const ad = typeof lead.assessment_data === 'string' ? JSON.parse(lead.assessment_data) : lead.assessment_data;
        phone = getPhoneFromAnswers(ad.answers);
      }

      if (!phone && lead.assessment_id) {
        const a = await get('SELECT answers FROM assessments WHERE id = ?', [lead.assessment_id]);
        if (a && a.answers) {
          const answers = typeof a.answers === 'string' ? JSON.parse(a.answers) : a.answers;
          phone = getPhoneFromAnswers(answers);
        }
      }

      if (phone) {
        phone = phone.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) phone = '234' + phone.slice(1);
        if (!phone.startsWith('234')) phone = '234' + phone;
        await run('UPDATE leads SET phone = ? WHERE id = ?', [phone, lead.id]);
        console.log(`  ✓ Lead #${lead.id} (${lead.name || lead.business_name}): phone set to ${phone}`);
        updated++;
      } else {
        console.log(`  ✗ Lead #${lead.id} (${lead.name || lead.business_name}): no phone found in assessment`);
      }
    } catch (err) {
      console.error(`  ✗ Lead #${lead.id} (${lead.name || lead.business_name}): error - ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone. ${updated} leads updated, ${errors} errors, ${leads.length - updated - errors} skipped`);
  process.exit(0);
}

backfillPhones().catch(err => { console.error(err); process.exit(1); });
