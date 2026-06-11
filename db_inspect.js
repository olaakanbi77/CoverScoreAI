const { all } = require('c:/Users/USER/Documents/PROJECTS/CoverScore AI/src/config/database');
(async () => {
  try {
    const leads = await all("SELECT id, name, phone, wa_state, chat_history, created_at FROM leads ORDER BY id DESC LIMIT 10");
    console.log("Last 10 Leads:", leads);
  } catch (err) {
    console.error(err);
  }
})();
