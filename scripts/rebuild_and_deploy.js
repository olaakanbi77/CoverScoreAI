const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('kill $(ps aux | grep ffmpeg | grep -v grep | awk "{print \$2}") 2>&1; kill 3235479 2>&1; echo "Killed old processes"; sleep 2; cd /root/CoverScoreAI && git pull 2>&1; echo ===; docker compose -f docker-compose.yml build app 2>&1; echo ===; docker compose -f docker-compose.yml up -d app 2>&1', (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = '';
    s.on('data', d => o += d.toString());
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
