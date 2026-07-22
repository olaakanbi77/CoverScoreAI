const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec(`cd /root/CoverScoreAI
node -e "
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('/root/CoverScoreAI/data/coverscore.db');
db.get('SELECT * FROM academy_modules WHERE id=50', (e, lesson) => {
  if (e) { console.log('ERR', e); return; }
  
  function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<\\/p>/gi, '\\n\\n').replace(/<br\\s*\\/?>/gi, '\\n').replace(/<\\/div>/gi, '\\n\\n').replace(/<\\/li>/gi, '\\n').replace(/<li>/gi, '\\n\\u2022 ').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\\r\\n?/g, '\\n').replace(/\\n{3,}/g, '\\n\\n').trim();
  }
  const parts = [];
  
  // New buildNarration logic
  parts.push('Lesson ' + lesson.lesson_number + ': ' + lesson.title + '.');
  
  if (lesson.video_script) {
    let body = stripHtml(lesson.video_script);
    body = body.replace(/^Title:.*$/m, '').trim();
    console.log('BODY AFTER STRIP + REGEX:');
    console.log('---START---');
    console.log(body.substring(0, 500));
    console.log('---END---');
    if (body.length > 20) parts.push(body);
  }
  
  if (lesson.case_study) {
    const cs = stripHtml(lesson.case_study);
    if (cs.length > 10) {
      const titleMatch = cs.match(/Case Study:\s*([^\n]+)/i);
      const csTitle = titleMatch ? titleMatch[1].trim() : 'a real-world scenario';
      const csBody = cs.replace(/Case Study:\s*[^\n]*\n*/i, '').trim();
      parts.push('Consider this scenario: ' + csTitle + '. ' + csBody);
    }
  }
  
  console.log('\\n=== FULL NARRATION ===');
  console.log(parts.join('\\n\\n'));
  console.log('=== END NARRATION ===');
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
