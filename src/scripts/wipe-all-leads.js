const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { db, run } = require('../config/database');

const TABLES_IN_ORDER = [
  'renewals',
  'conversation_messages',
  'assessment_sessions',
  'rating_quotes',
  'opportunities',
  'reports',
  'tasks',
  'activities',
  'proposals',
  'policies',
  'notifications',
  'leads',
  'assessments'
];

async function wipe() {
  console.log('Wiping all lead-related data...\n');
  for (const table of TABLES_IN_ORDER) {
    try {
      const result = await run(`DELETE FROM ${table}`);
      console.log(`  ✓ ${table} cleared`);
    } catch (err) {
      console.log(`  - ${table}: ${err.message}`);
    }
  }
  console.log('\nDone. All leads, assessments, and related data deleted.');
  process.exit(0);
}

wipe().catch(err => { console.error(err); process.exit(1); });
