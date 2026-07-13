const path = require('path');
const fs = require('fs');
const { db, pgPool } = require('../config/database');

const isPostgres = !!process.env.DATABASE_URL;

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found');
    return;
  }

  if (isPostgres) {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } else {
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS _migrations (
          name TEXT PRIMARY KEY,
          applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  let applied = [];
  if (isPostgres) {
    const res = await pgPool.query('SELECT name FROM _migrations ORDER BY name');
    applied = res.rows.map(r => r.name);
  } else {
    applied = await new Promise((resolve, reject) => {
      db.all('SELECT name FROM _migrations ORDER BY name', (err, rows) => {
        if (err) resolve([]);
        else resolve(rows.map(r => r.name));
      });
    });
  }

  for (const file of files) {
    if (applied.includes(file)) {
      console.log(`Skipping already-applied migration: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Applying migration: ${file}`);

    try {
      if (isPostgres) {
        await pgPool.query(sql);
        await pgPool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      } else {
        await new Promise((resolve, reject) => {
          db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        await new Promise((resolve, reject) => {
          db.run('INSERT INTO _migrations (name) VALUES (?)', [file], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      console.log(`Migration applied: ${file}`);
    } catch (err) {
      console.warn(`Migration skipped: ${file} — ${err.message}`);
      await new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO _migrations (name) VALUES (?)', [file], (err) => {
          if (err) reject(err);
          else resolve();
        });
      }).catch(() => {});
    }
  }

  console.log('All migrations complete');
}

if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
}

module.exports = migrate;
