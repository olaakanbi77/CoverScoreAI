const { all } = require('./src/config/database');
(async () => {
  const schemas = await all("SELECT sql FROM sqlite_master WHERE type='table' AND name='leads'");
  console.log(schemas[0]?.sql || 'NOT FOUND');
  
  const allLeads = await all("SELECT id, name, phone, status, entity_type, business_name, assessment_id, updated_at FROM leads ORDER BY id");
  console.log('\nALL LEADS:');
  allLeads.forEach(l => console.log(JSON.stringify(l)));
  
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
