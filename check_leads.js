const { all, get } = require('./src/config/database');
(async () => {
  const schema = await all("SELECT sql FROM sqlite_master WHERE type='table' AND name='leads'");
  console.log('SCHEMA:', schema[0]?.sql);

  const indexes = await all("SELECT * FROM sqlite_master WHERE type='index' AND tbl_name='leads'");
  console.log('\nINDEXES:');
  indexes.forEach(i => console.log(' ', i.sql));

  const count = await get('SELECT COUNT(*) as cnt FROM leads');
  console.log('\nTotal leads:', count.cnt);

  const leads = await all('SELECT id, name, business_name, phone, assessment_id FROM leads ORDER BY id');
  console.log('\nLEADS:');
  leads.forEach(l => console.log('  #' + l.id, l.name || l.business_name || '(no name)', 'phone:', l.phone, 'assessment_id:', l.assessment_id));

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
