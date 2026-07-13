const { db, pgPool, run, get, all } = require('../config/database');
const migrate = require('./migrate');

const isPostgres = !!process.env.DATABASE_URL;

function getDb() {
  return isPostgres ? pgPool : db;
}

async function query(sql, params = []) {
  if (isPostgres) {
    const res = await pgPool.query(sql, params);
    return res;
  }
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve({ rows, rowCount: rows ? rows.length : 0 });
    });
  });
}

module.exports = { getDb, query, get, all, run, migrate };
