const { all } = require('./src/config/database');
(async () => {
  const leads = await all("SELECT id, name, assessment_data, chat_history, assessment_id FROM leads WHERE phone IS NULL OR phone = ''");
  console.log('Leads without phone:', leads.length);
  for (const l of leads) {
    console.log('\nLead #' + l.id + ' name="' + l.name + '" aid=' + l.assessment_id);
    if (l.assessment_data && l.assessment_data !== '{}') {
      try {
        const d = JSON.parse(l.assessment_data);
        console.log('  assessment_data keys:', Object.keys(d).join(','));
      } catch(e) { console.log('  assessment_data: parse error'); }
    } else {
      console.log('  assessment_data: empty');
    }
    if (l.chat_history && l.chat_history !== '[]' && l.chat_history !== '{}') {
      try {
        const c = JSON.parse(l.chat_history);
        if (c.__messages && c.__messages.length > 0) {
          console.log('  chat_history messages:', c.__messages.length);
          const first = c.__messages[0];
          console.log('  first msg:', JSON.stringify(first).substring(0, 200));
        } else {
          console.log('  chat_history: no __messages');
        }
      } catch(e) { console.log('  chat_history: parse error'); }
    } else {
      console.log('  chat_history: empty');
    }
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
