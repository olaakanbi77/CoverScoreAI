const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `docker exec coverscore-ai node -e "
const s=require('sqlite3');
const d=new s.Database('./data/coverscore.db');

d.all('SELECT id,title,content IS NOT NULL as has_content,quiz_data IS NOT NULL as has_quiz,course_id FROM academy_modules WHERE id>=50 ORDER BY id', (e,rows) => {
  if (e) { console.log('ERROR:', e.message); return; }
  console.log('Found', rows.length, 'modules');
  console.log('First:', JSON.stringify(rows[0]));
  console.log('Last:', JSON.stringify(rows[rows.length-1]));
  const hasContent = rows.filter(r => r.has_content).length;
  const hasQuiz = rows.filter(r => r.has_quiz).length;
  console.log('With content:', hasContent, 'With quiz:', hasQuiz);
});

d.all('SELECT id, title, video_url FROM academy_modules WHERE video_url IS NOT NULL AND video_url!=\"\" LIMIT 5', (e,rows) => {
  if (e) { console.log('VIDEO ERROR:', e.message); return; }
  console.log('Videos generated:', rows.length);
  if (rows.length) console.log('Sample:', JSON.stringify(rows[0]));
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
