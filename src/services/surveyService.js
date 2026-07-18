const { run, get, all } = require('../config/database');

async function getTemplates() {
  return all('SELECT * FROM risk_survey_templates ORDER BY name');
}

async function getTemplate(id) {
  const tpl = await get('SELECT * FROM risk_survey_templates WHERE id = ?', [id]);
  if (tpl) tpl.questions = JSON.parse(tpl.questions || '[]');
  return tpl;
}

async function createSurvey(leadId, { session_id, type, surveyor_id, scheduled_at, template_id }) {
  let answers = {};
  if (template_id) {
    const tpl = await getTemplate(template_id);
    if (tpl) {
      answers = { template_id, template_name: tpl.name, questions: tpl.questions, responses: {} };
    }
  }
  const result = await run(
    `INSERT INTO risk_surveys (lead_id, session_id, surveyor_id, type, status, answers, scheduled_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [leadId, session_id || null, surveyor_id || null, type || 'site_inspection', JSON.stringify(answers), scheduled_at || null]
  );
  return { id: result.lastInsertRowid };
}

async function getSurveys(leadId, filters = {}) {
  let sql = 'SELECT rs.*, u.name as surveyor_name FROM risk_surveys rs LEFT JOIN users u ON rs.surveyor_id = u.id WHERE rs.lead_id = ?';
  const params = [leadId];
  if (filters.status) { sql += ' AND rs.status = ?'; params.push(filters.status); }
  sql += ' ORDER BY rs.created_at DESC';
  return all(sql, params);
}

async function getAllSurveys() {
  return all(`
    SELECT rs.*, l.name as client_name, l.business_name, u.name as surveyor_name
    FROM risk_surveys rs
    JOIN leads l ON rs.lead_id = l.id
    LEFT JOIN users u ON rs.surveyor_id = u.id
    ORDER BY rs.created_at DESC
  `);
}

async function getSurvey(id) {
  return get('SELECT rs.*, l.name as client_name, l.business_name, l.phone, l.email FROM risk_surveys rs JOIN leads l ON rs.lead_id = l.id WHERE rs.id = ?', [id]);
}

async function updateSurvey(id, { answers, report, status, completed_at }) {
  const setters = [];
  const params = [];
  if (answers !== undefined) { setters.push('answers = ?'); params.push(JSON.stringify(answers)); }
  if (report !== undefined) { setters.push('report = ?'); params.push(report); }
  if (status !== undefined) { setters.push('status = ?'); params.push(status); }
  if (completed_at !== undefined || status === 'completed') { setters.push("completed_at = datetime('now')"); }
  setters.push("updated_at = datetime('now')");
  params.push(id);
  await run(`UPDATE risk_surveys SET ${setters.join(', ')} WHERE id = ?`, params);
  return getSurvey(id);
}

module.exports = { getTemplates, getTemplate, createSurvey, getSurveys, getAllSurveys, getSurvey, updateSurvey };