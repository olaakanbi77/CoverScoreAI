const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec(`cd /root/CoverScoreAI
node -e "
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('/root/CoverScoreAI/data/coverscore.db');

// Check if any lesson content, video_script, or case_study contains 'coverscore.site'
db.all(\"SELECT id, title, CASE WHEN content LIKE '%coverscore.site%' THEN 'CONTENT' ELSE '' END AS in_content, CASE WHEN video_script LIKE '%coverscore.site%' THEN 'SCRIPT' ELSE '' END AS in_script, CASE WHEN case_study LIKE '%coverscore.site%' THEN 'CASE' ELSE '' END AS in_case FROM academy_modules WHERE id >= 50 AND (content LIKE '%coverscore.site%' OR video_script LIKE '%coverscore.site%' OR case_study LIKE '%coverscore.site%')\", (e, rows) => {
  if (e) { console.log('ERR', e.message); db.close(); return; }
  if (rows.length === 0) {
    console.log('No lessons contain coverscore.site in any field.');
  } else {
    rows.forEach(r => console.log(r.id, r.title, r.in_content, r.in_script, r.in_case));
  }
  db.close();
});
" 2>&1`, (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = ''; s.on('data', d => o += d);
    s.stderr.on('data', d => o += d);
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error('SSH ERROR:', e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
