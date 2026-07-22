const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmds = [
    'echo "=== GIT PULL ==="',
    'cd /root/CoverScoreAI && git pull',
    'echo "=== BUILD ==="',
    'cd /root/CoverScoreAI && docker compose build app 2>&1',
    'echo "=== RESTART ==="',
    'cd /root/CoverScoreAI && docker compose up -d app 2>&1',
    'echo "=== DONE ==="'
  ].join('; ');
  c.exec(cmds, (e, s) => {
    if (e) { console.error(e); c.end(); return; }
    s.on('data', d => process.stdout.write(d.toString()));
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => c.end());
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
