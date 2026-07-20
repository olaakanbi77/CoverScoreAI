const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `docker exec coverscore-ai node -e "
const s=require('sqlite3');
const d=new s.Database('./data/coverscore.db');
d.all(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\", (e,rows) => {
  if (e) { console.log('TABLES ERROR:', e.message); return; }
  console.log('Tables:', rows.map(r=>r.name).join(', '));
});
d.all('PRAGMA table_info(academy_modules)', (e,rows) => {
  if (e) { console.log('PRAGMA ERROR:', e.message); return; }
  console.log('Module columns:', rows.map(r=>r.name).join(', '));
});
d.all('PRAGMA table_info(academy_courses)', (e,rows) => {
  if (e) { console.log('PRAGMA COURSES ERROR:', e.message); return; }
  console.log('Course columns:', rows.map(r=>r.name).join(', '));
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
