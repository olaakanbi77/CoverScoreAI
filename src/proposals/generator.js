const fs = require('fs');
const path = require('path');

function generateProposal(assessmentData, products, advisorInfo) {
  const proposalNumber = 'PROP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const date = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  const displayName = assessmentData.business_name || assessmentData.name || 'Client';
  const businessSubtitle = (assessmentData.business_name && assessmentData.name && assessmentData.business_name !== assessmentData.name) ? assessmentData.name : '';

  let html = fs.readFileSync(path.join(__dirname, 'templates', 'proposal.html'), 'utf8');

  const subs = {
    displayName: displayName,
    businessSubtitle: businessSubtitle,
    clientName: assessmentData.name || 'Client',
    businessName: assessmentData.business_name || '',
    date: date,
    proposalNumber: proposalNumber,
    coverScore: assessmentData.score || '--',
    riskLevel: assessmentData.risk_level || 'Assessed',
    advisorName: advisorInfo?.name || 'Your CoverScore Advisor',
    advisorPhone: advisorInfo?.phone || '',
    advisorEmail: advisorInfo?.email || ''
  };
  for (const [key, val] of Object.entries(subs)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
  }

  const riskRows = Object.entries(assessmentData.scored_pillars || {})
    .map(([name, score]) => {
      const riskClass = score < 40 ? 'badge-high' : score < 70 ? 'badge-moderate' : 'badge-low';
      const riskLabel = score < 40 ? 'High Risk' : score < 70 ? 'Moderate' : 'Low Risk';
      return `<tr><td>${name}</td><td>${score}%</td><td><span class="badge ${riskClass}">${riskLabel}</span></td></tr>`;
    })
    .join('');
  if (riskRows) {
    html = html.replace('{{riskRows}}', riskRows);
  } else {
    const score = assessmentData.score || '--';
    const level = assessmentData.risk_level || 'Assessed';
    html = html.replace('{{riskRows}}', `<tr><td colspan="3">Overall CoverScore: ${score}% — ${level} risk profile. Detailed pillar breakdown not available for this assessment.</td></tr>`);
  }

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
  html = html.replace(new RegExp('{{totalPremiumMin}}', 'g'), totalMin.toLocaleString());
  html = html.replace(new RegExp('{{totalPremiumMax}}', 'g'), totalMax.toLocaleString());

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
