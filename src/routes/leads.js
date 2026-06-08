const express = require('express');
const { body, validationResult } = require('express-validator');
const { db, run, get, all } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAgent } = require('../middleware/rbac');
const { sendLeadContacted, sendLeadConverted, sendAdminWhatsAppQuoteAlert, sendAdminWhatsAppConsultationAlert } = require('../services/whatsappService');
const { sendAdminQuoteNotification, sendAdminConsultationNotification } = require('../services/emailService');

const router = express.Router();

router.get('/', authenticate, requireAgent, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { risk_level, industry, status, search, entity_type } = req.query;

    let whereClause = '1=1';
    const params = [];

    if (risk_level) {
      whereClause += ' AND l.risk_level = ?';
      params.push(risk_level);
    }

    if (industry) {
      whereClause += ' AND u.industry = ?';
      params.push(industry);
    }

    if (status) {
      whereClause += ' AND l.status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += ' AND (l.name LIKE ? OR l.email LIKE ? OR l.business_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (entity_type) {
      whereClause += ' AND l.entity_type = ?';
      params.push(entity_type);
    }

    const baseQuery = `
      SELECT l.*, COALESCE(u.industry, JSON_EXTRACT(a.answers, '$.business.industry')) as industry, a.answers, a.ai_report
      FROM leads l
      LEFT JOIN assessments a ON l.assessment_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE ${whereClause}
    `;

    const leads = await all(`${baseQuery} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    const totalResult = await get(`SELECT COUNT(*) as count FROM leads l LEFT JOIN assessments a ON l.assessment_id = a.id LEFT JOIN users u ON a.user_id = u.id WHERE ${whereClause}`, params);

    res.json({
      leads: leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        businessName: lead.business_name,
        score: lead.score,
        riskLevel: lead.risk_level,
        industry: lead.industry,
        status: lead.status,
        entity_type: lead.entity_type || 'business',
        notes: lead.notes,
        estimatedPremium: lead.estimated_premium || 0,
        assignedAgent: lead.assigned_agent || '',
        createdAt: lead.created_at,
        updatedAt: lead.updated_at
      })),
      pagination: {
        page,
        limit,
        total: totalResult.count,
        totalPages: Math.ceil(totalResult.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, requireAgent, async (req, res, next) => {
  try {
    const lead = await get(`
      SELECT l.*, a.answers, a.ai_report, a.score as assessment_score, a.risk_level as assessment_risk
      FROM leads l
      LEFT JOIN assessments a ON l.assessment_id = a.id
      WHERE l.id = ?
    `, [req.params.id]);

    if (!lead) {
      return res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
    }

    let answers = null;
    let aiReport = null;
    
    if (lead.answers) {
      try {
        answers = JSON.parse(lead.answers);
      } catch (e) {
        console.error(`Error parsing assessment answers for lead ${lead.id}:`, e.message);
      }
    }

    if (lead.ai_report) {
      try {
        aiReport = JSON.parse(lead.ai_report);
      } catch (e) {
        console.error(`Error parsing AI report for lead ${lead.id}:`, e.message);
      }
    }

    res.json({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      businessName: lead.business_name,
      score: lead.score,
      riskLevel: lead.risk_level,
      entity_type: lead.entity_type || 'business',
      status: lead.status,
      notes: lead.notes,
      estimatedPremium: lead.estimated_premium || 0,
      assignedAgent: lead.assigned_agent || '',
      industry: lead.industry || 'other',
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      chatHistory: lead.chat_history ? JSON.parse(lead.chat_history) : [],
      assessment: answers ? {
        score: lead.assessment_score,
        riskLevel: lead.assessment_risk,
        answers,
        aiReport
      } : null,
      tasks: await all('SELECT * FROM tasks WHERE lead_id = ? ORDER BY due_date ASC', [lead.id]),
      activities: await all('SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC', [lead.id])
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status',
  authenticate,
  requireAgent,
  body('status').isIn(['New Lead', 'Report Sent', 'WhatsApp Engaged', 'Qualified', 'Consultation Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: 'Invalid status' });
      }

      const { status, sendWhatsApp: shouldNotify } = req.body;

      const lead = await get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
      if (!lead) {
        return res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      }

      const statusStageMap = {
        'New Lead': 1,
        'WhatsApp Engaged': 2,
        'Report Sent': 3,
        'Qualified': 3,
        'Consultation Scheduled': 4,
        'Proposal Sent': 5,
        'Negotiation': 5,
        'Won': 6,
        'Lost': 6
      };
      const pipelineStage = statusStageMap[status] || 1;

      await run('UPDATE leads SET status = ?, pipeline_stage = ?, updated_at = datetime("now") WHERE id = ?', [status, pipelineStage, req.params.id]);

      // Send WhatsApp notification on status change (if enabled)
      if (shouldNotify !== false && lead.phone) {
        try {
          if (status === 'contacted') {
            await sendLeadContacted(lead);
          } else if (status === 'converted') {
            await sendLeadConverted(lead);
          }
        } catch (waError) {
          console.error('WhatsApp notification failed:', waError.message);
          // Don't fail the request if WhatsApp fails
        }
      }

      res.json({ message: 'Status updated', status });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id/notes',
  authenticate,
  requireAgent,
  body('notes').isString(),
  async (req, res, next) => {
    try {
      const { notes } = req.body;

      const lead = await get('SELECT id FROM leads WHERE id = ?', [req.params.id]);
      if (!lead) {
        return res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      }

      await run('UPDATE leads SET notes = ?, updated_at = datetime("now") WHERE id = ?', [notes, req.params.id]);

      res.json({ message: 'Notes updated' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', authenticate, requireAgent, async (req, res, next) => {
  try {
    const lead = await get('SELECT id FROM leads WHERE id = ?', [req.params.id]);
    if (!lead) {
      return res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
    }

    await run('DELETE FROM leads WHERE id = ?', [req.params.id]);

    res.json({ message: 'Lead deleted' });
  } catch (error) {
    next(error);
  }
});

// Public route: Submit quote request
router.post('/quote-request', async (req, res, next) => {
  try {
    console.log('Quote request body:', req.body);
    const { name, email, phone, businessName, insuranceTypes, estimatedValue, message } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Validation Error', message: 'Name, email, and phone are required' });
    }

    const result = await run(`
      INSERT INTO leads (name, email, phone, business_name, status, notes, entity_type)
      VALUES (?, ?, ?, ?, 'New Lead', ?, 'quote')
    `, [
      name,
      email,
      phone,
      businessName || null,
      JSON.stringify({ insuranceTypes, estimatedValue, message, source: 'quote_request' }),
      'quote'
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

// Public route: Book consultation
router.post('/consultation-request', async (req, res, next) => {
  try {
    const { name, email, phone, consultationType, consultationDate, consultationTime, message } = req.body;

    if (!name || !email || !phone || !consultationType || !consultationDate || !consultationTime) {
      return res.status(400).json({ error: 'Validation Error', message: 'Name, email, phone, consultation type, date, and time are required' });
    }

    const result = await run(`
      INSERT INTO leads (name, email, phone, status, notes, entity_type, pipeline_stage)
      VALUES (?, ?, ?, 'Consultation Scheduled', ?, 'consultation', 4)
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

    // Send notifications to Admin
    const leadData = { name, email, phone, consultationType, consultationDate, consultationTime, message };
    sendAdminConsultationNotification(leadData).catch(err => console.error('Admin email failed:', err));
    sendAdminWhatsAppConsultationAlert(leadData).catch(err => console.error('Admin WhatsApp failed:', err));

    res.status(201).json({
      message: 'Consultation booked successfully',
      leadId: result.lastInsertRowid
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/leads - Manually create a new lead
router.post('/', authenticate, requireAgent, async (req, res, next) => {
  try {
    const { name, email, phone, businessName, status, notes, estimatedPremium, assignedAgent, industry } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Validation Error', message: 'Name and email are required' });
    }

    const statusStageMap = {
      'New Lead': 1,
      'WhatsApp Engaged': 2,
      'Report Sent': 3,
      'Qualified': 3,
      'Consultation Scheduled': 4,
      'Proposal Sent': 5,
      'Negotiation': 5,
      'Won': 6,
      'Lost': 6
    };
    const pipelineStage = statusStageMap[status || 'New Lead'] || 1;

    const result = await run(`
      INSERT INTO leads (
        name, email, phone, business_name, status, notes, 
        estimated_premium, assigned_agent, industry, pipeline_stage, entity_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
    `, [
      name, 
      email, 
      phone || null, 
      businessName || null, 
      status || 'New Lead', 
      notes || null, 
      estimatedPremium || 0, 
      assignedAgent || 'General Agent', 
      industry || 'other', 
      pipelineStage
    ]);

    res.status(201).json({ message: 'Lead created successfully', leadId: result.lastInsertRowid });
  } catch (err) {
    next(err);
  }
});

// PUT /api/leads/:id - Update lead details
router.put('/:id', authenticate, requireAgent, async (req, res, next) => {
  try {
    const { name, email, phone, businessName, status, notes, estimatedPremium, assignedAgent, industry } = req.body;

    const lead = await get('SELECT id FROM leads WHERE id = ?', [req.params.id]);
    if (!lead) {
      return res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
    }

    let queryParts = [];
    let params = [];

    if (name !== undefined) { queryParts.push('name = ?'); params.push(name); }
    if (email !== undefined) { queryParts.push('email = ?'); params.push(email); }
    if (phone !== undefined) { queryParts.push('phone = ?'); params.push(phone); }
    if (businessName !== undefined) { queryParts.push('business_name = ?'); params.push(businessName); }
    if (notes !== undefined) { queryParts.push('notes = ?'); params.push(notes); }
    if (estimatedPremium !== undefined) { queryParts.push('estimated_premium = ?'); params.push(estimatedPremium); }
    if (assignedAgent !== undefined) { queryParts.push('assigned_agent = ?'); params.push(assignedAgent); }
    if (industry !== undefined) { queryParts.push('industry = ?'); params.push(industry); }
    
    if (status !== undefined) {
      queryParts.push('status = ?');
      params.push(status);
      
      const statusStageMap = {
        'New Lead': 1,
        'WhatsApp Engaged': 2,
        'Report Sent': 3,
        'Qualified': 3,
        'Consultation Scheduled': 4,
        'Proposal Sent': 5,
        'Negotiation': 5,
        'Won': 6,
        'Lost': 6
      };
      const pipelineStage = statusStageMap[status] || 1;
      queryParts.push('pipeline_stage = ?');
      params.push(pipelineStage);
    }

    queryParts.push('updated_at = datetime("now")');

    if (queryParts.length > 1) { // more than just updated_at
      await run(`
        UPDATE leads 
        SET ${queryParts.join(', ')}
        WHERE id = ?
      `, [...params, req.params.id]);
    }

    res.json({ message: 'Lead updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
