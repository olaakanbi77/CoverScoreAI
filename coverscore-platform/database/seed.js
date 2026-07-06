const { pool } = require('./schemas');
const qp100 = require('../knowledge/questions/qp-100');
const templateMerger = require('../services/assessment-runtime/loaders/template-merger');
const { journeys } = require('../knowledge/journeys/qp-100');
const journeyEngine = require('../services/journey-engine/src/index');

async function seed() {
  console.log('[seed] Seeding QP-100 question pack (QPRE format)...');

  let merged;
  if (qp100.pack.master_template) {
    console.log(`[seed] Merging with master template '${qp100.pack.master_template}'...`);
    merged = templateMerger.merge(qp100);
    console.log(`[seed] ✓ Merged: ${merged.sections.length} sections, ${merged.questions.length} questions`);
  } else {
    merged = qp100;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO question_packs (id, code, name, description, version, status, pillars, categories, modifiers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         code = EXCLUDED.code, name = EXCLUDED.name, description = EXCLUDED.description,
         version = EXCLUDED.version, status = EXCLUDED.status,
         pillars = EXCLUDED.pillars, categories = EXCLUDED.categories,
         modifiers = EXCLUDED.modifiers, updated_at = now()`,
      [
        merged.pack.id, merged.pack.code, merged.pack.name, merged.pack.description,
        merged.pack.version, merged.pack.status,
        JSON.stringify(merged.pack.pillars),
        JSON.stringify(merged.pack.categories),
        JSON.stringify(merged.pack.modifiers)
      ]
    );
    console.log(`[seed] ✓ Pack ${merged.pack.id}`);

    for (const s of merged.sections) {
      await client.query(
        `INSERT INTO pack_sections (id, pack_id, name, description, sort_order, entry_question)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, sort_order = EXCLUDED.sort_order`,
        [s.id, merged.pack.id, s.name, s.description || null, s.sort_order, s.entry_question]
      );
    }
    console.log(`[seed] ✓ ${merged.sections.length} sections`);

    let optCount = 0;
    for (const q of merged.questions) {
      await client.query(
        `INSERT INTO questions (id, pack_id, section_id, sequence, question_type, text, category, pillar, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           text = EXCLUDED.text, sequence = EXCLUDED.sequence,
           question_type = EXCLUDED.question_type, section_id = EXCLUDED.section_id`,
        [
          q.id, merged.pack.id, q.section_id, q.sequence,
          q.question_type || 'choice', q.text,
          q.category, q.pillar,
          JSON.stringify({ gap: q.gap || {} })
        ]
      );

      for (const o of q.options) {
        await client.query(
          `INSERT INTO question_options (question_id, text, value, score, sort_order, next_question)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [q.id, o.text, o.value, o.score, o.sort_order, o.next_question || null]
        );
        optCount++;
      }
    }
    console.log(`[seed] ✓ ${merged.questions.length} questions, ${optCount} options`);

    await client.query('COMMIT');

    await journeyEngine.seedJourneys(journeys);
    console.log(`[seed] ✓ ${journeys.length} journeys seeded`);

    console.log('[seed] ✓ QP-100 seed complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] ✗', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
