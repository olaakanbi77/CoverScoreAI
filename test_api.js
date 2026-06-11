const fs = require('fs');
const path = require('path');
const { get, all } = require('./src/config/database');

async function test() {
  try {
    const lead = await get(`
      SELECT l.*, a.answers, a.ai_report, a.score as assessment_score, a.risk_level as assessment_risk
      FROM leads l
      LEFT JOIN assessments a ON l.assessment_id = a.id
      WHERE l.id = ?
    `, [1]);

    if (!lead) {
      console.log('Lead not found');
      return;
    }

    const tasks = await all('SELECT * FROM tasks WHERE lead_id = ? ORDER BY due_date ASC', [lead.id]);
    const activities = await all('SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC', [lead.id]);
    
    console.log("SUCCESS!");
    console.log("Tasks:", tasks);
  } catch (e) {
    console.error("DB ERROR:", e);
  }
}
test();
