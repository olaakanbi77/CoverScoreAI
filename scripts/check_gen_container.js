const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('docker ps --filter name=gen-runner --format "{{.Names}} {{.Status}}" 2>&1; echo "==="; ls /root/CoverScoreAI/data/videos/slide_50.png 2>&1; echo "==="; ls /root/CoverScoreAI/data/videos/audio_50.mp3 2>&1', (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = '';
    s.on('data', d => o += d.toString());
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
