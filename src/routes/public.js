const express = require('express');
const { run, get } = require('../config/database');
const { sendAdminQuoteNotification, sendAdminConsultationNotification, sendClientConsultationConfirmation } = require('../services/emailService');
const { sendAdminWhatsAppQuoteAlert, sendAdminWhatsAppConsultationAlert, sendClientWhatsAppConsultationConfirmation } = require('../services/whatsappService');

const router = express.Router();

// Submit quote request
router.post('/quote-request', async (req, res, next) => {
  try {
    const { name, email, phone, businessName, insuranceTypes, estimatedValue, message } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Validation Error', message: 'Name, email, and phone are required' });
    }

    const result = await run(`
      INSERT INTO leads (name, email, phone, business_name, status, notes, entity_type, contact_person)
      VALUES (?, ?, ?, ?, 'New Lead', ?, ?, ?)
    `, [
      businessName ? businessName : name,
      email,
      phone,
      businessName || null,
      JSON.stringify({ insuranceTypes, estimatedValue, message, source: 'quote_request' }),
      'quote',
      name
    ]);

    // Send notifications to Admin
    const leadData = { name, email, phone, businessName, insuranceTypes, estimatedValue, message };
    sendAdminQuoteNotification(leadData).catch(err => console.error('Admin email failed:', err));
    sendAdminWhatsAppQuoteAlert(leadData).catch(err => console.error('Admin WhatsApp failed:', err));

    res.status(201).json({
      message: 'Quote request submitted successfully',
      leadId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Quote request error:', error);
    next(error);
  }
});

// Book consultation
router.post('/consultation-request', async (req, res, next) => {
  try {
    const { name, email, phone, consultationType, consultationDate, consultationTime, message } = req.body;

    if (!name || !email || !phone || !consultationType || !consultationDate || !consultationTime) {
      return res.status(400).json({ error: 'Validation Error', message: 'All fields are required' });
    }

    const result = await run(`
      INSERT INTO leads (name, email, phone, status, notes, entity_type, contact_person)
      VALUES (?, ?, ?, 'New Lead', ?, ?, ?)
    `, [
      name,
      email,
      phone,
      JSON.stringify({
        consultationType,
        consultationDate,
        consultationTime,
        message,
        source: 'consultation_request'
      }),
      'consultation',
      name
    ]);

    // Fetch admin meet link
    const adminUser = await get('SELECT meet_link FROM users WHERE role = "admin" LIMIT 1');
    const meetLink = adminUser ? adminUser.meet_link : null;

    // Send notifications to Admin
    const leadData = { name, email, phone, consultationType, consultationDate, consultationTime, message };
    sendAdminConsultationNotification(leadData).catch(err => console.error('Admin email failed:', err));
    sendAdminWhatsAppConsultationAlert(leadData).catch(err => console.error('Admin WhatsApp failed:', err));

    // Send confirmation to Client
    sendClientConsultationConfirmation(leadData, meetLink).catch(err => console.error('Client email failed:', err));
    sendClientWhatsAppConsultationConfirmation(leadData, meetLink).catch(err => console.error('Client WhatsApp failed:', err));

    res.status(201).json({
      message: 'Consultation booked successfully',
      leadId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Consultation request error:', error);
    next(error);
  }
});

// Track landing page events
router.post('/landing-event', async (req, res, next) => {
  try {
    const { 
      event_name, landing_page, cta_position, session_key, 
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, 
      campaign_code, referral_code, device_type, metadata 
    } = req.body;

    if (!event_name || !landing_page) {
      return res.status(400).json({ error: 'Validation Error', message: 'event_name and landing_page are required' });
    }

    const payload = JSON.stringify(metadata || {});

    await run(`
      INSERT INTO landing_page_events 
      (session_key, event_name, landing_page, cta_position, utm_source, utm_medium, utm_campaign, utm_content, utm_term, campaign_code, referral_code, device_type, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)
    `, [
      session_key, event_name, landing_page, cta_position,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      campaign_code, referral_code, device_type, payload
    ]);

    res.status(201).json({ message: 'Event logged successfully' });
  } catch (error) {
    console.error('Landing event error:', error);
    // Don't fail the client request if tracking fails
    res.status(200).json({ message: 'Event tracked (with internal error)' });
  }
});

module.exports = router;
