const { all } = require('./src/config/database');
(async () => {
  const assessments = await all("SELECT id, COALESCE(score, -1) as score, answers, created_at FROM assessments ORDER BY id");
  console.log('=== ASSESSMENTS ===');
  console.log('Total:', assessments.length);
  assessments.forEach(a => {
    let answers = {};
    try { answers = JSON.parse(a.answers || '{}'); } catch(e) {}
    const keys = Object.keys(answers);
    console.log(`  #${a.id} score=${a.score} keys=${keys.length} ${keys.slice(0,3).join(',')}`);
  });

  const leads = await all("SELECT l.*, a.answers as a_answers FROM leads l LEFT JOIN assessments a ON l.assessment_id = a.id ORDER BY l.id");
  console.log('\n=== LEADS ===');
  console.log('Total:', leads.length);
  leads.forEach(l => {
    console.log(`  #${l.id} name="${l.name}" phone="${l.phone}" assessment_id=${l.assessment_id} status="${l.status}"`);
  });

  const orphaned = await all("SELECT id FROM assessments WHERE id NOT IN (SELECT assessment_id FROM leads WHERE assessment_id IS NOT NULL)");
  console.log('\n=== ORPHANED ASSESSMENTS (no lead) ===');
  console.log(orphaned.length ? orphaned.map(a => `  Assessment #${a.id}`).join('\n') : '  None');

  const leadless = await all("SELECT a.*, l.id as lead_id FROM assessments a LEFT JOIN leads l ON l.assessment_id = a.id WHERE l.id IS NULL");
  console.log('\n=== ASSESSMENTS WITHOUT LEADS ===');
  console.log(leadless.length ? leadless.map(a => `  Assessment #${a.id}`).join('\n') : '  None');

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
