const express = require('express');
const { run } = require('../config/database');

const router = express.Router();

// Submit quote request
router.post('/quote-request', async (req, res, next) => {
  try {
    const { name, email, phone, businessName, insuranceTypes, estimatedValue, message } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Validation Error', message: 'Name, email, and phone are required' });
    }

    const result = await run(`
      INSERT INTO leads (name, email, phone, business_name, status, notes, entity_type)
      VALUES (?, ?, ?, ?, 'new', ?, ?)
    `, [
      name,
      email,
      phone,
      businessName || null,
      JSON.stringify({ insuranceTypes, estimatedValue, message, source: 'quote_request' }),
      'quote'
    ]);

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
      INSERT INTO leads (name, email, phone, status, notes, entity_type)
      VALUES (?, ?, ?, 'new', ?, ?)
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
      'consultation'
    ]);

    res.status(201).json({
      message: 'Consultation booked successfully',
      leadId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Consultation request error:', error);
    next(error);
  }
});

module.exports = router;
