const prompts = require('../prompts');
const { generateProposal } = require('../proposals/generator');

class RenewalEngine {
  async checkExpiringPolicies(db) {
    const actions = [];
    const now = new Date().toISOString();
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const expiringPolicies = await db.all(
      `SELECT p.*, l.name AS client_name, l.phone, l.email, l.assigned_agent
       FROM policies p
       JOIN leads l ON l.id = p.lead_id
       WHERE p.status = 'Active'
       AND p.expiry_date BETWEEN ? AND ?`,
      [now, in90Days]
    );

    for (const policy of expiringPolicies) {
      const daysUntilExpiry = Math.ceil((new Date(policy.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

      const existing = await db.get(
        `SELECT id FROM renewals WHERE policy_id = ? AND status NOT IN ('declined')`,
        [policy.id]
      );
      if (existing) continue;

      const result = await db.run(
        `INSERT INTO renewals (policy_id, lead_id, status, created_at, updated_at)
         VALUES (?, ?, 'pending', ?, ?)`,
        [policy.id, policy.lead_id, now, now]
      );

      actions.push({
        type: 'renewal_created',
        policyId: policy.id,
        renewalId: result.lastInsertRowid,
        daysUntilExpiry
      });

      if (daysUntilExpiry <= 30) {
        const channel = policy.phone ? 'whatsapp' : 'email';
        await this.sendReminder(result.lastInsertRowid, channel, db);
        actions.push({ type: 'reminder_sent', policyId: policy.id, renewalId: result.lastInsertRowid });
      }

      if (daysUntilExpiry <= 7) {
        actions.push({
          type: 'escalated',
          policyId: policy.id,
          renewalId: result.lastInsertRowid,
          advisorId: policy.assigned_agent
        });
      }
    }

    return actions;
  }

  async triggerReassessment(policyId, db) {
    const policy = await db.get(
      `SELECT p.*, l.assessment_id FROM policies p JOIN leads l ON l.id = p.lead_id WHERE p.id = ?`,
      [policyId]
    );
    if (!policy) throw new Error(`Policy ${policyId} not found`);

    const originalAssessment = await db.get(
      `SELECT id, type FROM assessments WHERE id = ?`,
      [policy.assessment_id]
    );

    const templateCode = originalAssessment?.type === 'PERSONAL' ? 'family_protection' : 'sme_risk';
    const sessionId = 'REN-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);

    await db.run(
      `INSERT INTO assessment_sessions (id, lead_id, template_code, status, created_at, updated_at)
       VALUES (?, ?, ?, 'new', ?, ?)`,
      [sessionId, policy.lead_id, templateCode, new Date().toISOString(), new Date().toISOString()]
    );

    await db.run(
      `UPDATE renewals SET new_assessment_session_id = ?, status = 'reassessing', updated_at = ? WHERE policy_id = ?`,
      [sessionId, new Date().toISOString(), policyId]
    );

    return { sessionId, assessmentLink: `/assessment/${sessionId}` };
  }

  async generateRenewalProposal(renewalId, db) {
    const renewal = await db.get(
      `SELECT r.*, p.policy_number, p.product, p.premium AS current_premium, p.lead_id, p.expiry_date,
              l.name AS client_name, l.business_name, l.assessment_id
       FROM renewals r
       JOIN policies p ON p.id = r.policy_id
       JOIN leads l ON l.id = r.lead_id
       WHERE r.id = ?`,
      [renewalId]
    );
    if (!renewal) throw new Error(`Renewal ${renewalId} not found`);

    const originalAssessment = await db.get(
      `SELECT * FROM assessments WHERE id = ?`,
      [renewal.assessment_id]
    );

    let newScore = null;
    if (renewal.new_assessment_session_id) {
      const session = await db.get(
        `SELECT score_payload FROM assessment_sessions WHERE id = ? AND status = 'completed'`,
        [renewal.new_assessment_session_id]
      );
      if (session?.score_payload) {
        const payload = typeof session.score_payload === 'string'
          ? JSON.parse(session.score_payload)
          : session.score_payload;
        newScore = payload.score || payload.overall_score;
      }
    }

    const oldScore = originalAssessment?.score || 50;
    const effectiveScore = newScore || oldScore;
    const scoreChange = effectiveScore - oldScore;

    const basePremium = renewal.current_premium || 0;
    const adjustmentFactor = 1 - (scoreChange / 100) * 0.3;
    const newPremium = Math.round(basePremium * Math.max(0.7, Math.min(1.3, adjustmentFactor)));

    const now = new Date().toISOString();

    const assessmentData = {
      name: renewal.client_name,
      business_name: renewal.business_name,
      score: effectiveScore,
      risk_level: effectiveScore < 40 ? 'High' : effectiveScore < 70 ? 'Moderate' : 'Low',
      scored_pillars: originalAssessment?.answers ? { overall: effectiveScore } : {}
    };

    const products = [{
      product: renewal.product,
      reason: 'Renewal of existing policy',
      estimatedPremium: { min: newPremium, max: newPremium }
    }];

    const proposal = generateProposal(assessmentData, products, {});

    await db.run(
      `UPDATE renewals SET new_premium = ?, status = 'proposal_generated', updated_at = ? WHERE id = ?`,
      [newPremium, now, renewalId]
    );

    return {
      renewalId,
      policyNumber: renewal.policy_number,
      oldPremium: basePremium,
      newPremium,
      scoreChange,
      proposalNumber: proposal.proposalNumber,
      proposalUrl: proposal.pdfUrl || proposal.htmlUrl,
      assessmentData
    };
  }

  async sendReminder(renewalId, channel, db) {
    const renewal = await db.get(
      `SELECT r.*, p.policy_number, p.product, p.expiry_date, p.premium,
              l.name AS client_name, l.phone, l.email, l.business_name
       FROM renewals r
       JOIN policies p ON p.id = r.policy_id
       JOIN leads l ON l.id = r.lead_id
       WHERE r.id = ?`,
      [renewalId]
    );
    if (!renewal) throw new Error(`Renewal ${renewalId} not found`);

    const daysUntilExpiry = Math.ceil((new Date(renewal.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

    const message = prompts.renderPrompt('RENEWAL', {
      clientName: renewal.client_name,
      policyNumber: renewal.policy_number,
      productName: renewal.product,
      expiryDate: renewal.expiry_date,
      newPremium: renewal.new_premium || renewal.premium,
      daysUntilExpiry
    });

    if (channel === 'whatsapp' && renewal.phone) {
      const { sendWhatsApp } = require('../services/whatsappService');
      await sendWhatsApp(renewal.phone, null, { _message: message });
    } else if (renewal.email) {
      const { sendEmail } = require('../services/emailService');
      await sendEmail({
        to: renewal.email,
        subject: `Renewal Reminder: ${renewal.product}`,
        text: message
      });
    }

    const now = new Date().toISOString();
    await db.run(
      `UPDATE renewals SET reminder_sent_at = ?, reminder_channel = ?, updated_at = ? WHERE id = ?`,
      [now, channel, now, renewalId]
    );

    return { sent: true, channel, to: renewal.phone || renewal.email, message };
  }

  async processDecision(renewalId, decision, db) {
    const renewal = await db.get(
      `SELECT r.*, p.policy_number, p.product, p.premium, p.expiry_date, p.lead_id, p.id AS policy_id
       FROM renewals r JOIN policies p ON p.id = r.policy_id WHERE r.id = ?`,
      [renewalId]
    );
    if (!renewal) throw new Error(`Renewal ${renewalId} not found`);

    const now = new Date().toISOString();

    if (decision === 'approved') {
      const newPolicyNumber = 'REN-' + renewal.policy_number + '-' + Date.now().toString(36).toUpperCase();
      const newExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const result = await db.run(
        `INSERT INTO policies (lead_id, policy_number, product, premium, status, expiry_date, created_at)
         VALUES (?, ?, ?, ?, 'Active', ?, ?)`,
        [renewal.lead_id, newPolicyNumber, renewal.product, renewal.new_premium || renewal.premium, newExpiry, now]
      );

      await db.run(
        `UPDATE renewals SET status = 'approved', new_policy_id = ?, decision_at = ?, updated_at = ? WHERE id = ?`,
        [result.lastInsertRowid, now, now, renewalId]
      );

      await db.run(
        `INSERT INTO activities (lead_id, title, description, type, created_at) VALUES (?, ?, ?, 'system', ?)`,
        [renewal.lead_id, 'Renewal Approved', `Policy ${renewal.policy_number} renewed as ${newPolicyNumber}`, now]
      );

      return { decision: 'approved', newPolicyNumber, newPolicyId: result.lastInsertRowid };
    }

    await db.run(
      `UPDATE renewals SET status = 'declined', decision_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, renewalId]
    );

    await db.run(
      `INSERT INTO activities (lead_id, title, description, type, created_at) VALUES (?, ?, ?, 'system', ?)`,
      [renewal.lead_id, 'Renewal Declined', `Policy ${renewal.policy_number} renewal was not accepted`, now]
    );

    return { decision: 'declined', policyNumber: renewal.policy_number };
  }

  async getRenewalPipeline(advisorId, db) {
    const renewals = await db.all(
      `SELECT r.*, p.policy_number, p.product, p.premium, p.expiry_date,
              l.name AS client_name, l.phone, l.email, l.business_name, l.assigned_agent
       FROM renewals r
       JOIN policies p ON p.id = r.policy_id
       JOIN leads l ON l.id = r.lead_id
       WHERE (l.assigned_agent = ? OR ? IS NULL)
       AND r.status IN ('pending', 'reassessing', 'proposal_generated')
       ORDER BY p.expiry_date ASC`,
      [advisorId, advisorId]
    );

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    return {
      overdue: renewals.filter(r => new Date(r.expiry_date) < now),
      dueWithin30: renewals.filter(r => {
        const d = new Date(r.expiry_date);
        return d >= now && d <= in30;
      }),
      dueWithin60: renewals.filter(r => {
        const d = new Date(r.expiry_date);
        return d > in30 && d <= in60;
      }),
      dueWithin90: renewals.filter(r => {
        const d = new Date(r.expiry_date);
        return d > in60 && d <= in90;
      })
    };
  }
}

module.exports = new RenewalEngine();
