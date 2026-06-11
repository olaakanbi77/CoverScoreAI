const { all, get } = require('./src/config/database');

const checkDB = async () => {
  try {
    const leadsCount = await get('SELECT COUNT(*) as c FROM leads');
    console.log('Leads count:', leadsCount.c);
    if (leadsCount.c > 0) {
      const firstLead = await get('SELECT * FROM leads LIMIT 1');
      console.log('First lead:', firstLead);
    }
  } catch(e) {
    console.error(e);
  }
}

checkDB();
