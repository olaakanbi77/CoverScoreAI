const { db, run, get, all } = require('../config/database');
const { sendEmail } = require('./emailService');
const { sendWhatsApp } = require('./whatsappService');

async function enrollLead(leadId, triggerEvent = 'not_now') {
  const campaign = await get('SELECT * FROM nurture_campaigns WHERE trigger_event = ? AND status = "active" ORDER BY id LIMIT 1', [triggerEvent]);
  if (!campaign) return null;

  const messages = await all('SELECT * FROM nurture_messages WHERE campaign_id = ? ORDER BY step_order', [campaign.id]);
  if (!messages.length) return null;

  await run('UPDATE leads SET nurture_campaign_id = ?, nurture_stage = 0, nurture_status = "enrolled" WHERE id = ?', [campaign.id, leadId]);

  for (const msg of messages) {
    const scheduledAt = new Date(Date.now() + msg.delay_days * 24 * 60 * 60 * 1000).toISOString();
    await run(
      `INSERT INTO nurture_queue (lead_id, campaign_id, message_id, step_order, channel, subject, body, scheduled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [leadId, campaign.id, msg.id, msg.step_order, msg.channel, msg.subject, msg.body, scheduledAt]
    );
  }

  return campaign;
}

async function processNurtureQueue() {
  const pending = await all(
    "SELECT nq.*, l.name as lead_name, l.email, l.phone, l.score, l.risk_level FROM nurture_queue nq JOIN leads l ON nq.lead_id = l.id WHERE nq.status = 'pending' AND nq.scheduled_at <= datetime('now') ORDER BY nq.scheduled_at LIMIT 50"
  );

  for (const item of pending) {
    try {
      const lead = await get('SELECT * FROM leads WHERE id = ?', [item.lead_id]);
      const leadName = lead?.name || 'Valued Customer';
      const score = lead?.score || '--';
      const riskLevel = lead?.risk_level || 'N/A';
      const gapCount = lead?.recommended_covers ? JSON.parse(lead.recommended_covers || '[]').length : 0;
      const potentialIncrease = Math.min(30, Math.max(5, Math.round((100 - (score === '--' ? 50 : score)) / 4)));

      const bookingLink = `${process.env.APP_URL || 'http://localhost:3016'}/consultation?lead=${item.lead_id}`;
      const retakeLink = `${process.env.APP_URL || 'http://localhost:3016'}/assessment/start?lead=${item.lead_id}`;

      const topRisks = '• Inadequate emergency savings\n• Insufficient life cover\n• No health protection plan';

      let body = item.body
        .replace(/\{\{name\}\}/g, leadName)
        .replace(/\{\{score\}\}/g, score)
        .replace(/\{\{riskLevel\}\}/g, riskLevel)
        .replace(/\{\{gapCount\}\}/g, gapCount)
        .replace(/\{\{potentialIncrease\}\}/g, potentialIncrease)
        .replace(/\{\{topRisks\}\}/g, topRisks)
        .replace(/\{\{bookingLink\}\}/g, bookingLink)
        .replace(/\{\{retakeLink\}\}/g, retakeLink);

      if (item.channel === 'email' && item.subject) {
        const result = await sendEmail({ to: item.email, subject: item.subject, html: body.replace(/\n/g, '<br>') });
        await run('UPDATE nurture_queue SET sent_at = datetime("now"), status = ?, error = ? WHERE id = ?',
          [result.success ? 'sent' : 'failed', result.error || null, item.id]);
      } else if (item.channel === 'whatsapp' && lead?.phone) {
        const result = await sendWhatsApp(lead.phone, null, { _message: body });
        await run('UPDATE nurture_queue SET sent_at = datetime("now"), status = ? WHERE id = ?',
          ['sent', item.id]);
      } else {
        await run('UPDATE nurture_queue SET sent_at = datetime("now"), status = "skipped" WHERE id = ?', [item.id]);
      }

      if (item.step_order) {
        await run('UPDATE leads SET nurture_stage = ? WHERE id = ?', [item.step_order, item.lead_id]);
      }
    } catch (err) {
      console.error(`Nurture queue processing failed for message ${item.id}:`, err.message);
      await run('UPDATE nurture_queue SET status = "failed", error = ? WHERE id = ?', [err.message, item.id]);
    }
  }

  return pending.length;
}

async function getNurtureStatus(leadId) {
  return get(`
    SELECT l.nurture_campaign_id, l.nurture_stage, l.nurture_status,
           nc.name as campaign_name,
           (SELECT COUNT(*) FROM nurture_queue WHERE lead_id = ? AND status = 'sent') as messages_sent,
           (SELECT COUNT(*) FROM nurture_queue WHERE lead_id = ? AND status = 'pending') as messages_pending
    FROM leads l
    LEFT JOIN nurture_campaigns nc ON l.nurture_campaign_id = nc.id
    WHERE l.id = ?
  `, [leadId, leadId, leadId]);
}

module.exports = { enrollLead, processNurtureQueue, getNurtureStatus };