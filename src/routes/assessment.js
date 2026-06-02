const express = require('express');
const { body, validationResult } = require('express-validator');
const { db, run, get, all } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { calculateScore } = require('../services/scoringEngine');
const { generateRiskReport, generateExplanations } = require('../services/aiService');
const { sendAssessmentReport } = require('../services/emailService');
const { sendAssessmentComplete } = require('../services/whatsappService');
const { getIndustryRisks } = require('../services/industryIntelligence');

const router = express.Router();

const businessSections = ['type', 'profile', 'property', 'business_interruption', 'employee_risk', 'liability', 'vehicle', 'cyber', 'claims'];
const individualSections = ['type', 'personal_profile', 'family_protection', 'health_protection', 'home_risk', 'motor_risk', 'financial_resilience'];
const allValidSections = [...new Set([...businessSections, ...individualSections])];

const getRequiredSections = (answers) => {
  if (answers && answers.type && answers.type.entity_type === 'individual') {
    return individualSections;
  }
  return businessSections;
};

router.get('/start', optionalAuth, async (req, res, next) => {
  try {
    let existing;
    if (req.user) {
      existing = await get('SELECT id, answers FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    } else if (req.query.assessmentId) {
      existing = await get('SELECT id, answers FROM assessments WHERE id = ?', [req.query.assessmentId]);
    }

    let progress = { currentStep: 0, completedSections: [] };
    let assessmentId = null;

    if (existing && existing.answers) {
      try {
        const answers = JSON.parse(existing.answers);
        const required = getRequiredSections(answers);
        const completedSections = required.filter(s => answers[s] && Object.keys(answers[s]).length > 0);
        progress.completedSections = completedSections;
        progress.currentStep = completedSections.length;
        assessmentId = existing.id;
      } catch (e) {}
    }

    res.json({
      message: 'Assessment ready',
      assessmentId,
      progress,
      sections: allValidSections
    });
  } catch (error) {
    next(error);
  }
});

router.post('/section',
  optionalAuth,
  body('section').isIn(allValidSections),
  body('data').isObject(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: errors.array()[0].msg });
      }

      const { section, data, assessmentId } = req.body;

      let assessment;
      if (req.user) {
        assessment = await get('SELECT id, answers FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
      } else if (assessmentId) {
        assessment = await get('SELECT id, answers FROM assessments WHERE id = ?', [assessmentId]);
      }

      let answers = {};
      if (assessment && assessment.answers) {
        try {
          answers = JSON.parse(assessment.answers);
        } catch (e) {
          answers = {};
        }
      }

      answers[section] = data;

      if (!assessment) {
        const userId = req.user ? req.user.id : null;
        const result = await run('INSERT INTO assessments (user_id, answers, score, risk_level) VALUES (?, ?, 0, "low")', [userId, JSON.stringify(answers)]);
        assessment = { id: result.lastInsertRowid };
      } else {
        await run('UPDATE assessments SET answers = ? WHERE id = ?', [JSON.stringify(answers), assessment.id]);
      }

      const required = getRequiredSections(answers);
      const nextStep = required.indexOf(section) + 1;
      const completedSections = required.filter(s => answers[s] && Object.keys(answers[s]).length > 0);

      res.json({
        message: 'Section saved',
        assessmentId: assessment.id,
        nextStep: nextStep < required.length ? nextStep : null,
        isComplete: completedSections.length === required.length,
        completedSections
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/submit', optionalAuth, async (req, res, next) => {
  try {
    const { assessmentId } = req.body;
    let assessment;

    if (req.user) {
      assessment = await get('SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    } else if (assessmentId) {
      assessment = await get('SELECT * FROM assessments WHERE id = ?', [assessmentId]);
    }

    if (!assessment || !assessment.answers) {
      return res.status(400).json({ error: 'Bad Request', message: 'No assessment found' });
    }

    const answers = JSON.parse(assessment.answers);
    const required = getRequiredSections(answers);
    const entityType = answers?.type?.entity_type || 'business';

    const allSectionsComplete = required.every(s => answers[s] && Object.keys(answers[s]).length > 0);
    if (!allSectionsComplete) {
      return res.status(400).json({ error: 'Bad Request', message: 'Please complete all sections' });
    }

    const { score, riskLevel, recommendations, min_loss, max_loss } = calculateScore(answers);

    let aiReport = null;
    let explanations = null;
    try {
      // Generate both the detailed AI report and humanized explanations
      const [report, explanationLayer] = await Promise.all([
        generateRiskReport({
          answers,
          score,
          riskLevel,
          entityType,
          user: req.user || { name: 'Guest User', business_name: answers.business?.name || 'Prospect' }
        }),
        generateExplanations({
          answers,
          score,
          riskLevel,
          entityType,
          user: req.user || { name: 'Guest User', business_name: answers.business?.name || 'Prospect' }
        })
      ]);

      aiReport = report;
      explanations = explanationLayer;
    } catch (e) {
      console.error('AI Report generation failed:', e.message);
    }

    // Store both report and explanations
    const fullReport = {
      ...(aiReport || {}),
      explanations: explanations,
      generatedAt: new Date().toISOString()
    };

    await run('UPDATE assessments SET score = ?, risk_level = ?, ai_report = ? WHERE id = ?', [
      score,
      riskLevel,
      JSON.stringify(fullReport),
      assessment.id
    ]);

    // Create lead if not exists
    let lead = await get('SELECT id, phone, name FROM leads WHERE assessment_id = ?', [assessment.id]);
    if (!lead) {
      const name = req.user ? req.user.name : (answers.business?.contact_name || answers.personal?.name || 'Anonymous');
      const email = req.user ? req.user.email : (answers.business?.contact_email || answers.personal?.email || '');
      const phone = req.user ? req.user.phone : (answers.business?.contact_phone || answers.personal?.phone || '');
      const businessName = entityType === 'business' ? (req.user ? req.user.business_name : (answers.business?.name || '')) : null;

      const result = await run(`
        INSERT INTO leads (name, email, phone, business_name, assessment_id, score, risk_level, status, entity_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)
      `, [
        name,
        email,
        phone,
        businessName,
        assessment.id,
        score,
        riskLevel,
        entityType
      ]);

      lead = { id: result.lastInsertRowid, phone, name };
    }

    // Send WhatsApp notification for completed assessment (if lead has phone)
    if (lead?.phone) {
      try {
        const assessmentData = {
          id: assessment.id,
          score,
          risk_level: riskLevel,
          min_loss,
          max_loss
        };
        await sendAssessmentComplete(lead, assessmentData);
      } catch (waError) {
        console.error('WhatsApp notification failed:', waError.message);
        // Don't fail the request if WhatsApp fails
      }
    }

    res.json({
      message: 'Assessment completed',
      assessmentId: assessment.id,
      score,
      riskLevel,
      min_loss,
      max_loss,
      redirectTo: '/assessment/email-capture'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/send-report', optionalAuth, async (req, res, next) => {
  try {
    const { assessmentId, email, name, phone, businessName } = req.body;

    if (!assessmentId || !email) {
      return res.status(400).json({ error: 'Bad Request', message: 'Assessment ID and email are required' });
    }

    const assessment = await get('SELECT * FROM assessments WHERE id = ?', [assessmentId]);

    if (!assessment) {
      return res.status(404).json({ error: 'Not Found', message: 'Assessment not found' });
    }

    const aiReport = assessment.ai_report ? JSON.parse(assessment.ai_report) : null;

    await sendAssessmentReport(email, {
      score: assessment.score,
      riskLevel: assessment.risk_level,
      aiReport,
      businessName: businessName || 'Your Business',
      assessmentId: assessment.id
    });

    // Update lead info with captured details
    await run(`
      UPDATE leads 
      SET email = ?, name = COALESCE(?, name), phone = COALESCE(?, phone), business_name = COALESCE(?, business_name)
      WHERE assessment_id = ?
    `, [email, name, phone, businessName, assessmentId]);

    // Send WhatsApp notification if phone is provided
    if (phone) {
      try {
        const lead = await get('SELECT id, phone, name FROM leads WHERE assessment_id = ?', [assessmentId]);
        if (lead && lead.phone) {
          const assessmentData = {
            id: assessment.id,
            score: assessment.score,
            risk_level: assessment.risk_level,
            min_loss: aiReport?.min_loss || 500000,
            max_loss: aiReport?.max_loss || 2000000
          };
          await sendAssessmentComplete(lead, assessmentData);
        }
      } catch (waError) {
        console.error('WhatsApp notification failed:', waError.message);
      }
    }

    res.json({
      message: 'Report sent successfully',
      assessmentId: assessment.id
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const assessment = await get('SELECT * FROM assessments WHERE id = ?', [req.params.id]);

    if (!assessment) {
      return res.status(404).json({ error: 'Not Found', message: 'Assessment not found' });
    }

    // If logged in, check ownership (optional, but good for privacy)
    if (req.user && assessment.user_id && assessment.user_id !== req.user.id) {
       // Allow viewing if same user, otherwise maybe restrict? 
       // For "Not a SaaS", we can be more lenient or use a public token.
       // Let's allow public viewing for now as requested "Not a SaaS yet".
    }

    const answers = assessment.answers ? JSON.parse(assessment.answers) : {};
    const aiReport = assessment.ai_report ? JSON.parse(assessment.ai_report) : null;
    
    // Recompute to get the dynamic min_loss, max_loss, recommendations
    const { min_loss, max_loss, recommendations } = calculateScore(answers);

    const industry = answers.business?.industry || 'General Business';
    const industryRisks = getIndustryRisks(industry);

    res.json({
      id: assessment.id,
      score: assessment.score,
      riskLevel: assessment.risk_level,
      min_loss,
      max_loss,
      recommendations,
      aiReport,
      answers,
      industryRisks,
      createdAt: assessment.created_at
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const assessments = await all('SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.user.id, limit, offset]);
    const totalResult = await get('SELECT COUNT(*) as count FROM assessments WHERE user_id = ?', [req.user.id]);

    res.json({
      assessments: assessments.map(a => ({
        id: a.id,
        score: a.score,
        riskLevel: a.risk_level,
        createdAt: a.created_at
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

module.exports = router;
