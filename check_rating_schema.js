const { all } = require('./src/config/database');
(async () => {
  const s = await all("SELECT sql FROM sqlite_master WHERE type='table' AND name='rating_products'");
  console.log('SCHEMA:', s[0]?.sql);

  const cols = await all("PRAGMA table_info(rating_products)");
  console.log('Columns:', cols.map(x => x.name + ' ' + x.type).join(', '));

  const p = await all('SELECT * FROM rating_products ORDER BY name');
  console.log('\nExisting products:');
  p.forEach(x => console.log('  ' + x.code + ' "' + x.name + '" cat=' + x.category + ' schema=' + (x.input_schema ? x.input_schema.substring(0, 60) : 'none')));

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
