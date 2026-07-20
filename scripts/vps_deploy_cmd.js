const { Client } = require('ssh2');
const conn = new Client();
const VPS_HOST = '163.245.210.111', VPS_USER = 'root', VPS_PASS = 'RUlTzXC1Onrmw';

const CMD = `
echo "=== Waiting for container health ==="
for i in $(seq 1 10); do
  h=$(docker inspect --format="{{.State.Health.Status}}" coverscore-ai 2>/dev/null)
  if [ "$h" = "healthy" ]; then echo "Container healthy!"; break; fi
  echo "Waiting... $h"; sleep 4;
done
echo "=== Populating lesson content ==="
docker exec coverscore-ai node scripts/populate_cca_content.js 2>&1
echo "=== Generating lesson videos ==="
docker exec coverscore-ai node scripts/generate_lesson_videos.js 2>&1
echo "=== Checking DB state ==="
docker exec coverscore-ai sh -c "node -e 'const s=require(\"sqlite3\");const d=new s.Database(\"./data/coverscore.db\");d.all(\"SELECT COUNT(*) as t,SUM(CASE WHEN content IS NOT NULL THEN 1 ELSE 0 END) as c,SUM(CASE WHEN quiz_data IS NOT NULL THEN 1 ELSE 0 END) as q,SUM(CASE WHEN video_script IS NOT NULL THEN 1 ELSE 0 END) as v,SUM(CASE WHEN workbook_content IS NOT NULL THEN 1 ELSE 0 END) as w,SUM(CASE WHEN case_study IS NOT NULL THEN 1 ELSE 0 END) as cs,SUM(CASE WHEN resources IS NOT NULL THEN 1 ELSE 0 END) as r FROM academy_modules WHERE id>=50\",(e,row)=>console.log(JSON.stringify(row)));d.close();'"
echo "=== Deploy Complete ==="
`;

conn.on('ready', () => {
  console.log('SSH connected');
  conn.exec(CMD, (err, stream) => {
    if (err) { console.error('exec error:', err.message); conn.end(); return; }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', (code) => { console.log('Exit code:', code); conn.end(); });
  });
});
conn.on('error', e => console.error('SSH error:', e.message));
conn.connect({ host: VPS_HOST, username: VPS_USER, password: VPS_PASS });

