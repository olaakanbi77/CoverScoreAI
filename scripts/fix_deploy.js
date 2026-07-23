const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmds = [
    'cd /root/CoverScoreAI',
    'echo "=== CHECK DB PATH ==="',
    'ls -la /root/CoverScoreAI/data/coverscore.db',
    'echo "=== DB_SIZE ==="',
    'wc -c /root/CoverScoreAI/data/coverscore.db',
    'echo "=== TEST TABLE ==="',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db ".tables" 2>&1',
    'echo "=== ADD COLUMN VIA HOST SQLITE3 ==="',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "ALTER TABLE academy_modules ADD COLUMN scene_data TEXT;" 2>&1',
    'echo "=== BUILD SCENE DATA VIA DOCKER ==="',
    'docker compose run --rm app node scripts/build_scene_data.js 2>&1',
    'echo "=== VERIFY ==="',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT id, scene_data IS NOT NULL AS has_scenes FROM academy_modules WHERE id >= 50 LIMIT 5;" 2>&1'
  ].join('; ');
  c.exec(cmds, (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = ''; s.on('data', d => o += d);
    s.stderr.on('data', d => o += d);
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error('SSH ERROR:', e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
