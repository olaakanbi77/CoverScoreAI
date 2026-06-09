const path = require('path');
const fs = require('fs');

const possiblePaths = [
  path.join(__dirname, 'data', 'coverscore.db'),
  '/home/coveqmxf/coverscore-ai/data/coverscore.db',
  process.env.DB_PATH
].filter(Boolean);

let dbPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) { dbPath = p; break; }
}

if (!dbPath) {
  console.error('Database not found at any known path.');
  console.error('Searched:', possiblePaths);
  process.exit(1);
}

console.log('Found database at:', dbPath);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath);

const email = process.argv[2] || 'admin@coverscore.site';

db.get('SELECT id, email, name, role FROM users WHERE email = ?', [email], (err, row) => {
  if (err) { console.error('Error:', err.message); process.exit(1); }
  if (!row) {
    console.error('User not found:', email);
    db.close();
    process.exit(1);
  }
  console.log('Current user:', JSON.stringify(row));
  
  db.run('UPDATE users SET role = ? WHERE id = ?', ['admin', row.id], function(err) {
    if (err) { console.error('Update failed:', err.message); process.exit(1); }
    console.log('Role updated to admin for:', email);
    db.close();
  });
});
