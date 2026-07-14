const { db } = require('../config/database');

const dbModule = { all: null, get: null, run: null };

async function initDb() {
  const m = require('../config/database');
  dbModule.all = m.all;
  dbModule.get = m.get;
  dbModule.run = m.run;
}

async function processFollowUps() {
  if (!dbModule.all) await initDb();
  const { all, get, run } = dbModule;

  console.log('[FollowUp Scheduler] Checking for due follow-ups...');

  const leads = await all(
    `SELECT id, name, business_name, assessment_data, advisor_id, status
     FROM leads
     WHERE assessment_data IS NOT NULL
     AND assessment_data != ''
     ORDER BY updated_at DESC`
  );

  let actions = 0;

  for (const lead of leads) {
    try {
      const ad = typeof lead.assessment_data === 'string'
        ? JSON.parse(lead.assessment_data)
        : lead.assessment_data;

      const followUp = ad?.rie?.followUp;
      const metadata = ad?.rie?.rieMetadata;
      if (!followUp || !metadata?.scoredAt) continue;

      if (followUp.dispatchedAt) continue;

      const scoredAt = new Date(metadata.scoredAt).getTime();
      const dueMs = (followUp.timing || 24) * 60 * 60 * 1000;
      const now = Date.now();

      if (now < scoredAt + dueMs) continue;

      const name = lead.business_name || lead.name || 'Client';
      const channel = (followUp.channel || 'email').charAt(0).toUpperCase() + (followUp.channel || 'email').slice(1);

      if (followUp.tasks && followUp.tasks.length > 0) {
        for (const task of followUp.tasks) {
          const dueDate = new Date(Date.now() + (task.dueBy || 24) * 60 * 60 * 1000).toISOString();
          await run(
            `INSERT INTO tasks (lead_id, title, type, status, due_date, created_at)
             VALUES (?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
            [lead.id, task.action, followUp.channel || 'call', dueDate]
          );
        }
      } else {
        const defaultTitle = `${channel} follow-up with ${name}: ${followUp.nextAction || 'Contact lead'}`;
        const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await run(
          `INSERT INTO tasks (lead_id, title, type, status, due_date, created_at)
           VALUES (?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
          [lead.id, defaultTitle, followUp.channel || 'call', dueDate]
        );
      }

      await run(
        `INSERT INTO activities (lead_id, title, description, type, created_at)
         VALUES (?, ?, ?, 'system', CURRENT_TIMESTAMP)`,
        [lead.id,
         `Follow-up scheduled: ${followUp.nextAction || 'Contact lead'}`,
         `Priority: ${followUp.priority || 'medium'} | Channel: ${followUp.channel || 'email'} | Timing: ${followUp.timing || 24}h`]
      );

      if (followUp.priority === 'high' && lead.status === 'New Lead') {
        await run('UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['Follow-up Scheduled', lead.id]);
      }

      followUp.dispatchedAt = new Date().toISOString();
      ad.rie.followUp = followUp;
      await run('UPDATE leads SET assessment_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(ad), lead.id]);

      console.log(`   [FollowUp] Dispatched for lead ${lead.id} (${name}) — ${followUp.nextAction}`);
      actions++;
    } catch (e) {
      console.error(`   [FollowUp] Error processing lead ${lead.id}: ${e.message}`);
    }
  }

  console.log(`[FollowUp Scheduler] ${actions} follow-ups dispatched`);
  return actions;
}

module.exports = { processFollowUps };
