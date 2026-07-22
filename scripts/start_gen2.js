const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('docker rm -f gen-runner 2>&1; cd /root/CoverScoreAI && docker compose run -d --name gen-runner --rm app sh -c "node scripts/generate_lesson_videos.js > /app/data/videos/gen.log 2>&1" && echo "=== GEN STARTED ==="', (e, s) => {
    if (e) { console.error(e); c.end(); return; }
    let o = '';
    s.on('data', d => o += d.toString());
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
