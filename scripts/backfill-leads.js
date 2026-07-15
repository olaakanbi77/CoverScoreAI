const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./data/coverscore.db');

db.all('SELECT id, answers, score, risk_level, created_at FROM assessments WHERE id NOT IN (SELECT assessment_id FROM leads WHERE assessment_id IS NOT NULL)', (err, rows) => {
  if (err) { console.error(err); return; }
  console.log(`Found ${rows.length} assessments without leads`);
  
  let completed = 0;
  let created = 0;
  const total = rows.length;
  if (total === 0) { console.log('Nothing to do.'); db.close(); return; }
  rows.forEach((a) => {
    let name = 'Assessment #' + a.id;
    let email = null;
    let phone = null;
    let businessName = null;
    let industry = null;
    
    try {
      const parsed = JSON.parse(a.answers);
      // Extract from known key patterns
      const vals = Object.values(parsed).filter(v => typeof v === 'string' && v.length > 1);
      const keys = Object.keys(parsed);
      
      // Name from known question keys
      for (const k of keys) {
        const num = parseInt(k.split('_')[1]);
        if (num === 4 && parsed[k]) businessName = parsed[k];
        if (num === 5 && parsed[k]) name = parsed[k];
        if (num === 6 && parsed[k]) name = parsed[k];
        if (num === 7 && parsed[k] && !email) {
          if (parsed[k].includes('@')) email = parsed[k];
          else if (parsed[k].includes('personal') || parsed[k].includes('family')) industry = parsed[k];
        }
        if (num === 9 && parsed[k]) phone = parsed[k];
        if (k === 'business_name') businessName = parsed[k];
        if (k === 'contact_name') name = parsed[k];
        if (k === 'name') name = parsed[k];
        if (k.startsWith('BUS_')) {
          if (k === 'BUS_004' && parsed[k]) businessName = parsed[k];
          if (k === 'BUS_005' && parsed[k]) name = parsed[k];
        }
      }
      
      if (!businessName) {
        businessName = parsed.business_name || parsed.company_name || null;
      }
      
      // Try template_selection
      if (parsed.template_selection && parsed.template_selection.template_id) {
        const tpl = parsed.template_selection.template_id;
        if (tpl === 'SCH') {
          businessName = parsed.SCH_004 || businessName;
          name = parsed.SCH_005 || name;
          email = parsed.SCH_007 || email;
        } else if (tpl === 'BUS') {
          businessName = parsed.BUS_004 || businessName;
          name = parsed.BUS_005 || name;
        } else if (tpl === 'SME') {
          businessName = parsed.SME_004 || businessName;
          name = parsed.SME_005 || name;
        } else if (tpl === 'PER') {
          name = parsed.PER_005 || parsed.PER_004 || name;
        }
      }
      
    } catch(e) { /* silent */ }
    
    const contactName = name || businessName || 'Unknown';
    const displayName = businessName || contactName;
    const riskLevel = a.risk_level || 'low';
    const createdAt = a.created_at || new Date().toISOString();
    
    db.run(`INSERT INTO leads (name, email, phone, status, business_name, industry, entity_type, score, risk_level, assessment_id, created_at, updated_at, pipeline_stage)
      VALUES (?, ?, ?, 'Report Sent', ?, ?, 'business', ?, ?, ?, ?, ?, 2)`,
      [contactName, email || 'whatsapp@coverscore.site', phone || '', displayName, industry || 'General', a.score, riskLevel, a.id, createdAt, createdAt],
      function(err) {
        completed++;
        if (err) console.error(`Error creating lead for assessment ${a.id}:`, err.message);
        else { created++; console.log(`Created lead #${this.lastInsertRowid} for assessment ${a.id} — ${displayName}`); }
        if (completed === total) {
          console.log(`\nDone. Created ${created} leads from ${total} assessments.`);
          db.close();
        }
      }
    );
  });
});
