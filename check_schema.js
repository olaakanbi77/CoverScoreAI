const { all } = require('./src/config/database');
(async () => {
  const triggers = await all("SELECT * FROM sqlite_master WHERE type='trigger' AND tbl_name='leads'");
  console.log('TRIGGERS:', triggers.length);
  triggers.forEach(t => console.log(t.sql));
  const indexes = await all("SELECT * FROM sqlite_master WHERE type='index' AND tbl_name='leads'");
  console.log('\nINDEXES:');
  indexes.forEach(i => console.log(i.sql));
  const pragma = await all('PRAGMA foreign_key_list(leads)');
  console.log('\nFOREIGN KEYS:');
  pragma.forEach(fk => console.log(fk));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
