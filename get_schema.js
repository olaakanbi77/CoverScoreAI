const { db } = require('./src/config/database');
db.serialize(() => {
  db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
  });
});
