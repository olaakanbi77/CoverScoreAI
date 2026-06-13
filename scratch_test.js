const fs = require('fs');
const hb = require('handlebars');
hb.registerHelper('eq', (a, b) => a === b);
hb.registerHelper('userInitials', name => 'US');

const template = fs.readFileSync('src/views/advisor/dashboard.hbs', 'utf-8');

try {
  const compiled = hb.compile(template);
  const res = compiled({
    leads: [],
    selectedLead: null,
    summary: { hotLeads: 0, consultations: 0, proposalsSent: 0, policiesSold: 0, estPremium: '0' }
  });
  console.log("Contains Recommended Products:", res.includes("Recommended Products"));
  console.log("Contains Today Summary:", res.includes("Today's Summary"));
  console.log("Contains No leads:", res.includes("No leads in your database yet."));
} catch(e) {
  console.error("Error compiling:", e.message);
}
