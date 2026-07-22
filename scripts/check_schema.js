const sqlite3 = require('sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'coverscore.db');
const db = new sqlite3.Database(DB_PATH);

db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='academy_modules'", (err, rows) => {
  if (err) { console.error(err); db.close(); return; }
  console.log('SCHEMA:', rows[0].sql);
  db.all("SELECT id, lesson_number, course_id, title, LENGTH(IFNULL(video_script,'')) as vs_len, LENGTH(IFNULL(content,'')) as content_len, LENGTH(IFNULL(case_study,'')) as cs_len, video_url FROM academy_modules WHERE id >= 50 ORDER BY id LIMIT 5", (err2, rows2) => {
    if (err2) { console.error(err2); db.close(); return; }
    console.log(JSON.stringify(rows2, null, 2));
    db.close();
  });
});
