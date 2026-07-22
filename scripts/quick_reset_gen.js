const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('docker rm -f gen-runner 2>/dev/null; cd /root/CoverScoreAI && rm -f /root/CoverScoreAI/data/videos/lesson_*.mp4 /root/CoverScoreAI/data/videos/audio_*.mp3 /root/CoverScoreAI/data/videos/slide_*.png /root/CoverScoreAI/data/videos/gen.log && sqlite3 /root/CoverScoreAI/data/coverscore.db "UPDATE academy_modules SET video_url = NULL WHERE id >= 50;" && echo "=== CLEARED ===" && docker compose run -d --name gen-runner --rm app sh -c "node scripts/generate_lesson_videos.js > /app/data/videos/gen.log 2>&1" && echo "=== GEN STARTED ==="', (e, s) => {
    if (e) { console.error(e); c.end(); return; }
    s.on('data', d => process.stdout.write(d.toString()));
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => c.end());
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
