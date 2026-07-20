const { Client } = require('ssh2');
const conn = new Client();

const VPS_HOST = '163.245.210.111';
const VPS_USER = 'root';
const VPS_PASS = 'RUlTzXC1Onrmw';

conn.on('ready', () => {
  console.log('SSH connected');
  const cmd = [
    'echo "=== Pulling latest code ==="',
    'cd /root/CoverScoreAI && git stash --include-untracked 2>&1',
    'cd /root/CoverScoreAI && git pull origin main 2>&1',
    'cd /root/CoverScoreAI && git stash drop 2>/dev/null; true',
    'echo "=== Installing dependencies ==="',
    'cd /root/CoverScoreAI && npm ci 2>&1',
    'echo "=== Rebuilding Docker containers ==="',
    'cd /root/CoverScoreAI && docker compose down --remove-orphans 2>&1',
    'docker rm -f coverscore-ai coverscore_postgres 2>/dev/null; true',
    'cd /root/CoverScoreAI && docker compose up -d --build --force-recreate 2>&1',
    'echo "=== Waiting for container to be healthy ==="',
    'sleep 8',
    'docker inspect --format="{{.State.Health.Status}}" coverscore-ai 2>&1',
    'echo "=== Populating lesson content ==="',
    'docker exec coverscore-ai node scripts/populate_cca_content.js 2>&1',
    'echo "=== Generating lesson videos ==="',
    'docker exec coverscore-ai node scripts/generate_lesson_videos.js 2>&1',
    'echo "=== Deploy complete ==="'
  ].join(' && ');

  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('exec error:', err.message); conn.end(); return; }
    stream.on('close', (code) => { console.log('Done (exit:', code, ')'); conn.end(); });
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.on('error', (err) => console.error('SSH error:', err.message));
conn.connect({ host: VPS_HOST, username: VPS_USER, password: VPS_PASS });
