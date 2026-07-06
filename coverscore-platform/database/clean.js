// Clean — wipes all runtime/test data while preserving seed definitions
// Keeps: question_packs, pack_sections, questions, question_options, branch_rules,
//         journey_definitions, journey_steps
// Removes: customers, sessions, answers, states, scores, reports, events, customer_journeys, progress

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'coverscore',
  user: process.env.PG_USER || 'coverscore',
  password: process.env.PG_PASSWORD || ''
});

const RUNTIME_TABLES = [
  'journey_progress',
  'customer_journeys',
  'events',
  'reports',
  'risk_scores',
  'answers',
  'conversation_states',
  'conversation_sessions',
  'customers'
];

async function clean() {
  const client = await pool.connect();
  try {
    console.log('[clean] Wiping runtime data...');

    // Disable triggers temporarily to handle FKs cleanly
    await client.query('SET session_replication_role = replica');

    for (const table of RUNTIME_TABLES) {
      await client.query(`DELETE FROM ${table}`);
      console.log(`  ✓ ${table} cleared`);
    }

    await client.query('SET session_replication_role = DEFAULT');
    console.log('[clean] All runtime data wiped — seed definitions preserved');
    console.log('[clean] Run `node database/seed.js` to re-seed if needed');
  } catch (err) {
    await client.query('SET session_replication_role = DEFAULT');
    console.error('[clean] ✗', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

clean();
