const path = require('path');
const fs = require('fs');

let puppeteer;
try { puppeteer = require('puppeteer'); } catch (e) { puppeteer = null; }

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'proposals');

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function getRiskLabel(score) {
  if (!score && score !== 0) return 'Assessed';
  const s = Number(score);
  if (s < 30) return 'Critical';
  if (s < 50) return 'High';
  if (s < 70) return 'Moderate';
  return 'Low';
}

function buildHtml({ lead, ratingProducts, totalPremium, proposalNumber, date, pillarScores }) {
  const productCards = (ratingProducts || []).map(p => {
    const breakdownRows = (p.breakdown || []).map(b =>
      `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${b.label}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:right;">₦${formatCurrency(b.premium || b.amount)}</td></tr>`
    ).join('');

    return `
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="font-size:17px;color:#1a56db;margin:0;font-weight:700;">${p.product}</h3>
          <span style="background:#f0f4ff;color:#1a56db;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">${p.className || 'Standard'} Class</span>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${breakdownRows}
          <tr>
            <td style="padding:8px 12px;border-top:2px solid #1a56db;font-size:14px;font-weight:700;color:#1f2937;">Total</td>
            <td style="padding:8px 12px;border-top:2px solid #1a56db;font-size:14px;font-weight:700;color:#1f2937;text-align:right;">₦${formatCurrency(p.premium)}</td>
          </tr>
        </table>
      </div>`;
  }).join('');

  const riskRows = Object.entries(pillarScores || {}).map(([name, score]) => {
    const s = Number(score);
    const label = s < 40 ? 'High Risk' : s < 70 ? 'Moderate' : 'Low Risk';
    const color = s < 40 ? '#dc2626' : s < 70 ? '#d97706' : '#059669';
    const bg = s < 40 ? '#fee2e2' : s < 70 ? '#fef3c7' : '#d1fae5';
    return `<tr><td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">${name}</td><td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;text-align:center;">${score}%</td><td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:center;"><span style="display:inline-block;padding:3px 12px;border-radius:12px;font-size:12px;font-weight:600;background:${bg};color:${color};">${label}</span></td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>CoverScore Proposal - ${lead.business_name || lead.name || 'Client'}</title>
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; color: #1f2937; margin: 0; padding: 0; background: #f9fafb; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 40px 50px; position: relative; }
  .page-break { page-break-after: always; }
  .cover-page { text-align: center; padding-top: 100px; }
  .cover-page .brand { font-size: 42px; font-weight: 700; color: #1a56db; letter-spacing: -1px; }
  .cover-page .brand span { color: #1f2937; }
  .cover-page .tagline { font-size: 18px; color: #6b7280; margin-top: 8px; font-style: italic; }
  .cover-page h2 { font-size: 28px; color: #1a56db; margin-top: 50px; text-transform: uppercase; letter-spacing: 3px; }
  .cover-page .divider { width: 80px; height: 3px; background: #1a56db; margin: 20px auto; }
  .cover-page .details { margin-top: 60px; font-size: 16px; line-height: 2.2; color: #374151; }
  .cover-page .details strong { color: #1a56db; }
  .cover-page .date-line { margin-top: 100px; font-size: 14px; color: #9ca3af; line-height: 1.8; }
  .section { margin-top: 40px; }
  .section h2 { font-size: 22px; color: #1a56db; border-bottom: 2px solid #1a56db; padding-bottom: 8px; margin-bottom: 20px; }
  .summary-box { background: #f0f4ff; border-left: 4px solid #1a56db; padding: 20px 24px; border-radius: 4px; margin-bottom: 24px; }
  .summary-box p { font-size: 15px; margin-bottom: 8px; line-height: 1.8; color: #374151; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; }
  table thead th { background: #1a56db; color: #fff; padding: 12px 16px; text-align: left; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
  .total-box { background: #1a56db; color: #fff; padding: 20px 24px; border-radius: 8px; text-align: center; margin: 24px 0; }
  .total-box .label { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
  .total-box .amount { font-size: 32px; font-weight: 700; margin-top: 4px; }
  .terms { font-size: 12px; color: #6b7280; line-height: 1.8; margin-top: 20px; }
  .terms ol { padding-left: 20px; }
  .terms li { margin-bottom: 6px; }
  .signature-block { margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; }
  .signature-grid { display: flex; justify-content: space-between; margin-top: 20px; }
  .signature-col h4 { font-size: 14px; color: #1a56db; margin-bottom: 8px; }
  .signature-col p { font-size: 13px; color: #374151; line-height: 1.6; }
  .signature-line { margin-top: 40px; width: 220px; border-top: 1px solid #1f2937; padding-top: 6px; font-size: 12px; color: #6b7280; }
  .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.6; }
  @media print { body { background: #fff; } .page { margin: 0; box-shadow: none; } }
</style>
</head>
<body>

<div class="page cover-page">
  <div class="brand">Cover<span>Score</span></div>
  <div class="tagline">Intelligent Risk Assessment &middot; Smart Protection</div>
  <h2>Risk Protection Proposal</h2>
  <div class="divider"></div>
  <div class="details">
    <p><strong>Prepared for:</strong> ${lead.business_name || lead.name || 'Client'}</p>
    ${lead.business_name ? `<p><strong>${lead.name || ''}</strong></p>` : ''}
    <p><strong>Assessment Score:</strong> ${lead.score || '—'}% &mdash; ${getRiskLabel(lead.score)}</p>
  </div>
  <div class="date-line">
    <p>Date: ${date}</p>
    <p>Proposal #: ${proposalNumber}</p>
  </div>
</div>

<div class="page page-break">
  <div class="section">
    <h2>Executive Summary</h2>
    <div class="summary-box">
      <p>This proposal outlines risk protection recommendations based on the comprehensive CoverScore assessment completed on behalf of <strong>${lead.business_name || lead.name || 'Client'}</strong>.</p>
      <p>Your overall CoverScore of <strong>${lead.score || '—'}%</strong> indicates a <strong>${getRiskLabel(lead.score)}</strong> risk profile. The recommendations below address key risk areas identified during assessment, providing tailored cover solutions to strengthen your risk posture.</p>
      <p>Estimated total annual premium: <strong>₦${formatCurrency(totalPremium)}</strong>.</p>
    </div>
  </div>

  ${pillarScores && Object.keys(pillarScores).length > 0 ? `
  <div class="section">
    <h2>Risk Summary</h2>
    <table>
      <thead><tr><th>Risk Pillar</th><th>Score</th><th>Risk Level</th></tr></thead>
      <tbody>${riskRows}</tbody>
    </table>
  </div>` : ''}

  <div class="section">
    <h2>Recommended Covers</h2>
    ${productCards || '<p style="color:#6b7280;font-size:14px;">No specific products recommended at this time.</p>'}
    <div class="total-box">
      <div class="label">Total Annual Premium</div>
      <div class="amount">₦${formatCurrency(totalPremium)}</div>
    </div>
  </div>

  <div class="section">
    <h2>Terms &amp; Conditions</h2>
    <div class="terms">
      <ol>
        <li>This proposal is valid for 30 days from the date of issue.</li>
        <li>All premiums quoted are estimates and subject to final underwriting.</li>
        <li>Coverage is subject to policy terms, conditions, and exclusions as defined in the final policy document.</li>
        <li>Acceptance of this proposal must be confirmed in writing or via the CoverScore platform.</li>
        <li>CoverScore acts as a technology and advisory platform; final binding authority rests with the issuing insurer.</li>
        <li>Any material changes to risk profile after assessment date must be disclosed and may affect this proposal.</li>
      </ol>
    </div>
  </div>

  <div class="signature-block">
    <h2 style="font-size:22px;color:#1a56db;border-bottom:2px solid #1a56db;padding-bottom:8px;margin-bottom:20px;">Advisor</h2>
    <div class="signature-grid">
      <div class="signature-col">
        <h4>CoverScore Advisor</h4>
        <p>${process.env.WHATSAPP_BOT_NUMBER || 'Contact via platform'}</p>
        <p>${process.env.ADMIN_EMAIL || 'advisor@coverscore.ai'}</p>
      </div>
      <div class="signature-col" style="text-align:right">
        <div class="signature-line" style="margin-left:auto">Advisor Signature</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>CoverScore &mdash; Intelligent Risk Assessment &amp; Protection</p>
    <p>This document is confidential and intended solely for ${lead.business_name || lead.name || 'the client'}</p>
    <p>Proposal #${proposalNumber} &bull; Generated ${date}</p>
  </div>
</div>

</body></html>`;
}

async function generateProposalPdf(proposal, lead, ratingProducts) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const date = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  const filename = `proposal-${proposal.id}.pdf`;
  const filePath = path.join(OUTPUT_DIR, filename);
  const proposalNumber = proposal.title ? proposal.title.replace(/[^a-z0-9]/gi, '-').substring(0, 30) : `PROP-${Date.now().toString(36).toUpperCase()}`;
  const slug = proposalNumber.toLowerCase();

  if (fs.existsSync(filePath)) {
    return { success: true, pdfUrl: `/proposals/${filename}`, filePath, proposalNumber: slug, date, cached: true };
  }

  let content;
  try {
    content = typeof proposal.content === 'string' ? JSON.parse(proposal.content) : proposal.content;
  } catch (e) {
    content = {};
  }

  const totalPremium = ratingProducts.reduce((s, p) => s + (p.premium || 0), 0) || proposal.amount || 0;

  let pillarScores = {};
  if (lead.assessment_id) {
    const { get } = require('../config/database');
    try {
      const assessment = await get('SELECT ai_report FROM assessments WHERE id = ?', [lead.assessment_id]);
      if (assessment && assessment.ai_report) {
        const aiData = JSON.parse(assessment.ai_report);
        if (aiData.pillar_scores) pillarScores = aiData.pillar_scores;
      }
    } catch (e) {}
  }

  let html,
    htmlSaved = false;

  try {
    html = buildHtml({ lead, ratingProducts, totalPremium, proposalNumber: slug, date, pillarScores });
    const htmlPath = filePath.replace('.pdf', '.html');
    fs.writeFileSync(htmlPath, html);
    htmlSaved = true;
  } catch (e) {
    console.error('[PDF] HTML build/save failed:', e.message);
  }

  let pdfGenerated = false;
  let executablePath = null;

  const possiblePaths = [
    process.env.CHROME_PATH,
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium'
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      printBackground: true,
      displayHeaderFooter: false
    });
    fs.writeFileSync(filePath, pdfBuffer);
    pdfGenerated = true;
    await browser.close();
  } catch (err) {
    console.error('[PDF] Generation failed:', err.message);
  }

  return {
    success: pdfGenerated,
    pdfUrl: pdfGenerated ? `/proposals/${filename}` : null,
    htmlUrl: `/proposals/${filename.replace('.pdf', '.html')}`,
    filePath: pdfGenerated ? filePath : null,
    proposalNumber: slug,
    date,
    html: html || null,
    htmlSaved
  };
}

async function generateAndStreamPdf(proposal, lead, ratingProducts, res) {
  const result = await generateProposalPdf(proposal, lead, ratingProducts);
  if (result.success) {
    return res.download(result.filePath, `CoverScore-Proposal-${lead.business_name || lead.name || 'Client'}.pdf`);
  }
  if (result.htmlSaved) {
    return res.redirect(result.htmlUrl);
  }
  if (result.html) {
    return res.type('html').send(result.html);
  }
  throw new Error('PDF generation failed — could not generate HTML or PDF');
}

module.exports = { generateProposalPdf, generateAndStreamPdf, buildHtml };
