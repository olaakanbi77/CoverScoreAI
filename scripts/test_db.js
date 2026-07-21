const sqlite3 = require('sqlite3');
const path = require('path');
const DB_PATH = path.join(__dirname, '..', 'data', 'coverscore.db');
const db = new sqlite3.Database(DB_PATH);

const A = (sql) => new Promise((res, rej) => db.all(sql, (e, r) => e ? rej(e) : res(r)));

async function main() {
  try {
    const rows = await A("SELECT COUNT(*) as c FROM academy_modules WHERE id >= 50");
    console.log('Rows:', JSON.stringify(rows));
    console.log('Type:', typeof rows, Array.isArray(rows), rows.length);
    const rows2 = await A("SELECT id, title FROM academy_modules WHERE id >= 50 LIMIT 3");
    console.log('Rows2:', JSON.stringify(rows2));
  } catch(e) {
    console.error('Error:', e.message);
  }
  db.close();
}
main();
