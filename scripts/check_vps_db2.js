const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `docker exec coverscore-ai node -e "
const s=require('sqlite3');
const d=new s.Database('./data/coverscore.db');
d.all('SELECT id, title, course_id FROM academy_modules ORDER BY id LIMIT 5', (e,rows) => {
  if (e) { console.log('QUERY 1 ERROR:', e.message); return; }
  console.log('First 5 modules:', JSON.stringify(rows));
});
d.all('SELECT COUNT(*) as cnt FROM academy_modules', (e,row) => {
  if (e) { console.log('COUNT ERROR:', e.message); return; }
  console.log('Total modules:', row.cnt);
});
d.all('SELECT sql FROM sqlite_master WHERE name=\"academy_modules\"', (e,rows) => {
  if (e) { console.log('SCHEMA ERROR:', e.message); return; }
  console.log('Schema:', rows[0].sql);
});
setTimeout(() => d.close(), 500);
"`;
  conn.exec(cmd, (err, s) => {
    if (err) { console.error(err); conn.end(); return; }
    s.on('data', d => process.stdout.write(d.toString()));
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => conn.end());
  });
});
conn.on('error', e => console.error(e.message));
conn.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
