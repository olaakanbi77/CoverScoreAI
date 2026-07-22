const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('docker-compose -f /root/CoverScoreAI/docker-compose.yml ps 2>&1; echo ===; docker-compose -f /root/CoverScoreAI/docker-compose.yml logs --tail 50 coverscore-ai 2>&1', (e, s) => {
    if (e) { console.error(e); c.end(); return; }
    s.on('data', d => process.stdout.write(d.toString()));
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => c.end());
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
