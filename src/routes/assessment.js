const express = require('express');
const { body, validationResult } = require('express-validator');
const { db, run, get, all } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { calculateScore, getRiskLevel } = require('../services/scoringEngine');
const { generateRecommendations } = require('../services/cre');
const { generateRiskReport, getAdvisorCopilot } = require('../services/aiService');
const { sendAssessmentReport } = require('../services/emailService');
const { sendAssessmentComplete } = require('../services/whatsappService');
const { getIndustryRisks } = require('../services/industryIntelligence');
const { generateCrossSell } = require('../recommendation/engine');

const router = express.Router();

const businessSections = ['type', 'profile', 'property', 'business_interruption', 'employee_risk', 'liability', 'vehicle', 'cyber', 'claims'];
const individualSections = ['type', 'personal_profile', 'family_protection', 'health_protection', 'home_risk', 'motor_risk', 'financial_resilience'];
const allValidSections = [...new Set([...businessSections, ...individualSections])];

const PREMIUM_RATES = {
  'All Risks Insurance': 0.01,
  'Aviation Insurance': 0.01,
  'Bond Insurance': 0.01,
  'Builders Liability Insurance': 0.0075,
  'Burglary Insurance': 0.0025,
  'Business Interruption Insurance': 0.01,
  'Contractors All Risks (CAR)': 0.005,
  'Employers Liability Insurance': 0.0065,
  'Employers Liability / Workmen Compensation': 0.0065,
  'Goods in Transit Insurance': 0.005,
  'Group Life Insurance': 0.007,
  'Home Insurance': 0.0045,
  'Home/Property Contents Insurance': 0.0045,
  'Machinery Breakdown Insurance': 0.01,
  'Marine cargo Insurance': 0.003,
  'Marine Hull Insurance': 0.0085,
  'Money Insurance': 0.01,
  'Motor Insurance (Comprehensive)': 0.05,
  'Comprehensive Motor Insurance': 0.05,
  'Occupiers Liability Insurance': 0.0075,
  'Oil & Gas Insurance': 0.0035,
  'Personal Accident Insurance': 0.005,
  'Personal Accident & Disability Insurance': 0.005,
  'Plant All Risk Insurance': 0.0075,
  'Professional Indemnity Insurance': 0.01,
  'Public Liability Insurance': 0.0045,
  'Fidelity Guarantee Insurance': 0.005,
  'Fire & Special Perils Insurance': 0.0025,
  'Term Life Insurance': 0.007,
  'HMO / Health Insurance': 0.05,
  'Cyber Liability Insurance': 0.01
};

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

