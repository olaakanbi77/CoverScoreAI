const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('docker ps --filter name=coverscore-ai --format "{{.Names}} {{.Status}}" 2>&1; echo "==="; docker exec coverscore-ai wc -l /app/data/videos/gen.log 2>&1; echo "==="; docker exec coverscore-ai tail -5 /app/data/videos/gen.log 2>&1; echo "==="; ls /root/CoverScoreAI/data/videos/lesson_*.mp4 2>/dev/null | wc -l; echo "==="; sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT COUNT(*) FROM academy_modules WHERE video_url IS NOT NULL AND id >= 50" 2>&1', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let out = '';
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
});
conn.on('error', e => console.error(e.message));
conn.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });