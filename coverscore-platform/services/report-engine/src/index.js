// Report Engine — generates Risk Intelligence Reports
// KNOWS: scores, session context, customer data
// DOES NOT KNOW: questions, branching, state machine

const db = require('../../../database/schemas');
const { getRiskLevel } = require('../../../packages/shared-types');

class ReportEngine {
  // Generate a full risk report for a session
  async generateReport(sessionId) {
    const session = await db.query('SELECT * FROM conversation_sessions WHERE id = $1', [sessionId]);
    if (!session.rows.length) throw new Error(`Session ${sessionId} not found`);

    const score = await db.query(
      'SELECT * FROM risk_scores WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
      [sessionId]
    );
    if (!score.rows.length) throw new Error(`No score for session ${sessionId}`);

    const customer = session.rows[0].customer_id
      ? await db.query('SELECT * FROM customers WHERE id = $1', [session.rows[0].customer_id])
      : null;

    const answers = await db.query(
      'SELECT a.*, q.text as question_text, q.category, q.pillar FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.session_id = $1',
      [sessionId]
    );

    return this.buildReport(session.rows[0], score.rows[0], customer?.rows[0] || null, answers.rows);
  }

  // Build structured report content
  buildReport(session, scoreResult, customer, answers) {
    const riskLevel = scoreResult.risk_level || getRiskLevel(scoreResult.score);

    // Pillar breakdown with narrative
    const pillars = scoreResult.pillars || {};
    const pillarSummaries = Object.entries(pillars).map(([name, data]) => ({
      name,
      score: data.score,
      status: data.score >= 70 ? 'Strong' : data.score >= 50 ? 'Moderate' : 'Weak',
      detail: data.score >= 70
        ? `Good resilience in ${name}`
        : data.score >= 50
          ? `Some gaps in ${name} — consider review`
          : `Significant gaps in ${name} — action recommended`
    }));

    // Identified risks from score result
    const identifiedRisks = (scoreResult.identified_risks || []).map(r => ({
      area: r.category || r.detail,
      severity: r.score < 30 ? 'High' : r.score < 50 ? 'Medium' : 'Low',
      score: r.score
    }));

    // Protection gap narrative
    const protectionGap = scoreResult.protection_gap || 0;
    let gapNarrative;
    if (protectionGap >= 70) gapNarrative = 'Your coverage has significant gaps — urgent attention needed';
    else if (protectionGap >= 40) gapNarrative = 'Moderate gaps in your coverage — review recommended';
    else gapNarrative = 'Your coverage is relatively comprehensive';

    const report = {
      reportId: `RIR-${session.id?.substring(0, 8) || '00000000'}-${Date.now().toString(36)}`,
      generatedAt: new Date().toISOString(),
      customer: customer ? {
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      } : null,
      assessment: {
        packId: session.pack_id,
        startedAt: session.started_at,
        completedAt: session.completed_at || new Date().toISOString(),
        questionsAnswered: answers.length
      },
      score: {
        overall: scoreResult.score,
        riskLevel,
        confidence: scoreResult.confidence || 0
      },
      pillars: pillarSummaries,
      protectionGap: {
        score: protectionGap,
        narrative: gapNarrative
      },
      identifiedRisks,
      recommendations: identifiedRisks.length > 0
        ? identifiedRisks.map(r => ({
            risk: r.area,
            priority: r.severity,
            suggestion: `Review and strengthen coverage for ${r.area}`
          }))
        : [{ priority: 'Low', suggestion: 'Maintain current coverage levels' }],
      summary: this.generateSummary(scoreResult.score, riskLevel, protectionGap, answers.length)
    };

    return report;
  }

  // Generate executive summary
  generateSummary(score, riskLevel, protectionGap, answersCount) {
    let summary = `Risk assessment complete. `;
    summary += `Overall CoverScore: ${score}/100 (${riskLevel}). `;

    if (protectionGap >= 70) {
      summary += 'Significant protection gaps detected — review is strongly advised. ';
    } else if (protectionGap >= 40) {
      summary += 'Moderate protection gaps identified. ';
    } else {
      summary += 'Protection coverage is satisfactory. ';
    }

    summary += `Based on ${answersCount} responses.`;
    return summary;
  }

  // Save report to database
  async saveReport(sessionId, reportData) {
    const score = await db.query(
      'SELECT * FROM risk_scores WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
      [sessionId]
    );

    const res = await db.query(
      `INSERT INTO reports (session_id, customer_id, score_id, format, content, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        sessionId,
        reportData.customer ? reportData.customer.id || null : null,
        score.rows.length ? score.rows[0].id : null,
        'json',
        JSON.stringify(reportData),
        'generated'
      ]
    );

    await db.query(
      `INSERT INTO events (session_id, event_type, data, source)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, 'report.generated', JSON.stringify({ reportId: reportData.reportId }), 'report-engine']
    );

    return res.rows[0];
  }

  // Generate HTML version from report data
  generateHtml(report) {
    const pillarsHtml = (report.pillars || []).map(p =>
      `<tr><td>${p.name}</td><td>${p.score}</td><td>${p.status}</td><td>${p.detail}</td></tr>`
    ).join('');

    const risksHtml = (report.identifiedRisks || []).map(r =>
      `<tr><td>${r.area}</td><td>${r.severity}</td><td>${r.score}</td></tr>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Risk Intelligence Report</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1a2e}h1{color:#16213e}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}.score{font-size:48px;font-weight:bold;color:#e94560}.risk{font-size:24px;color:#0f3460}.summary{background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0}</style></head>
<body>
<h1>Risk Intelligence Report</h1>
<p><strong>Report ID:</strong> ${report.reportId}</p>
<p><strong>Generated:</strong> ${report.generatedAt}</p>
<div class="score">${report.score.overall}/100</div>
<div class="risk">${report.score.riskLevel}</div>
<div class="summary">${report.summary}</div>
<h2>Pillar Breakdown</h2>
<table><thead><tr><th>Pillar</th><th>Score</th><th>Status</th><th>Detail</th></tr></thead><tbody>${pillarsHtml}</tbody></table>
<h2>Identified Risks</h2>
<table><thead><tr><th>Area</th><th>Severity</th><th>Score</th></tr></thead><tbody>${risksHtml}</tbody></table>
<h2>Protection Gap</h2>
<p>Score: ${report.protectionGap.score}% — ${report.protectionGap.narrative}</p>
<h2>Recommendations</h2>
<ul>${(report.recommendations || []).map(r => `<li><strong>${r.priority}:</strong> ${r.suggestion}</li>`).join('')}</ul>
</body></html>`;
  }
}

module.exports = new ReportEngine();
