/**
 * Check DB schema for course 8 areas
 */
const { Client } = require('ssh2');
const conn = new Client();
const VPS_HOST = '163.245.210.111', VPS_USER = 'root', VPS_PASS = 'RUlTzXC1Onrmw';

conn.on('ready', () => {
  const cmd = `
echo "=== Tables ==="
docker exec coverscore-ai node -e "
const s=require('sqlite3'),d=new s.Database('./data/coverscore.db');
d.all(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\",[],(e,rows)=>{
  console.log('Tables:',rows.map(r=>r.name).join(', '));
  d.close();
});
"
echo "=== Modules for course_id=8 ==="
docker exec coverscore-ai node -e "
const s=require('sqlite3'),d=new s.Database('./data/coverscore.db');
d.all('SELECT id,lesson_number,title FROM academy_modules WHERE course_id=8 ORDER BY lesson_number',[],(e,rows)=>{
  rows.forEach(r=>console.log('M'+r.id+' L'+r.lesson_number+': '+r.title));
  d.close();
});
"
echo "=== Module 111 check ==="
docker exec coverscore-ai node -e "
const s=require('sqlite3'),d=new s.Database('./data/coverscore.db');
d.get('SELECT id,lesson_number,title FROM academy_modules WHERE id=111',[],(e,r)=>{
  console.log(r?JSON.stringify(r):'NOT FOUND');
  d.close();
});
"
echo "=== Check video gen criteria ==="
docker exec coverscore-ai node -e "
const s=require('sqlite3'),d=new s.Database('./data/coverscore.db');
d.all('SELECT id,lesson_number,content,video_script,scene_data,video_url,video_status FROM academy_modules WHERE course_id=8 AND lesson_number=5',[],(e,rows)=>{
  console.log('L5 fields:',JSON.stringify(rows[0],null,2));
  d.close();
});
"
`;
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('exec error:', err.message); conn.end(); return; }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => { console.log('Exit:', code); conn.end(); });
  });
});

conn.on('error', e => console.error('SSH error:', e.message));
conn.connect({ host: VPS_HOST, username: VPS_USER, password: VPS_PASS });
