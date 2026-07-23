const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmds = [
    'cd /root/CoverScoreAI',
    'git pull',
    'echo "=== ADD COLUMN ==="',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "ALTER TABLE academy_modules ADD COLUMN scene_data TEXT;" 2>&1',
    'echo "=== BUILD SCENE DATA ==="',
    'node scripts/build_scene_data.js 2>&1',
    'echo "=== CLEAR VIDEOS ==="',
    'rm -f /root/CoverScoreAI/data/videos/lesson_*.mp4 /root/CoverScoreAI/data/videos/audio_*.mp3 /root/CoverScoreAI/data/videos/slide_*.png /root/CoverScoreAI/data/videos/frame_*.mp4 /root/CoverScoreAI/data/videos/clip_*.mp4',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "UPDATE academy_modules SET video_url = NULL WHERE id >= 50;"',
    'echo "=== BUILD IMAGE ==="',
    'docker compose build app 2>&1 | tail -3',
    'echo "=== START GEN ==="',
    'docker compose run -d --name gen-runner --rm app sh -c "node scripts/generate_lesson_videos.js > /app/data/videos/gen.log 2>&1"',
    'echo "=== DONE ==="',
    'sleep 15',
    'tail -6 /root/CoverScoreAI/data/videos/gen.log'
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
