// Seed runner for journey definitions
const { pool } = require('./schemas');
const { journeys } = require('../knowledge/journeys/qp-100');
const journeyEngine = require('../services/journey-engine/src/index');

async function seedJourneys() {
  console.log('[seed] Seeding journey definitions...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await journeyEngine.seedJourneys(journeys);
    await client.query('COMMIT');
    console.log(`[seed] ✓ ${journeys.length} journeys seeded`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] ✗', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedJourneys();
