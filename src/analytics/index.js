const queries = require('./queries');
const reportGenerator = require('./reports');

async function executeQuery(queryName, params, db) {
  const queryFn = queries[queryName];
  if (!queryFn) {
    throw new Error(`Unknown query: ${queryName}. Available: ${Object.keys(queries).join(', ')}`);
  }
  const { sql, params: queryParams } = queryFn(params || {});

  if (db.all) {
    return new Promise((resolve, reject) => {
      db.all(sql, queryParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  const res = await db.query(sql, queryParams);
  return res.rows || res;
}

module.exports = { queries, reportGenerator, executeQuery };
