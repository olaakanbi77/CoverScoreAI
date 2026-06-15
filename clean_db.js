const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/coverscore.db');
db.run("DELETE FROM leads WHERE email='whatsapp@coverscore.site' OR name='WhatsApp User' OR name LIKE '%pipsgenius%' OR phone LIKE '%165304629%'", (err) => {
  if(err) console.error(err);
  else console.log('Wiped leads');
});
