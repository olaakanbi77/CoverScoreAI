const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'coverscore',
  user: process.env.PG_USER || 'coverscore',
  password: process.env.PG_PASSWORD || ''
});

async function migrate() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  console.log(`[migrate] Found ${files.length} migration(s)`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`[migrate] Running ${file}...`);
    try {
      await pool.query(sql);
      console.log(`[migrate] ✓ ${file}`);
    } catch (err) {
      console.error(`[migrate] ✗ ${file}:`, err.message);
      throw err;
    }
  }

  console.log('[migrate] All migrations complete');
  await pool.end();
}

migrate().catch(err => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
