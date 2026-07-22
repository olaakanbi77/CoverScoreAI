const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('cd /root/CoverScoreAI && git pull && docker compose stop app && rm -f /root/CoverScoreAI/data/videos/lesson_*.mp4 /root/CoverScoreAI/data/videos/audio_*.mp3 /root/CoverScoreAI/data/videos/slide_*.png /root/CoverScoreAI/data/videos/gen.log && sqlite3 /root/CoverScoreAI/data/coverscore.db "UPDATE academy_modules SET video_url = NULL WHERE id >= 50;" && echo "=== CLEARED ==="', (e, s) => {
    if (e) { console.error(e); c.end(); return; }
    let o = '';
    s.on('data', d => o += d.toString());
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
