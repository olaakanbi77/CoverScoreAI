const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('docker ps --filter name=coverscore-ai --format "{{.Names}} {{.Status}} {{.Image}}" 2>&1; echo ===; docker images coverscoreai-app:latest --format "{{.CreatedAt}}" 2>&1; echo ===; ls -la /root/CoverScoreAI/data/videos/lesson_*.mp4 2>/dev/null | wc -l', (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = '';
    s.on('data', d => o += d.toString());
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
