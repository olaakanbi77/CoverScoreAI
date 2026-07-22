const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('docker ps -a --filter name=coverscore-ai --format "{{.Names}} {{.Status}} {{.ExitedAt}}" 2>&1; echo ===; docker logs coverscore-ai --tail 30 2>&1', (e, s) => {
    if (e) { console.error(e); c.end(); return; }
    s.on('data', d => process.stdout.write(d.toString()));
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => c.end());
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
