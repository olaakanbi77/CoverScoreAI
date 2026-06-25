const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./coverscore.db');
db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='assessment_questions'", (err, rows) => {
    if (err) console.error(err);
    else console.log(rows[0].sql);
});
