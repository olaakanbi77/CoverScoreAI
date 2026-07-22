const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec(`cd /root/CoverScoreAI
sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT SUBSTR(content,1,2000) AS preview FROM academy_modules WHERE id=50;" 2>&1
echo "=== SECTION BREAKDOWN ==="
sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT id, CASE WHEN content LIKE '%Learning Objectives%' THEN 1 ELSE 0 END AS has_objectives, CASE WHEN content LIKE '%Key Takeaways%' THEN 1 ELSE 0 END AS has_takeaways, CASE WHEN content LIKE '%Case Study%' THEN 1 ELSE 0 END AS has_case_study, LENGTH(content) AS content_len FROM academy_modules WHERE id >= 50 LIMIT 5;" 2>&1
echo "=== VIDEO_SCRIPT COUNT ==="
sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT 'has_script', COUNT(*) FROM academy_modules WHERE id >= 50 AND video_script IS NOT NULL AND LENGTH(video_script) > 20; SELECT 'no_script', COUNT(*) FROM academy_modules WHERE id >= 50 AND (video_script IS NULL OR LENGTH(video_script) <= 20);" 2>&1`, (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = ''; s.on('data', d => o += d);
    s.stderr.on('data', d => o += d);
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error('SSH ERROR:', e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
