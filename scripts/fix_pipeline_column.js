const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmds = [
    'cd /root/CoverScoreAI',
    'docker compose stop app',
    'sleep 2',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "ALTER TABLE leads ADD COLUMN pipeline_stage INTEGER DEFAULT 1;" 2>&1',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "PRAGMA table_info(leads);" 2>&1 | grep pipeline',
    'docker compose up -d app',
    'echo "=== APP RESTARTED ==="'
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
