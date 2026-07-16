const fs = require('fs');
const path = require('path');

function generateProposal(assessmentData, products, advisorInfo) {
  const proposalNumber = 'PROP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const date = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  let html = fs.readFileSync(path.join(__dirname, 'templates', 'proposal.html'), 'utf8');

  html = html.replace('{{clientName}}', assessmentData.name || 'Client')
             .replace('{{businessName}}', assessmentData.business_name || '')
             .replace('{{date}}', date)
             .replace('{{proposalNumber}}', proposalNumber)
             .replace('{{coverScore}}', assessmentData.score || '--')
             .replace('{{riskLevel}}', assessmentData.risk_level || 'Assessed')
             .replace('{{advisorName}}', advisorInfo?.name || 'Your CoverScore Advisor')
             .replace('{{advisorPhone}}', advisorInfo?.phone || '')
             .replace('{{advisorEmail}}', advisorInfo?.email || '');

  const riskRows = Object.entries(assessmentData.scored_pillars || {})
    .map(([name, score]) => {
      const riskClass = score < 40 ? 'badge-high' : score < 70 ? 'badge-moderate' : 'badge-low';
      const riskLabel = score < 40 ? 'High Risk' : score < 70 ? 'Moderate' : 'Low Risk';
      return `<tr><td>${name}</td><td>${score}%</td><td><span class="badge ${riskClass}">${riskLabel}</span></td></tr>`;
    })
    .join('');
  html = html.replace('{{riskRows}}', riskRows || '<tr><td colspan="3">No risk data available</td></tr>');

  const productRows = (products || []).map(p => `
    <div class="product-card">
      <h3>${p.product}</h3>
      <p>${p.reason || 'Recommended based on your assessment results.'}</p>
      <p class="premium">Estimated premium: ₦${(p.estimatedPremium?.min || 0).toLocaleString()} - ₦${(p.estimatedPremium?.max || 0).toLocaleString()}/year</p>
    </div>
  `).join('');
  html = html.replace('{{productRows}}', productRows || '<p>No specific products recommended at this time.</p>');

  const totalMin = (products || []).reduce((s, p) => s + (p.estimatedPremium?.min || 0), 0);
  const totalMax = (products || []).reduce((s, p) => s + (p.estimatedPremium?.max || 0), 0);
  html = html.replace('{{totalPremiumMin}}', totalMin.toLocaleString());
  html = html.replace('{{totalPremiumMax}}', totalMax.toLocaleString());

  const outputDir = path.join(__dirname, '..', '..', 'public', 'proposals');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, proposalNumber + '.html'), html);

  return {
    success: true,
    proposalNumber,
    htmlUrl: `/proposals/${proposalNumber}.html`,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { generateProposal };