// --- NEW V1 API ENDPOINTS ---
router.get('/templates', async (req, res, next) => {
  try {
    const templates = await all('SELECT * FROM assessment_templates ORDER BY track, id');
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

router.get('/template/:id/questions', async (req, res, next) => {
  try {
    const questions = await all('SELECT * FROM assessment_questions WHERE template_id = ? ORDER BY id', [req.params.id]);
    res.json(questions);
  } catch (error) {
    next(error);
  }
});
// -----------------------------

router.post('/section',
  optionalAuth,
  body('section').isString(),
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

    // Validation removed: some sections might be empty if the user answered conditionally (e.g., no car)

    const riskData = await calculateScore(answers);
    const { score, riskLevel, recommendations, min_loss, max_loss, identified_gaps, risk_categories, exposure_index, protection_gap, risk_dna } = riskData;

    let aiReport = null;
    let copilotData = null;
    let creIntelligence = null;
    try {
      const guestName = answers.business?.contact_name || answers.personal?.name || 'Guest User';
      const guestBusinessName = answers.business?.name || 'Prospect';
      const aiUserObj = req.user || { name: guestName, business_name: guestBusinessName };

      const assessmentDataObj = {
        answers,
        score,
        riskLevel,
        min_loss,
        max_loss,
        identified_gaps,
        recommendations,
        risk_categories,
        entityType,
        user: aiUserObj,
        exposure_index,
        protection_gap,
        risk_dna
      };

      // 1. Run CRE Rules
      creIntelligence = generateRecommendations(assessmentDataObj);

      // 2. Generate AI Report and Copilot Data
      const [report, copilot] = await Promise.all([
        generateRiskReport(assessmentDataObj, creIntelligence),
        getAdvisorCopilot(assessmentDataObj, creIntelligence)
      ]);

      aiReport = report;
      copilotData = copilot;
    } catch (e) {
      console.error('AI Intelligence generation failed:', e.message);
    }

    // Store report, copilot, and CRE intel
    const fullReport = {
      ...(aiReport || {}),
      min_loss,
      max_loss,
      risk_categories,
      copilot: copilotData,
      cre_data: creIntelligence,
      generatedAt: new Date().toISOString()
    };

    const dbRiskLevelMap = {
      'Excellent': 'low', 'Good': 'low',
      'Strong': 'low',
      'Developing': 'moderate',
      'Needs Attention': 'moderate',
      'Priority Improvement': 'high',
      'Critical': 'critical',
      'Very Low Risk': 'low', 'Low Risk': 'low', 'Moderate Risk': 'moderate',
      'High Risk': 'high', 'Critical Risk': 'critical',
      'Moderate': 'moderate', 'Vulnerable': 'high',
      'Critical': 'critical'
    };
    const dbRiskLevel = dbRiskLevelMap[riskLevel] || 'needs_attention';

    await run('UPDATE assessments SET score = ?, risk_level = ?, ai_report = ? WHERE id = ?', [
      score,
      dbRiskLevel,
      JSON.stringify(fullReport),
      assessment.id
    ]);

    // Create lead if not exists
    let lead = await get('SELECT id, phone, name FROM leads WHERE assessment_id = ?', [assessment.id]);
    if (!lead) {
      const name = req.user ? (req.user.name || answers.business?.contact_name || answers.personal?.name || 'Anonymous') : (answers.business?.contact_name || answers.personal?.name || 'Anonymous');
      const email = req.user ? req.user.email : (answers.business?.contact_email || answers.personal?.email || '');
      let rawPhone = req.user ? req.user.phone : (answers.business?.contact_phone || answers.personal?.phone || '');
      const cleanPhone = rawPhone ? String(rawPhone).replace(/\D/g, '') : '';
      const businessName = entityType === 'business' ? (req.user ? (req.user.business_name || answers.business?.name || '') : (answers.business?.name || '')) : null;

      // --- NEW CRM LOGIC ---
      const industry = answers.business?.industry || 'other';
      const employees = answers.business?.employee_count || '';
      const recommendedCoversStr = JSON.stringify(recommendations || []);
      
      let estimatedPremium = 0;
      if (min_loss) {
        let annualPremium = 0;
        let monthlyPremium = 0;
        const recs = recommendations || [];
        if (recs.length > 0) {
          recs.forEach(rec => {
            const rate = PREMIUM_RATES[rec] || 0.01;
            if (rec.toLowerCase().includes('life')) {
              monthlyPremium += (min_loss * rate) / 12;
            } else {
              annualPremium += (min_loss * rate);
            }
          });
          estimatedPremium = Math.round(annualPremium + monthlyPremium);
        } else {
          estimatedPremium = Math.round(min_loss * 0.013); // default fallback
        }
      }
      
      const agentMap = {
        'manufacturing': 'Manufacturing Specialist',
        'logistics': 'Marine/GIT Specialist',
        'education': 'Group Life Specialist',
        'non_profit': 'Liability Specialist',
        'retail': 'SME Specialist'
      };
      const assignedAgent = agentMap[industry] || 'General Agent';

      // Calculate Lead Value (CRASF)
      const intentScore = 50; // Base intent for completing assessment
      const authorityScore = 50; // Base authority
      const protectionGap = Math.min(score + 20, 100); // Proxy based on risk score
      const leadValue = Math.round((score * 0.4) + (intentScore * 0.3) + (authorityScore * 0.2) + (protectionGap * 0.1));

      const result = await run(`
        INSERT INTO leads (
          name, email, phone, business_name, assessment_id, score, risk_level, 
          status, entity_type, engagement_points, sales_score, pipeline_stage, 
          estimated_premium, industry, employees, recommended_covers, assigned_agent, contact_person
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'New Lead', ?, 20, ?, 1, ?, ?, ?, ?, ?, ?)
      `, [
        (entityType === 'business' && businessName) ? businessName : name,
        email,
        cleanPhone,
        businessName,
        assessment.id,
        score,
        dbRiskLevel,
        entityType,
        leadValue,
        estimatedPremium,
        industry,
        employees,
        recommendedCoversStr,
        assignedAgent,
        name
      ]);

      lead = { id: result.lastInsertRowid, phone: cleanPhone, name };
    }

    // WhatsApp notification will be sent during the email capture step (/send-report)
    // rather than immediately upon assessment submission.

    res.json({
      message: 'Assessment completed',
      assessmentId: assessment.id,
      score,
      riskLevel,
      min_loss,
      max_loss,
      redirectTo: '/assessment/final-cta'
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

    // Track email result separately so we can still process lead + WhatsApp
    let emailSent = false;
    let emailError = null;

    try {
      const riskLevelMap = {
        'Excellent': 'low', 'Good': 'low', 'Moderate': 'moderate',
        'Vulnerable': 'high', 'Critical': 'critical',
        'Very Low Risk': 'low', 'Low Risk': 'low', 'Moderate Risk': 'moderate',
        'High Risk': 'high', 'Critical Risk': 'critical'
      };
      await sendAssessmentReport(email, {
        score: assessment.score,
        riskLevel: riskLevelMap[assessment.risk_level] || assessment.risk_level || 'low',
        aiReport,
        businessName: businessName || 'Your Business',
        assessmentId: assessment.id
      });
      emailSent = true;
    } catch (emailErr) {
      console.error('Email send failed in send-report:', emailErr.message);
      emailError = emailErr.message;
    }

    // Clean phone number (remove spaces, hyphens, parentheses, etc)
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;

    // Update lead info with captured details (always do this regardless of email)
    const leadName = businessName ? businessName : name;
    await run(`
      UPDATE leads 
      SET email = ?, name = COALESCE(?, name), phone = COALESCE(?, phone), business_name = COALESCE(?, business_name), contact_person = COALESCE(?, contact_person)
      WHERE assessment_id = ?
    `, [email, leadName, cleanPhone, businessName, name, assessmentId]);

    // Send WhatsApp notification if phone is provided (always try regardless of email)
    if (phone) {
      try {
        const lead = await get('SELECT id, phone, name FROM leads WHERE assessment_id = ?', [assessmentId]);
        if (lead && lead.phone) {
          let riskBreakdownMsg = '';
          if (aiReport?.risk_categories) {
            const formattedCategories = Object.entries(aiReport.risk_categories)
              .map(([key, val]) => {
                const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return `• ${title}: ${val}/100`;
              }).join('\n');
            riskBreakdownMsg = `\n\n📈 *Risk Breakdown:*\n${formattedCategories}`;
          }

          const assessmentData = {
            id: assessment.id,
            score: assessment.score,
            risk_level: assessment.risk_level,
            min_loss: aiReport?.min_loss || 500000,
            max_loss: aiReport?.max_loss || 2000000,
            riskBreakdownMsg: riskBreakdownMsg
          };
          await sendAssessmentComplete(lead, assessmentData);
        }
      } catch (waError) {
        console.error('WhatsApp notification failed:', waError.message);
      }
    }

    // Return appropriate response based on email result
    if (emailSent) {
      res.json({
        message: 'Report sent successfully',
        assessmentId: assessment.id
      });
    } else {
      // Still return 200 since lead was saved and WhatsApp may have sent,
      // but flag the email failure so the frontend can show a nuanced message
      res.json({
        message: 'Your information has been saved. Email delivery failed but you can view your report directly.',
        assessmentId: assessment.id,
        emailFailed: true,
        emailError: emailError
      });
    }
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

    // Add 10 points for opening the report, but only if they currently have exactly 20 points (Assessment Completed)
    // This prevents adding 10 points on every page load
    await run('UPDATE leads SET engagement_points = engagement_points + 10 WHERE assessment_id = ? AND engagement_points = 20', [assessment.id]);

    const answers = assessment.answers ? JSON.parse(assessment.answers) : {};
    const aiReport = assessment.ai_report ? JSON.parse(assessment.ai_report) : null;
    
    // Recompute to get scoring details for executive summary
    const scoreResult = await calculateScore(answers);
    const { min_loss, max_loss, recommendations, risk_categories, improvement_potential, identified_gaps } = scoreResult;

    // Build executive summary data
    const riskLevel = getRiskLevel(assessment.score);
    const cats = risk_categories || {};
    const sortedCats = Object.entries(cats).sort(([, a], [, b]) => b - a);
    const highestPriority = sortedCats.length > 0 ? sortedCats[sortedCats.length - 1][0] : null;
    const biggestStrength = sortedCats.length > 0 ? sortedCats[0][0] : null;
    const biggestVulnerability = highestPriority;
    const recommendedFirstStep = recommendations && recommendations.length > 0 ? recommendations[0] : null;
    const potentialScore = improvement_potential ? improvement_potential.potential_score : null;

    const industry = answers.business?.industry || 'General Business';
    const industryRisks = getIndustryRisks(industry);

    // Detect assessment type prefix for cross-sell
    let assessmentType = 'sme';
    for (const key of Object.keys(answers)) {
      const m = key.match(/^([A-Z]+)_\d+$/);
      if (m) {
        const prefixMap = { SCH: 'school', BUS: 'sme', SME: 'sme', HOS: 'hospital', MFG: 'manufacturing', CHU: 'church', YPR: 'young_professional', FAM: 'family', INC: 'income', HLT: 'health', ENT: 'entrepreneur', RET: 'retirement' };
        assessmentType = prefixMap[m[1]] || 'sme';
        break;
      }
    }
    const crossSell = generateCrossSell(assessmentType, identified_gaps || [], recommendations || []);

    res.json({
      id: assessment.id,
      score: assessment.score,
      riskLevel,
      min_loss,
      max_loss,
      recommendations,
      riskCategories: cats,
      improvementPotential: improvement_potential,
      executiveSummary: {
        score: assessment.score,
        riskLevel,
        highestPriority,
        biggestStrength,
        biggestVulnerability,
        recommendedFirstStep,
        potentialScore
      },
      aiReport,
      answers,
      industryRisks,
      crossSell,
      createdAt: assessment.created_at
    });
  } catch (error) {
    next(error);
  }
});

// Reassessment comparison — compare current vs previous assessment scores
router.get('/compare/:leadId', optionalAuth, async (req, res, next) => {
  try {
    const assessments = await all(
      'SELECT id, score, risk_level, created_at FROM assessments WHERE id IN (SELECT assessment_id FROM leads WHERE id = ?) OR user_id = (SELECT user_id FROM leads WHERE id = ?) ORDER BY created_at DESC LIMIT 2',
      [req.params.leadId, req.params.leadId]
    );

    if (assessments.length < 2) {
      const lead = await get('SELECT * FROM leads WHERE id = ?', [req.params.leadId]);
      const current = assessments[0] || await get('SELECT id, score, risk_level, created_at FROM assessments WHERE id = ?', [lead?.assessment_id]);
      return res.json({
        hasPrevious: false,
        current: current ? { id: current.id, score: current.score, risk_level: current.risk_level, date: current.created_at } : null,
        previous: null,
        improvement: null
      });
    }

    const current = assessments[0];
    const previous = assessments[1];
    const scoreChange = current.score - previous.score;
    const improvement = scoreChange > 0 ? 'improved' : scoreChange < 0 ? 'declined' : 'unchanged';

    res.json({
      hasPrevious: true,
      current: { id: current.id, score: current.score, risk_level: current.risk_level, date: current.created_at },
      previous: { id: previous.id, score: previous.score, risk_level: previous.risk_level, date: previous.created_at },
      improvement,
      scoreChange: Math.abs(scoreChange)
    });
  } catch (error) { next(error); }
});

// Advisor Preparation Summary\u2122 — internal brief for the advisor before a consultation
router.get('/:id/advisor-brief', optionalAuth, async (req, res, next) => {
  try {
    const assessment = await get('SELECT * FROM assessments WHERE id = ?', [req.params.id]);
    if (!assessment) {
      return res.status(404).json({ error: 'Not Found', message: 'Assessment not found' });
    }

    const lead = await get('SELECT * FROM leads WHERE assessment_id = ?', [assessment.id]);
    const answers = assessment.answers ? JSON.parse(assessment.answers) : {};
    const aiReport = assessment.ai_report ? JSON.parse(assessment.ai_report) : null;
    const scoreResult = await calculateScore(answers);
    const { risk_categories, recommendations, identified_gaps, min_loss, max_loss, improvement_potential } = scoreResult;

    const riskLevel = getRiskLevel(assessment.score);
    const cats = risk_categories || {};
    const sortedCats = Object.entries(cats).sort(([, a], [, b]) => b - a);
    const highestPriority = sortedCats.length > 0 ? sortedCats[sortedCats.length - 1][0] : null;

    // Build top risks list
    const topRisks = [];
    if (answers['INC_012'] === 'Less than 1 month') topRisks.push('Less than one month emergency savings');
    else if (answers['INC_012'] === '1-3 months') topRisks.push('Limited emergency savings (1\u20133 months)');
    if (answers['INC_014'] === 'No') topRisks.push('No income protection policy');
    if (answers['INC_015'] === 'Yes') topRisks.push('Significant debt commitments');
    if (answers['INC_011'] === 'Freelance/Contract') topRisks.push('Freelance/contract income with no guaranteed stability');
    if (answers['INC_011'] === 'Business owner') topRisks.push('Income tied to business performance');
    if (answers['INC_013'] === 'No') topRisks.push('No secondary income sources');
    if (answers['INC_018'] === 'It would stop completely') topRisks.push('Income would stop completely during prolonged inability to work');
    if (topRisks.length === 0 && identified_gaps) topRisks.push(...identified_gaps.slice(0, 5));

    // Determine recommended conversation focus
    const convFocus = highestPriority
      ? `Discuss ${highestPriority.toLowerCase()} strategy before recommending protection products.`
      : 'Review overall risk profile and identify priority areas.';

    // Suggested products from recommendations
    const suggestedProducts = (recommendations || []).slice(0, 5);
    if (suggestedProducts.length === 0 && aiReport?.recommendations) {
      suggestedProducts.push(...aiReport.recommendations.slice(0, 5));
    }

    // Estimated meeting duration
    const meetingDuration = topRisks.length <= 2 ? '15 minutes' : topRisks.length <= 4 ? '20 minutes' : '30 minutes';
    const prefix = (() => {
      for (const key of Object.keys(answers)) {
        const m = key.match(/^([A-Z]+)_\d+$/);
        if (m) return m[1];
      }
      return null;
    })();

    res.json({
      customerName: lead?.name || answers.name || 'Customer',
      score: assessment.score,
      riskLevel,
      highestPriority,
      prefix,
      topRisks,
      recommendedConversation: convFocus,
      suggestedProducts,
      expectedMeetingDuration: meetingDuration,
      estimatedExposure: { min: min_loss, max: max_loss },
      improvementPotential: improvement_potential,
      aiInsights: aiReport ? {
        executiveSummary: aiReport.executiveSummary,
        professionalRecommendation: aiReport.professionalRecommendation
      } : null
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
