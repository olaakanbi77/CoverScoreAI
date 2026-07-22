const sqlite3 = require('sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'coverscore.db');
const db = new sqlite3.Database(DB_PATH);

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildNarration(lesson) {
  const { lesson_number, title, video_script, case_study } = lesson;
  const parts = [];

  parts.push(`Lesson ${lesson_number}: ${title}.`);

  if (video_script) {
    let body = stripHtml(video_script);
    body = body.replace(/^Title:.*$/m, '').trim();
    if (body.length > 20) parts.push(body);
  }

  if (case_study) {
    const cs = stripHtml(case_study);
    if (cs.length > 10) {
      const titleMatch = cs.match(/Case Study:\s*([^\n]+)/i);
      const csTitle = titleMatch ? titleMatch[1].trim() : 'a real-world scenario';
      const csBody = cs.replace(/Case Study:\s*[^\n]*\n*/i, '').trim();
      parts.push(`Consider this scenario: ${csTitle}. ${csBody}`);
    }
  }

  return parts.join('\n\n');
}

db.all(`SELECT * FROM academy_modules WHERE id >= 50 ORDER BY id LIMIT 3`, (err, rows) => {
  if (err) { console.error(err); db.close(); return; }
  for (const row of rows) {
    console.log(`\n=== LESSON ${row.id}: ${row.title} ===`);
    console.log(buildNarration(row));
    console.log('=== END ===');
  }
  db.close();
});
