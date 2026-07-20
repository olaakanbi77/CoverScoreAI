const { all, run } = require('./src/config/database');
(async () => {
  // Fix corrupted phone numbers and wrong names from backfill
  const leads = await all("SELECT l.id, l.name, l.phone, l.business_name, l.assessment_id, a.answers FROM leads l LEFT JOIN assessments a ON l.assessment_id = a.id WHERE l.phone != '' AND l.phone IS NOT NULL AND l.phone NOT LIKE '234%'");
  console.log('Leads with corrupted phone/non-234 prefix:', leads.length);
  for (const l of leads) {
    console.log(`  #${l.id} phone="${l.phone}" name="${l.name}"`);
    // Clear corrupted phone (it's an age value or invalid number)
    await run("UPDATE leads SET phone = NULL, updated_at = datetime('now') WHERE id = ?", [l.id]);
    console.log(`    -> phone cleared`);

    // Try to extract correct name from assessment answers
    if (l.answers) {
      try {
        const ans = JSON.parse(l.answers);
        const correctName = ans.business_name || ans.contact_name || ans.name || null;
        const keys = Object.keys(ans);
        // For personal funnels, try _004 as name
        for (const k of keys) {
          const prefix = k.split('_')[0];
          const num = parseInt(k.split('_')[1]);
          if (num === 4 && ans[k] && ans[k].length > 2 && !ans[k].includes('@')) {
            if (!correctName || ans[k] !== 'Lagos') {
              await run("UPDATE leads SET name = ?, business_name = ?, updated_at = datetime('now') WHERE id = ?", [ans[k], l.business_name || ans[k], l.id]);
              console.log(`    -> name updated to "${ans[k]}"`);
              break;
            }
          }
        }
      } catch(e) {}
    }
  }

  // Also fix any phone that's too short (< 7 digits) or contains non-numeric characters beyond prefix
  const badPhones = await all("SELECT id, phone FROM leads WHERE phone IS NOT NULL AND phone != '' AND phone NOT GLOB '234[0-9]*'");
  console.log('\nAdditional bad phones:', badPhones.length);
  for (const l of badPhones) {
    console.log(`  #${l.id} phone="${l.phone}"`);
    await run("UPDATE leads SET phone = NULL, updated_at = datetime('now') WHERE id = ?", [l.id]);
  }

  console.log('\nDone. Now verifying...');
  const fixed = await all("SELECT id, name, phone, business_name, assessment_id FROM leads ORDER BY id");
  fixed.forEach(l => console.log(`  #${l.id} name="${l.name}" phone="${l.phone}" biz="${l.business_name}"`));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
