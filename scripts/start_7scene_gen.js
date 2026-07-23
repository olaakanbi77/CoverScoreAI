const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmds = [
    'cd /root/CoverScoreAI',
    'docker rm -f gen-runner 2>/dev/null',
    'rm -f /root/CoverScoreAI/data/videos/lesson_*.mp4 /root/CoverScoreAI/data/videos/audio_*.mp3 /root/CoverScoreAI/data/videos/slide_*.png /root/CoverScoreAI/data/videos/frame_*.mp4 /root/CoverScoreAI/data/videos/clip_*.mp4',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "UPDATE academy_modules SET video_url = NULL WHERE id >= 50;"',
    'docker compose run -d --name gen-runner --rm app sh -c "node scripts/generate_lesson_videos.js > /app/data/videos/gen.log 2>&1"',
    'echo "=== STARTED ==="',
    'sleep 20',
    'tail -8 /root/CoverScoreAI/data/videos/gen.log'
  ].join('; ');
  c.exec(cmds, (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = ''; s.on('data', d => o += d);
    s.stderr.on('data', d => o += d);
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error('SSH ERROR:', e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
