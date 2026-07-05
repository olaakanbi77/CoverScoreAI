/**
 * WhatsApp Routes - CoverScore AI
 * Handles WhatsApp messaging via Africastalking
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireAgent } = require('../middleware/rbac');
const { run, get } = require('../config/database');
const fetch = require('node-fetch');
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
        let chatHistory = [];
        try {
          if (lead.chat_history) chatHistory = JSON.parse(lead.chat_history);
        } catch(e) {}
        
        chatHistory.push({
          role: 'assistant',
          content: result.messageBody || customData._message || `[Template: ${template}]`,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });

        await run(`
          UPDATE leads SET notes = COALESCE(notes, '') || ?, chat_history = ? WHERE id = ?
        `, [`\n[${new Date().toISOString()}] WhatsApp (${template}): Sent to ${lead.phone}`, JSON.stringify(chatHistory), leadId]);
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

// Check WhatsApp connection status and get QR code
router.get('/qr', async (req, res, next) => {
  try {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const instanceName = process.env.EVOLUTION_API_INSTANCE;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!apiUrl || !instanceName || !apiKey) {
      return res.json({ success: false, qr: null, connected: false, message: 'WhatsApp API not configured on server' });
    }

    // Step 1: Check connection state
    const stateRes = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': apiKey }, timeout: 10000
    });
    const stateData = await stateRes.json();
    const instanceState = stateData?.instance?.state || stateData?.state || '';

    // In Evolution API v2: "open" = connected, "connecting" = in progress, "closed" = disconnected
    if (instanceState === 'open') {
      // Fetch instance details for profile info
      const infoRes = await fetch(`${apiUrl}/instance/fetchInstances`, {
        headers: { 'apikey': apiKey }, timeout: 10000
      });
      const infoData = await infoRes.json();
      const inst = Array.isArray(infoData) ? infoData.find(i => i.name === instanceName) : null;

      return res.json({
        success: true,
        qr: null,
        connected: true,
        profileName: inst?.profileName || null,
        ownerJid: inst?.ownerJid || null,
        message: 'WhatsApp is connected'
      });
    }

    // Step 2: Not connected — try to get QR code
    if (instanceState === 'closed' || instanceState === '' || instanceState === 'connecting') {
      const connectRes = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
        headers: { 'apikey': apiKey }, timeout: 15000
      });

      const contentType = connectRes.headers.get('content-type') || '';

      // Some versions return the QR directly as an image
      if (contentType.startsWith('image/')) {
        const buffer = await connectRes.buffer();
        const base64 = buffer.toString('base64');
        return res.json({
          success: true,
          qr: `data:${contentType};base64,${base64}`,
          connected: false,
          message: 'Scan QR code with WhatsApp'
        });
      }

      const text = await connectRes.text();
      let data;
      try { data = JSON.parse(text); } catch (e) {
        return res.json({ success: false, qr: null, connected: false, message: `Unexpected API response (${connectRes.status})` });
      }

      // Extract QR from various possible response formats
      const qr = data.base64 || data.qrcode || data.qr || data.image || null;
      if (qr) {
        return res.json({
          success: true,
          qr: qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`,
          connected: false,
          message: 'Scan QR code with WhatsApp'
        });
      }

      // Connect returned state info (no QR available yet) — check if "open" now
      if (data?.instance?.state === 'open') {
        return res.json({ success: true, qr: null, connected: true, message: 'WhatsApp is connected' });
      }

      return res.json({
        success: false, qr: null, connected: false,
        message: instanceState === 'connecting'
          ? 'WhatsApp is still connecting. Try again shortly.'
          : 'No QR code available. Ensure the instance is properly configured.'
      });
    }

    // Unknown state
    res.json({ success: false, qr: null, connected: false, message: `Unexpected state: ${instanceState}` });
  } catch (error) {
    const message = error.code === 'ECONNREFUSED'
      ? 'WhatsApp API server is not running'
      : error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED'
        ? 'WhatsApp API connection timed out'
        : `Error: ${error.message}`;
    res.json({ success: false, qr: null, connected: false, message });
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