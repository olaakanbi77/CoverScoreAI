const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmds = [
    'echo "=== STOP APP ==="',
    'cd /root/CoverScoreAI && docker compose stop app',
    'echo "=== START GEN (DETACHED) ==="',
    'docker compose run -d --name gen-runner --rm app sh -c "node scripts/generate_lesson_videos.js > /app/data/videos/gen.log 2>&1"',
    'echo "=== WAIT 15s ==="',
    'sleep 15',
    'echo "=== CHECK GEN ==="',
    'tail -20 /app/data/videos/gen.log',
    'echo "=== CONTAINERS ==="',
    'docker ps --format "{{.Names}} {{.Status}}"'
  ].join('; ');
  c.exec(cmds, (e, s) => {
    if (e) { console.error(e); c.end(); return; }
    s.on('data', d => process.stdout.write(d.toString()));
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => c.end());
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
