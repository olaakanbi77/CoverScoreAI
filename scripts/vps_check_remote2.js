const { Client } = require('ssh2');
const conn = new Client();

const script = [
  'cat << "EOF" > /tmp/check_db.js',
  'const s=require("sqlite3");',
  'const d=new s.Database("./data/coverscore.db");',
  'd.all("SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name",(e,rows)=>{if(e){console.log(e.message);return;}console.log("Tables:",rows.map(r=>r.name).join(", "));});',
  'd.all("SELECT COUNT(*) as cnt FROM academy_modules",(e,row)=>{if(e){console.log(e.message);return;}console.log("Modules:",row.cnt);});',
  'd.all("SELECT id,title,course_id FROM academy_modules LIMIT 5",(e,rows)=>{if(e){console.log(e.message);return;}console.log("First:",JSON.stringify(rows));});',
  'd.all("PRAGMA table_info(academy_modules)",(e,rows)=>{if(e){console.log(e.message);return;}console.log("Cols:",rows.map(r=>r.name).join(", "));});',
  'd.all("SELECT id,name FROM academy_courses",(e,rows)=>{if(e){console.log(e.message);return;}console.log("Courses:",JSON.stringify(rows));});',
  'd.all("SELECT id,title,content IS NOT NULL as hc,quiz_data IS NOT NULL as hq FROM academy_modules WHERE course_id IS NOT NULL ORDER BY course_id,lesson_number LIMIT 3",(e,rows)=>{if(e){console.log(e.message);return;}console.log("CCA:",JSON.stringify(rows));});',
  'setTimeout(()=>d.close(),300);',
  'EOF',
  'cat /tmp/check_db.js | docker exec -i coverscore-ai node'
].join('\n');

conn.on('ready', () => {
  conn.exec(script, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
});
conn.on('error', e => console.error(e.message));
conn.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
