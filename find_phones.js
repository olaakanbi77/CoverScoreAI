const { all } = require('./src/config/database');
(async () => {
  const tables = await all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('Tables:', tables.map(x => x.name).join(', '));

  // Check each table for columns that might store WhatsApp phone
  for (const t of tables) {
    const cols = await all("PRAGMA table_info(" + t.name + ")");
    const phoneCols = cols.filter(c => c.name.toLowerCase().includes('phone') || c.name.toLowerCase().includes('jid') || c.name.toLowerCase().includes('remote') || c.name.toLowerCase().includes('wa_') || c.name.toLowerCase().includes('whatsapp'));
    if (phoneCols.length) {
      console.log('\n' + t.name + ' has relevant columns:', phoneCols.map(c => c.name + ' (' + c.type + ')').join(', '));
      const sample = await all("SELECT " + phoneCols.map(c => c.name).join(',') + " FROM " + t.name + " LIMIT 1");
      if (sample.length) console.log('  sample:', JSON.stringify(sample[0]));
    }
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
