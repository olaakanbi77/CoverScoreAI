const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec(`cd /root/CoverScoreAI
sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT SUBSTR(content,1,300) FROM academy_modules WHERE id=50;" 2>&1
echo "===CONTENT PREVIEW_FULL==="
sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT SUBSTR(content,1,3000) FROM academy_modules WHERE id=51;" 2>&1
echo "===CASESTUDY==="
sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT CASE WHEN case_study IS NOT NULL AND LENGTH(case_study)>5 THEN SUBSTR(case_study,1,200) ELSE 'EMPTY' END FROM academy_modules WHERE id=50;" 2>&1
echo "===TEASER==="
sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT CASE WHEN subtitle IS NOT NULL AND LENGTH(subtitle)>5 THEN SUBSTR(subtitle,1,200) ELSE 'EMPTY' END FROM academy_modules WHERE id=50;" 2>&1`, (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = ''; s.on('data', d => o += d);
    s.stderr.on('data', d => o += d);
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error('SSH ERROR:', e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
