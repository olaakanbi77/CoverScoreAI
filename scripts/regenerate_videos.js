const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmds = [
    'cd /root/CoverScoreAI',
    'git pull',
    'echo "=== STOP APP & CLEAR OLD VIDEOS ==="',
    'docker compose stop app',
    'rm -f /root/CoverScoreAI/data/videos/lesson_*.mp4',
    'rm -f /root/CoverScoreAI/data/videos/audio_*.mp3',
    'rm -f /root/CoverScoreAI/data/videos/slide_*.png',
    'rm -f /root/CoverScoreAI/data/videos/gen.log',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "UPDATE academy_modules SET video_url = NULL WHERE id >= 50;"',
    'echo "=== BUILD ==="',
    'docker compose build app 2>&1',
    'echo "=== START GEN (DETACHED) ==="',
    'docker compose run -d --name gen-runner --rm app sh -c "node scripts/generate_lesson_videos.js > /app/data/videos/gen.log 2>&1"',
    'echo "=== GEN STARTED, WAITING 30s ==="',
    'sleep 30',
    'echo "=== CHECK ==="',
    'tail -15 /root/CoverScoreAI/data/videos/gen.log',
    'echo "==="',
    'ls /root/CoverScoreAI/data/videos/lesson_*.mp4 2>/dev/null | wc -l'
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
