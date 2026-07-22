const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('docker exec gen-runner sh -c "ffprobe -v error -show_entries stream=codec_name,codec_type /app/data/videos/lesson_5*.mp4 2>&1 | grep -c STREAM" 2>&1; echo "=== files ==="; ls /root/CoverScoreAI/data/videos/lesson_*.mp4 2>/dev/null | wc -l; echo "=== gen running? ==="; docker ps --filter name=gen-runner --format "{{.Names}} {{.Status}}" 2>&1', (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = '';
    s.on('data', d => o += d.toString());
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
