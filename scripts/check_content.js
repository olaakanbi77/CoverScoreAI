const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT id, title, substr(content,1,500) as content_preview, substr(video_script,1,200) as script_preview, substr(case_study,1,200) as cs_preview FROM academy_modules WHERE id = 50;" 2>&1', (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = '';
    s.on('data', d => o += d.toString());
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
