const { Client } = require('ssh2');
const conn = new Client();

const SCRIPT = `
const s=require('sqlite3');
const d=new s.Database('./data/coverscore.db');
d.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (e,rows) => {
  if (e) { console.log('ERR1:', e.message); return; }
  console.log('Tables:', rows.map(r=>r.name).join(', '));
});
d.all('SELECT COUNT(*) as cnt FROM academy_modules', (e,row) => {
  if (e) { console.log('ERR2:', e.message); return; }
  console.log('Total modules:', row.cnt);
});
d.all('SELECT id, title, course_id FROM academy_modules LIMIT 5', (e,rows) => {
  if (e) { console.log('ERR3:', e.message); return; }
  console.log('First modules:', JSON.stringify(rows));
});
d.all('PRAGMA table_info(academy_modules)', (e,rows) => {
  if (e) { console.log('ERR4:', e.message); return; }
  console.log('Columns:', rows.map(r=>r.name).join(', '));
});
d.all('SELECT id, name FROM academy_courses', (e,rows) => {
  if (e) { console.log('ERR5:', e.message); return; }
  console.log('Courses:', JSON.stringify(rows));
});
d.all('SELECT id, title, content IS NOT NULL as hc, quiz_data IS NOT NULL as hq FROM academy_modules WHERE course_id IS NOT NULL ORDER BY course_id, lesson_number LIMIT 3', (e,rows) => {
  if (e) { console.log('ERR6:', e.message); return; }
  console.log('CCA modules:', JSON.stringify(rows));
});
setTimeout(() => d.close(), 300);
`;

conn.on('ready', () => {
  const b64 = Buffer.from(SCRIPT).toString('base64');
  conn.exec(`echo '${b64}' | base64 -d | docker exec -i coverscore-ai node`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
});
conn.on('error', e => console.error(e.message));
conn.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
