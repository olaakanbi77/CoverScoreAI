const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('echo "Waiting for health..."; for i in $(seq 1 30); do status=$(docker ps --filter name=coverscore-ai --format "{{.Status}}" 2>&1); echo "$i: $status"; if echo "$status" | grep -q "healthy"; then echo "HEALTHY"; break; fi; sleep 3; done; echo ===; docker exec -d coverscore-ai sh -c "node scripts/generate_lesson_videos.js > /app/data/videos/gen.log 2>&1"; echo "Gen started"; echo ===; sleep 10; docker exec coverscore-ai tail -20 /app/data/videos/gen.log 2>&1', (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = '';
    s.on('data', d => o += d.toString());
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
