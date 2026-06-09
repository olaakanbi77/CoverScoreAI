/**
 * WhatsApp Routes - CoverScore AI
 * Handles WhatsApp messaging via Africastalking
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireAgent } = require('../middleware/rbac');
const { run, get } = require('../config/database');
const {
  sendWhatsApp,
  sendAssessmentComplete,
  sendLeadContacted,
  sendLeadConverted,
  sendFollowUpReminder,
  sendHighRiskAlert
} = require('../services/whatsappService');

const router = express.Router();

// Send WhatsApp message to a lead
router.post('/send',
  authenticate,
  requireAgent,
  body('leadId').isInt(),
  body('template').isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: errors.array()[0].msg });
      }

      const { leadId, template, customData } = req.body;

      const lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
      if (!lead) {
        return res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      }

      if (!lead.phone) {
        return res.status(400).json({ error: 'Bad Request', message: 'Lead has no phone number' });
      }

      const data = {
        name: lead.name,
        ...customData
      };

      const result = await sendWhatsApp(lead.phone, template, data);

      // Log the message
      if (result.success) {
        await run(`
          UPDATE leads SET notes = COALESCE(notes, '') || ? WHERE id = ?
        `, [`\n[${new Date().toISOString()}] WhatsApp (${template}): Sent to ${lead.phone}`, leadId]);
      }

      res.json({
        success: result.success,
        message: result.success ? 'WhatsApp message sent' : 'Failed to send',
        error: result.error
      });
    } catch (error) {
      next(error);
    }
  }
);

// Send assessment complete notification to lead
router.post('/assessment-complete/:assessmentId',
  async (req, res, next) => {
    try {
      const { assessmentId } = req.params;
      const { leadId } = req.body;

      let lead;
      if (leadId) {
        lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
      }

      if (!lead) {
        return res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      }

      const assessment = await get('SELECT * FROM assessments WHERE id = ?', [assessmentId || lead.assessment_id]);
      if (!assessment) {
        return res.status(404).json({ error: 'Not Found', message: 'Assessment not found' });
      }

      const result = await sendAssessmentComplete(lead, assessment);

      res.json({
        success: result.success,
        message: result.success ? 'Notification sent' : 'Failed to send',
        error: result.error
      });
    } catch (error) {
      next(error);
    }
  }
);

// Notify lead that agent is reaching out
router.post('/lead-contacted/:leadId',
  authenticate,
  requireAgent,
  async (req, res, next) => {
    try {
      const { leadId } = req.params;

      const lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
      if (!lead) {
        return res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      }

      const result = await sendLeadContacted(lead);

      res.json({
        success: result.success,
        message: result.success ? 'Notification sent' : 'Failed to send',
        error: result.error
      });
    } catch (error) {
      next(error);
    }
  }
);

// Notify lead of conversion
router.post('/lead-converted/:leadId',
  authenticate,
  requireAgent,
  async (req, res, next) => {
    try {
      const { leadId } = req.params;

      const lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
      if (!lead) {
        return res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      }

      const result = await sendLeadConverted(lead);

      res.json({
        success: result.success,
        message: result.success ? 'Notification sent' : 'Failed to send',
        error: result.error
      });
    } catch (error) {
      next(error);
    }
  }
);

// Send follow-up reminder to lead
router.post('/follow-up/:leadId',
  authenticate,
  requireAgent,
  async (req, res, next) => {
    try {
      const { leadId } = req.params;

      const lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
      if (!lead) {
        return res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      }

      const result = await sendFollowUpReminder(lead);

      res.json({
        success: result.success,
        message: result.success ? 'Reminder sent' : 'Failed to send',
        error: result.error
      });
    } catch (error) {
      next(error);
    }
  }
);

// Webhook for incoming WhatsApp messages (Africastalking callback)
router.post('/webhook', async (req, res) => {
  try {
    const { from, to, text, linkId } = req.body;

    console.log(`📩 WhatsApp incoming from ${from}: ${text}`);

    // Handle incoming messages
    // In production, you would parse commands like "STATUS", "HELP", etc.

    // Auto-reply for now
    const reply = `Thank you for messaging CoverScore AI! 👋

For immediate assistance:
• View your report: ${process.env.APP_URL || 'http://localhost:3016'}
• Book consultation: ${process.env.APP_URL || 'http://localhost:3016'}/consultation
• Request quote: ${process.env.APP_URL || 'http://localhost:3016'}/quote

Our team will respond shortly!`;

    // Send auto-reply
    if (from && text) {
      await sendWhatsApp(from, null, {
        name: 'Friend',
        _message: reply
      });
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Webhook error' });
  }
});

// Proxy to get QR code from Evolution API
router.get('/qr', async (req, res, next) => {
  try {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const instance = process.env.EVOLUTION_API_INSTANCE;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!apiUrl || !instance || !apiKey) {
      return res.json({ success: false, message: 'WhatsApp API not configured' });
    }

    const response = await fetch(`${apiUrl}/instance/connect/${instance}`, {
      headers: { 'apikey': apiKey }
    });
    const data = await response.json();

    // Evolution API can return QR in various formats
    const qr = data.base64 || data.qrcode || null;
    const connected = data.status === 'connected' || (!qr && data.status);

    res.json({
      success: true,
      qr: qr ? (qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`) : null,
      connected,
      message: connected ? 'WhatsApp is connected' : qr ? 'QR code ready' : 'No QR code available',
      raw: process.env.NODE_ENV === 'development' ? data : undefined
    });
  } catch (error) {
    res.json({
      success: false,
      qr: null,
      connected: false,
      message: `Connection error: ${error.message}`
    });
  }
});

// Get available message templates
router.get('/templates', authenticate, (req, res) => {
  const { templates } = require('../services/whatsappService');
  res.json({
    templates: Object.keys(templates).map(key => ({
      key,
      title: templates[key].title
    }))
  });
});

module.exports = router;