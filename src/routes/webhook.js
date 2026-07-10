const express = require('express');
const router = express.Router();
const { sendWhatsApp } = require('../services/whatsappService');
const emailService = require('../services/emailService');
const { get, run } = require('../config/database');
const { generateRiskReport, getLeadQualifier } = require('../services/aiService');
const { calculateScore } = require('../services/scoringEngine');
const { generateRecommendations } = require('../services/cre');
const ccieEngine = require('../services/ccieEngine');
const { CCIE_EVENTS, publishEvent } = require('../services/ccieEvents');
const questionBank = require('../data/question_bank.json');
const { domainConfig, defaultDomain } = require('../config/domain');

const flowMap = {
  'school': 'SCH', 'manufacturing': 'MFG', 'hospital': 'HOS', 'healthcare': 'HOS',
  'church': 'CHR', 'construction': 'CON', 'transport': 'TRN', 'logistics': 'TRN',
  'family': 'FAM', 'personal': 'FAM', 'individual': 'FAM',
  'young': 'YPR', 'retirement': 'RET', 'income': 'INC', 'health': 'HLT',
  'entrepreneur': 'ENT', 'sme': 'SME', 'business': 'SME'
};

const resolvePrefix = (ind) => {
  if (!ind) return 'SME';
  const lowerInd = ind.toLowerCase();
  for (const [key, val] of Object.entries(flowMap)) {
    if (lowerInd.includes(key)) return val;
  }
  return 'SME';
};

const generateCoverScoreInsight = (pillarScores, answers, name, prefix) => {
  const entries = Object.entries(pillarScores || {}).sort(([, a], [, b]) => a - b);
  if (entries.length === 0) return null;
  const weakest = entries[0];
  const weakestName = weakest[0];
  const weakestScore = weakest[1];
  const dom = domainConfig[prefix] || defaultDomain;

  const pillarDef = dom.insightTexts?.perPillar?.[weakestName];
  let body;
  if (pillarDef) {
    body = pillarDef.base;
    for (const check of (pillarDef.answerChecks || [])) {
      const answer = answers[check.q];
      if (!answer) continue;
      const matched = check.values
        ? check.values.includes(answer)
        : check.condition?.(answer);
      if (matched) {
        const text = typeof check.append === 'function' ? check.append(answer) : check.append;
        body += ' ' + text;
      }
    }
    if (pillarDef.suffix) body += ' ' + pillarDef.suffix;
  } else {
    body = dom.insightTexts?.catchAll ||
      `Your assessment highlights that your biggest opportunity to strengthen your ${dom.improvementTerm} is your ${weakestName.toLowerCase()}. With a score of ${weakestScore}%, this is where focused attention would have the greatest impact on your ${dom.closingTerm}.`;
  }
  if (dom.insightTexts?.suffix) body += dom.insightTexts.suffix;

  return `CoverScore Insight\u2122 \u2B50\n\n${body}`;
};

router.post('/evolution', async (req, res) => {
  res.status(200).send('OK');

  try {
    const payload = req.body;
    if (!(payload && payload.event === 'messages.upsert')) return;

    const messageData = payload.data;
    if (messageData.key && messageData.key.fromMe) return;

    let incomingTextRaw = '';
    if (messageData.message) {
      incomingTextRaw =
        messageData.message.conversation ||
        (messageData.message.extendedTextMessage && messageData.message.extendedTextMessage.text) ||
        (messageData.message.buttonsResponseMessage && messageData.message.buttonsResponseMessage.selectedDisplayText) ||
        (messageData.message.interactiveResponseMessage && messageData.message.interactiveResponseMessage.buttonReply && messageData.message.interactiveResponseMessage.buttonReply.title) ||
        (messageData.message.interactiveResponseMessage && messageData.message.interactiveResponseMessage.listReply && messageData.message.interactiveResponseMessage.listReply.title) ||
        (messageData.message.listResponseMessage && messageData.message.listResponseMessage.singleSelectReply && messageData.message.listResponseMessage.singleSelectReply.selectedRowId) ||
        '';
    }

    const incomingText = incomingTextRaw.trim().toUpperCase();
    if (!incomingText) return;

    const remoteJid = messageData.key.remoteJid;
    if (!remoteJid) return;
    const phoneNumber = remoteJid.split('@')[0];

    console.log(`📩 Received WhatsApp reply from ${phoneNumber}: "${incomingText}"`);

    let searchPhone = phoneNumber.length > 10 ? phoneNumber.slice(-10) : phoneNumber;
    let lead = await get('SELECT * FROM leads WHERE phone LIKE ? ORDER BY id DESC LIMIT 1', ['%' + searchPhone]);

    const words = incomingText.split(/\s+/);
    const isStartTrigger = words.some(w => w === 'START' || w === 'ASSESSMENT' || w === 'HELLO' || w === 'HI' || w === 'BEGIN');
    const isRestartTrigger = (incomingText.includes('START ') && incomingText.includes(' ASSESSMENT')) || incomingText.includes('RESTART') || incomingText.includes('START OVER');

    let detectedIndustry = null;
    if (incomingText.includes('START ') && incomingText.includes(' ASSESSMENT')) {
      const match = incomingText.match(/START\s+(.+)\s+ASSESSMENT/);
      if (match && match[1]) detectedIndustry = match[1].trim().toLowerCase();
    }

    console.log(`   Lead found: ${!!lead}, isStartTrigger: ${isStartTrigger}, isRestartTrigger: ${isRestartTrigger}, detectedIndustry: ${detectedIndustry}`);

    const resolvedIndustry = detectedIndustry || (lead ? lead.industry : null);
    const prefix = resolvePrefix(resolvedIndustry);

    // Persist the detected industry so prefix stays consistent across all webhook calls
    if (lead && detectedIndustry && detectedIndustry !== lead.industry) {
      await run('UPDATE leads SET industry = ? WHERE id = ?', [detectedIndustry, lead.id]);
      lead.industry = detectedIndustry;
    }

    let currentState, chatHistory, assessmentData, ccieContext;

    if (lead && (isRestartTrigger || incomingText === 'RESTART')) {
      currentState = `${prefix}_001`;
      chatHistory = [];
      assessmentData = {};
      ccieContext = ccieEngine.buildContext({
        questionPack: prefix, channel: 'whatsapp',
        customer: { phone: phoneNumber, name: lead.name, email: lead.email },
        currentPhase: 'WELCOME', currentQuestion: `${prefix}_001`, questionCount: 0
      });
      await run('UPDATE leads SET wa_state = ?, chat_history = ?, assessment_data = ?, ccie_context = ? WHERE id = ?',
        [currentState, JSON.stringify(chatHistory), JSON.stringify(assessmentData), JSON.stringify(ccieContext), lead.id]);
      console.log(`   Lead ${lead.id} restarting -> ${currentState}`);

      const ccieStart = await ccieEngine.startConversation(prefix, phoneNumber, detectedIndustry);
      const welcomeMsg = ccieStart.messages[0]?.text || `👋 Welcome to CoverScore AI.\n\nLet's begin.`;
      await sendWhatsApp(phoneNumber, null, { _message: welcomeMsg });
      chatHistory.push({ role: 'assistant', content: welcomeMsg, timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
      await run('UPDATE leads SET wa_state = ?, chat_history = ?, ccie_context = ? WHERE id = ?',
        [currentState, JSON.stringify(chatHistory), JSON.stringify(ccieStart.context), lead.id]);
      return;
    }

    if (!lead && !isStartTrigger) {
      console.log(`   Lead not found and no start trigger.`);
      return;
    }

    if (!lead && isStartTrigger) {
      currentState = `${prefix}_001`;
      chatHistory = [];
      assessmentData = {};
      console.log(`   Creating NEW lead for phone ${phoneNumber}`);
      const ccieStart = await ccieEngine.startConversation(prefix, phoneNumber, detectedIndustry);
      ccieContext = ccieStart.context;
      const insertResult = await run(`
        INSERT INTO leads (name, email, phone, status, wa_state, chat_history, entity_type, contact_person, industry, ccie_context)
        VALUES (?, ?, ?, 'New Lead', ?, '{}', 'unknown', ?, ?, ?)
      `, ['WhatsApp User', 'whatsapp@coverscore.site', phoneNumber, currentState, 'WhatsApp User', resolvedIndustry, JSON.stringify(ccieContext)]);
      lead = await get('SELECT * FROM leads WHERE id = ?', [insertResult.lastInsertRowid]);
      console.log(`   Created new lead ID: ${lead.id}`);

      const welcomeMsg = ccieStart.messages[0]?.text || `👋 Welcome to CoverScore AI.\n\nLet's begin.`;
      await sendWhatsApp(phoneNumber, null, { _message: welcomeMsg });
      chatHistory.push({ role: 'assistant', content: welcomeMsg, timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
      await run('UPDATE leads SET wa_state = ?, chat_history = ?, ccie_context = ? WHERE id = ?',
        [currentState, JSON.stringify(chatHistory), JSON.stringify(ccieContext), lead.id]);
      return;
    }

    currentState = lead.wa_state || 'initial';
    chatHistory = JSON.parse(lead.chat_history || '[]');
    assessmentData = JSON.parse(lead.assessment_data || '{}');
    ccieContext = (() => {
      try { return JSON.parse(lead.ccie_context || 'null'); } catch(e) { return null; }
    })() || ccieEngine.buildContext({
      questionPack: prefix, channel: 'whatsapp',
      customer: { phone: phoneNumber, name: lead.name, email: lead.email },
      currentPhase: ccieEngine.determinePhase(currentState),
      currentQuestion: currentState, questionCount: 0
    });

    if (isStartTrigger && (currentState === 'initial' || currentState === null || assessmentData._scored || currentState === 'qualification')) {
      currentState = `${prefix}_001`;
      assessmentData = {};
      await run('UPDATE leads SET wa_state = ?, assessment_data = ? WHERE id = ?', [currentState, '{}', lead.id]);
    }

    if (isStartTrigger && currentState === `${prefix}_001`) {
      const ccieStart = await ccieEngine.startConversation(prefix, phoneNumber, detectedIndustry);
      const welcomeMsg = ccieStart.messages[0]?.text || `👋 Welcome to CoverScore AI.\n\nLet's begin.`;
      await sendWhatsApp(phoneNumber, null, { _message: welcomeMsg });
      chatHistory.push({ role: 'user', content: incomingTextRaw.trim(), timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
      chatHistory.push({ role: 'assistant', content: welcomeMsg, timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
      await run('UPDATE leads SET wa_state = ?, chat_history = ?, ccie_context = ? WHERE id = ?',
        [currentState, JSON.stringify(chatHistory), JSON.stringify(ccieStart.context), lead.id]);
      return;
    }

    if (!currentState) currentState = `${prefix}_001`;

    ccieContext.currentQuestion = currentState;
    ccieContext.currentPhase = ccieEngine.determinePhase(currentState);
    ccieContext.answers = assessmentData;

    const { messages, nextState, updatedData, isComplete, context: updatedCcieContext } = await ccieEngine.processReply(
      ccieContext, incomingTextRaw.trim()
    );

    console.log(`   CCIE transition: ${currentState} -> ${nextState}, complete: ${isComplete}, messages: ${messages.length}`);

    let newAssessmentData = updatedData ? { ...assessmentData, ...updatedData } : { ...assessmentData };
    if (updatedData && updatedData.answers) {
      newAssessmentData.answers = { ...(assessmentData.answers || {}), ...updatedData.answers };
    }

    assessmentData = newAssessmentData;

    const isFinished = isComplete || nextState === 'finished' || nextState === 'COMPLETE';
    const nextQ = questionBank.find(q => q.id === nextState);
    const reachedResults = ccieEngine.determinePhase(nextState) === 'RESULTS'
      || (nextQ && nextQ.data_mapping === 'request_consultation');
    const nextQScoring = questionBank.find(q => q.id === nextState);
    const isScoreQuestion = nextQScoring && nextQScoring.question && nextQScoring.question.includes('{{score}}');
    const needsScoring = (isFinished || reachedResults || isScoreQuestion || nextState === 'awaiting_consultation' || nextState === 'COMPLETE') && !assessmentData._scored;

    // Template fill helper (uses assessmentData which scoring populates)
    const riskLabelMap = {
      'Excellent': 'Excellent', 'Strong': 'Strong', 'Developing': 'Developing',
      'Needs Attention': 'Needs Attention',
      'Priority Improvement': 'Priority Improvement',
      'Critical': 'Critical',
      'Very Low Risk': 'Very Low', 'Low Risk': 'Low', 'Moderate Risk': 'Moderate',
      'High Risk': 'High', 'Critical Risk': 'Critical'
    };
    let userRiskLabel = 'Needs Attention';
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
    const fillTemplate = (text) => {
      return text
        .replace(/\{\{name\}\}/g, assessmentData.name || 'Customer')
        .replace(/\{\{score\}\}/g, assessmentData.score || '0')
        .replace(/\{\{riskLevel\}\}/g, userRiskLabel.toUpperCase())
        .replace(/\{\{protectionLevel\}\}/g, userRiskLabel.toUpperCase())
        .replace(/\{\{strengths\}\}/g, assessmentData.strengths || '')
        .replace(/\{\{top_risks\}\}/g, assessmentData.top_risks || '')
        .replace(/\{\{risks\}\}/g, assessmentData.top_risks || '')
        .replace(/\{\{recommendations\}\}/g, assessmentData.recommendations || '')
        .replace(/\{\{reportUrl\}\}/g, assessmentData.reportUrl || 'https://coverscore.site');
    };

    // Phase 1: Send auto_advance messages immediately (before scoring takes time)
    let allMessages = [...messages];
    const preMessages = needsScoring ? allMessages.filter(m => m.type === 'auto_advance') : [];
    // When scoring, Phase 3 replaces the results template entirely; discard old reply text
    const postMessages = needsScoring
      ? allMessages.filter(m => m.type !== 'auto_advance' && m.type !== 'reply')
      : allMessages;

    for (const msg of preMessages) {
      if (!msg.text) continue;
      msg.text = fillTemplate(msg.text);
      const sendResult = await sendWhatsApp(phoneNumber, null, { _message: msg.text });
      if (!sendResult.success) {
        console.error(`   ❌ Failed to send auto_advance message: ${sendResult.error}. Aborting.`);
        return;
      }
      chatHistory.push({
        role: 'assistant', content: msg.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    // Phase 2: Run scoring (takes time — AI calls)
    if (needsScoring) {
      delete assessmentData.reportUrl;
      console.log(`   [CCIE SCORING] Calculating CoverScore for ${phoneNumber}`);
      const finalAnswers = { ...(assessmentData.answers || {}), template_selection: { template_id: prefix } };
      try {
        const scoreResult = await calculateScore(finalAnswers);
        assessmentData.score = scoreResult.score;
        assessmentData.riskLevel = scoreResult.risk_level;
        userRiskLabel = riskLabelMap[assessmentData.riskLevel] || assessmentData.riskLevel || 'Moderate';
        assessmentData.identified_gaps = scoreResult.identified_gaps || [];
        assessmentData.min_loss = scoreResult.min_loss;
        assessmentData.max_loss = scoreResult.max_loss;

        const fb = {
          HLT: { strengths: '', risks: "⚠ Your health protection gaps need attention.", recommendations: "• Review your health coverage.\n• Build an emergency medical fund.\n• Schedule preventive health screenings." },
          ENT: { strengths: "✓ Strong business vision\n✓ Market awareness", risks: "⚠ High key-person dependency\n⚠ Inadequate liability protection", recommendations: "• Review Key Person Insurance.\n• Separate personal and business assets." },
          FAM: { strengths: "✓ Clear long-term goals\n✓ Strong familial support", risks: "⚠ Inadequate life cover\n⚠ Education funding gap", recommendations: "• Review Life Insurance policy.\n• Set up an education trust." },
           INC: { strengths: "✓ Income stability\n✓ Employment security", risks: "⚠ Limited emergency savings\n⚠ No income protection cover", recommendations: "• Build an emergency fund.\n• Consider income protection insurance." },
          RET: { strengths: "✓ Retirement planning awareness\n✓ Long-term thinking", risks: "⚠ Inadequate retirement savings\n⚠ No long-term care plan\n⚠ No legacy documentation", recommendations: "• Start or review a dedicated retirement savings plan.\n• Consider long-term care insurance.\n• Document your asset distribution and beneficiary nominations." },
          YPR: { strengths: "✓ Early career financial awareness", risks: "⚠ Limited emergency savings\n⚠ No personal insurance", recommendations: "• Build an emergency fund.\n• Consider health and accident insurance." },
          HOM: { strengths: "✓ Property ownership", risks: "⚠ No home contents insurance", recommendations: "• Consider homeowner's or renter's insurance." },
          MOT: { strengths: "✓ Vehicle ownership", risks: "⚠ No comprehensive motor insurance", recommendations: "• Consider comprehensive motor insurance." },
          DEFAULT: { strengths: "✓ Career Stability\n✓ Digital Safety\n✓ Personal Responsibility", risks: "⚠ Limited emergency savings\n⚠ Inadequate income protection\n⚠ No long-term financial protection strategy", recommendations: "• Build an emergency fund\n• Review income protection\n• Begin a structured long-term financial plan" }
        };
        const fallbacks = fb[prefix] || fb.DEFAULT;

        let strengthsText = fallbacks.strengths;
        let risksText = fallbacks.risks;
        if (scoreResult.risk_categories && Object.keys(scoreResult.risk_categories).length > 0) {
          const makeBar = (s) => {
            const filled = Math.round(Math.min(s, 100) / 10);
            return '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
          };
          const pillarNames = Object.keys(scoreResult.risk_categories);
          const maxLen = Math.max(...pillarNames.map(n => n.length), 20);
          const lines = Object.entries(scoreResult.risk_categories)
            .sort(([, a], [, b]) => b - a)
            .map(([name, score]) => {
              const paddedName = name.padEnd(maxLen);
              return `${paddedName} ${makeBar(score)} ${score}%`;
            });
          strengthsText = lines.join('\n');

          const weak = Object.entries(scoreResult.risk_categories)
            .filter(([, v]) => v < 50)
            .sort(([, a], [, b]) => a - b);
          risksText = weak.length > 0
            ? weak.map(([name]) => '\u26A0 ' + name + ' needs attention').join('\n')
            : "Your overall profile is reasonably balanced. Targeted recommendations below.";
        }
        assessmentData.strengths = strengthsText;
        assessmentData.top_risks = risksText;
        assessmentData.risk_categories = scoreResult.risk_categories;
        assessmentData.pillar_scores = scoreResult.pillar_scores;
        assessmentData.recommendations = scoreResult.recommendations && scoreResult.recommendations.length > 0
          ? scoreResult.recommendations.slice(0, 3).map(r => '• ' + r).join('\n') : fallbacks.recommendations;
        assessmentData._rawRecommendations = scoreResult.recommendations || [];

        const entityType = (lead.industry === 'personal' || lead.industry === 'family') ? 'individual' : 'business';
        const assessmentDataObj = {
          answers: finalAnswers, score: scoreResult.score, riskLevel: scoreResult.risk_level,
          min_loss: scoreResult.min_loss, max_loss: scoreResult.max_loss,
          recommendations: scoreResult.recommendations, identified_gaps: scoreResult.identified_gaps,
          risk_categories: scoreResult.risk_categories, entityType
        };

        const dbRiskLevel = dbRiskLevelMap[scoreResult.risk_level] || 'low';

        publishEvent(CCIE_EVENTS.SCORE_CALCULATED, ccieContext, {
          score: scoreResult.score, riskLevel: scoreResult.risk_level, entityType
        });

        // Insert assessment record immediately (without AI report) so reportUrl is available in Phase 3
        const assessRes = await run(`
          INSERT INTO assessments (user_id, answers, score, risk_level)
          VALUES (NULL, ?, ?, ?)
        `, [JSON.stringify(finalAnswers), scoreResult.score, dbRiskLevel]);
        const assessmentId = assessRes.lastInsertRowid;
        assessmentData.assessmentId = assessmentId;
        assessmentData.reportUrl = `${process.env.APP_URL || 'https://coverscore.site'}/assessment/result/${assessmentId}`;
        publishEvent(CCIE_EVENTS.REPORT_GENERATED, ccieContext, { assessmentId, reportUrl: assessmentData.reportUrl });
        assessmentData._scored = true;

        // Fire AI report generation + remaining persistence in background (don't block user response)
        setImmediate(async () => {
          let aiReportFinal;
          try {
            const creIntel = generateRecommendations(assessmentDataObj);
            aiReportFinal = await generateRiskReport(assessmentDataObj, creIntel);
            await run(`UPDATE assessments SET ai_report = ? WHERE id = ?`, [JSON.stringify(aiReportFinal), assessmentId]);
          } catch (err) {
            console.error('Background AI error:', err);
          }

          if (assessmentData.email) {
            emailService.sendAssessmentReport(assessmentData.email, {
              score: scoreResult.score, riskLevel: dbRiskLevel, aiReport: aiReportFinal || null,
              businessName: assessmentData.business_name || assessmentData.name, assessmentId
            }).then(() => {
              publishEvent(CCIE_EVENTS.REPORT_DELIVERED, ccieContext, { email: assessmentData.email, assessmentId });
              console.log(`✅ Assessment report emailed to ${assessmentData.email}`);
            }).catch(err => console.error(`❌ Failed to email report:`, err));
          }

          try {
            const PREMIUM_RATES = {
              'All Risks Insurance': 0.01, 'Aviation Insurance': 0.01, 'Bond Insurance': 0.01,
              'Burglary Insurance': 0.01, 'Business Interruption Insurance': 0.015,
              'Comprehensive Motor Insurance': 0.05, 'Cyber Liability Insurance': 0.02,
              'Directors & Officers Liability': 0.015, 'Engineering Insurance': 0.01,
              'Fidelity Guarantee Insurance': 0.01, 'Fire & Special Perils Insurance': 0.0025,
              'Goods in Transit Insurance': 0.01, 'Group Life & Workmen Compensation': 0.01,
              'Health Insurance / HMO': 0.05, 'Home/Property Insurance': 0.0025,
              'Life Insurance': 0.02, 'Marine Insurance': 0.01, 'Plant & All Risk Insurance': 0.01,
              'Professional Indemnity Insurance': 0.015, 'Public Liability Insurance': 0.005,
              'Travel Insurance': 0.01
            };
            let estimatedPremium = 0;
            if (scoreResult.min_loss) {
              let annualPremium = 0, monthlyPremium = 0;
              const recs = scoreResult.recommendations || [];
              if (recs.length > 0) {
                recs.forEach(rec => {
                  const rate = PREMIUM_RATES[rec] || 0.01;
                  if (rec.toLowerCase().includes('life')) monthlyPremium += (scoreResult.min_loss * rate) / 12;
                  else annualPremium += (scoreResult.min_loss * rate);
                });
                estimatedPremium = Math.round(annualPremium + monthlyPremium);
              } else { estimatedPremium = Math.round(scoreResult.min_loss * 0.013); }
            }

            await run(`
              UPDATE leads SET assessment_id = ?, score = ?, risk_level = ?, entity_type = ?,
                name = ?, email = ?, wa_state = 'qualification',
                status = 'Report Sent', pipeline_stage = 2,
                engagement_points = engagement_points + 20, sales_score = sales_score + 20,
                estimated_premium = ?, chat_history = ?,
                birth_date = ?, anniversary_date = ?, contact_person = ?
              WHERE id = ?
            `, [
              assessmentId, scoreResult.score, dbRiskLevel, entityType,
              (entityType === 'business' && assessmentData.business_name) ? assessmentData.business_name : (assessmentData.name || 'WhatsApp User'),
              assessmentData.email || 'whatsapp@coverscore.site',
              estimatedPremium, JSON.stringify(assessmentData),
              assessmentData.birth_date || null, assessmentData.anniversary_date || null,
              assessmentData.name || 'WhatsApp User', lead.id
            ]);
            console.log(`   📊 Assessment completed. Lead ${lead.id} → qualification state`);
          } catch (e) {
            console.error('Background update-leads error:', e);
          }
        });

      } catch (e) {
        console.error('Scoring error:', e);
        console.error('Scoring error stack:', e.stack);
        assessmentData.score = assessmentData.score || 50;
        assessmentData.riskLevel = assessmentData.riskLevel || 'Moderate';
        assessmentData.risk_categories = assessmentData.risk_categories || {};
        assessmentData.strengths = assessmentData.strengths || '';
        assessmentData.top_risks = assessmentData.top_risks || '';
        assessmentData._rawRecommendations = [];
        assessmentData._scored = true; // Ensure Phase 3 still runs with fallback data
        if (!assessmentData.reportUrl) {
          const fallbackId = assessmentData.assessmentId || (lead ? lead.assessment_id : null);
          assessmentData.reportUrl = fallbackId
            ? `${process.env.APP_URL || 'https://coverscore.site'}/assessment/result/${fallbackId}`
            : `${process.env.APP_URL || 'https://coverscore.site'}`;
        }
      }
    }

    // Phase 3: Build ending sequence — Score → Summary → Insight → Recommendation → Report → Advisor
    if (needsScoring && assessmentData._scored) {
      console.log(`   [Phase 3] Building ending sequence...`);
      const dom = domainConfig[prefix] || defaultDomain;
      const name = assessmentData.name || 'Customer';
      const email = assessmentData.email || (lead ? lead.email : null);
      const appBase = process.env.APP_URL || 'https://coverscore.site';
      const fallbackId = assessmentData.assessmentId || (lead ? lead.assessment_id : null);
      const reportUrl = assessmentData.reportUrl || (fallbackId ? `${appBase}/assessment/result/${fallbackId}` : appBase);
      const riskCats = assessmentData.risk_categories || {};
      const answers = assessmentData.answers || {};

      // Derive CSNS display label directly from riskLevel (not via dbRiskLevelMap which maps to legacy DB values)
      const csnsDisplayLabels = dom.resilienceLabels || {
        'excellent': 'Excellent Resilience', 'strong': 'Strong Resilience',
        'developing': 'Developing Resilience', 'needs_attention': 'Needs Attention',
        'priority_improvement': 'Priority Improvement', 'critical_priority': 'Critical',
        'Excellent': 'Excellent Resilience', 'Strong': 'Strong Resilience',
        'Developing': 'Developing Resilience', 'Needs Attention': 'Needs Attention',
        'Priority Improvement': 'Priority Improvement', 'Critical': 'Critical'
      };
      const dbLevel = (dbRiskLevelMap[assessmentData.riskLevel] || '').toLowerCase();
      const displayLabel = csnsDisplayLabels[assessmentData.riskLevel] || csnsDisplayLabels[dbLevel] || dom.displayLabel || 'Building Resilience';

      // Derive sorted pillar list once
      const sortedDesc = Object.entries(riskCats).sort(([, a], [, b]) => b - a);
      const weakestPillar = sortedDesc.length > 0 ? sortedDesc[sortedDesc.length - 1][0] : null;

      // ===== Message 1: Completion + Score + Resilience Level + Highest Priority =====
      const msg1Parts = [
        `\uD83C\uDF89 Your ${dom.assessmentTitle} Assessment is complete.`,
        `CoverScore\u2122\n${assessmentData.score} / 100`,
        `Resilience Level\n${displayLabel}`
      ];
      if (weakestPillar) msg1Parts.push(`Highest Priority\n\n${weakestPillar}`);
      postMessages.push({ type: 'report', text: msg1Parts.join('\n\n'), _delay: 12000 });

      // ---- personalized real-life context builder ----
      const buildRealLifeContext = (answers, prefix, dom) => {
        if (prefix === 'INC') {
          const savings = answers['INC_012'];
          const hasProtection = answers['INC_014'];
          const incomeStop = answers['INC_018'];
          let savingsPhrase = 'your emergency savings may not be sufficient to cover extended expenses';
          const savingsMap = {
            'Less than 1 month': 'your emergency savings would likely cover less than one month of expenses',
            '1-3 months': 'your emergency savings would cover 1\u20133 months of expenses',
            '3-6 months': 'your emergency savings would cover 3\u20136 months of expenses',
            '6+ months': 'your emergency savings would cover over six months of expenses'
          };
          if (savings && savingsMap[savings]) savingsPhrase = savingsMap[savings];
          let protectionPhrase = '';
          if (hasProtection === 'No') protectionPhrase = "you don't have a dedicated income protection policy";
          let consequence = 'a prolonged interruption to your income could create financial challenges that need to be addressed';
          if (incomeStop === 'It would stop completely' || !incomeStop) {
            consequence = "a prolonged interruption to your income could place significant pressure on your finances before you're able to recover";
          } else if (incomeStop === 'It would reduce significantly') {
            consequence = 'even with some income remaining, a prolonged interruption could still create financial strain';
          }
          const middle = protectionPhrase ? `, and because ${protectionPhrase}` : '';
          return `Based on your answers, ${savingsPhrase}${middle}. As a result, ${consequence}.`;
        }
        if (dom.realLifeContext) return dom.realLifeContext.replace(/^Here\u2019s what this means in real life:\s*/, '');
        return null;
      };

      // ---- strengths explanation (replaces generic positive statements) ----
      const buildStrengthsExplanation = (cats, answers, prefix, dom) => {
        const entries = Object.entries(cats);
        if (entries.length === 0) return '';
        const strong = entries.filter(([, s]) => s >= 60);
        const weak = entries.filter(([, s]) => s < 50).sort(([, a], [, b]) => a - b);
        const parts = [];
        if (prefix === 'INC') {
          const finCommName = Object.keys(cats).find(k => k.toLowerCase().includes('financial commitment'));
          const incStabName = Object.keys(cats).find(k => k.toLowerCase().includes('income stabilit'));
          if (finCommName && cats[finCommName] >= 60 && answers['INC_015'] === 'No') {
            parts.push("One positive finding is that you\u2019re not currently carrying significant debt obligations. This gives you greater flexibility to build your emergency fund without the pressure of large monthly repayments.");
          }
          if (incStabName && cats[incStabName] >= 60) {
            parts.push(`Your ${incStabName.toLowerCase()} of ${cats[incStabName]}% indicates your current income sources are reasonably reliable.`);
          }
        }
        if (strong.length > 0 && parts.length === 0) {
          const sNames = strong.map(([n]) => n.toLowerCase());
          const sList = sNames.length === 1 ? sNames[0] : sNames.slice(0, -1).join(', ') + ' and ' + sNames[sNames.length - 1];
          parts.push(`Your ${sList} ${sNames.length === 1 ? 'is' : 'are'} relatively strong at ${strong.map(([, s]) => s).join('/')}%, providing a solid foundation for your ${dom.closingTerm}.`);
        }
        if (weak.length > 0) {
          const wNames = weak.map(([n]) => n.toLowerCase());
          const wList = wNames.length === 1 ? wNames[0] : wNames.slice(0, -1).join(', ') + ' and ' + wNames[wNames.length - 1];
          parts.push(`The greatest opportunity to strengthen your ${dom.closingTerm} lies in addressing your ${wList}.`);
        }
        if (parts.length === 0) parts.push(`Your overall ${dom.closingTerm} profile is well-balanced across all areas.`);
        return parts.join('\n\n');
      };

      // ---- resilience forecast ----
      const buildResilienceForecast = (cats, currentScore, answers, prefix, dom, reportName) => {
        const entries = Object.entries(cats);
        if (entries.length === 0) return null;
        const sorted = entries.sort(([, a], [, b]) => a - b);
        const wName = sorted[0][0];
        const wScore = sorted[0][1];
        const numP = entries.length;
        const currentSum = entries.reduce((sum, [, v]) => sum + v, 0);
        const projectedPillar = 70;
        const newSum = currentSum - wScore + projectedPillar;
        const projectedScore = Math.round(newSum / numP);
        const scoringConfig = require('../config/scoring/index');
        const prefixConfig = scoringConfig[prefix];
        let actionLines = [];
        if (prefixConfig && prefixConfig.improvements) {
          let used = 0;
          for (const [qId, qImprovements] of Object.entries(prefixConfig.improvements)) {
            if (used >= 3) break;
            const answer = answers[qId];
            if (answer && qImprovements[answer]) {
              const imp = qImprovements[answer];
              const verbMatch = imp.action.match(/^(Build|Get|Create|Review|Expand|Start|Consider|Supplement|Diversify|Strengthen|Extend|Increase|Reduce|Make|Explore)/i);
              const prefixWord = verbMatch ? verbMatch[1] : 'Build';
              const rest = imp.action.replace(/^(Build|Get|Create|Review|Expand|Start|Consider|Supplement|Diversify|Strengthen|Extend|Increase|Reduce|Make|Explore)\s+/i, '');
              actionLines.push(`\u2713 ${prefixWord} ${rest.charAt(0).toLowerCase() + rest.slice(1)}`);
              used++;
            }
          }
        }
        if (actionLines.length === 0) {
          const recTexts = dom.recommendationTexts || {};
          const wLower = wName.toLowerCase();
          const action = recTexts[wLower];
          if (action) {
            action.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3).forEach(step => {
              const clean = step.replace(/^(reviewing|building|considering|diversifying|getting|securing|ensuring|creating|starting)\s+/i, '');
              const vm = step.match(/^(reviewing|building|considering|diversifying|getting|securing|ensuring|creating|starting)/i);
              const vMap = { reviewing: 'Review', building: 'Build', considering: 'Consider', diversifying: 'Diversify', getting: 'Get', securing: 'Secure', ensuring: 'Ensure', creating: 'Create', starting: 'Start' };
              const pw = vm ? vMap[vm[1].toLowerCase()] || 'Build' : 'Build';
              actionLines.push(`\u2713 ${pw} ${clean}`);
            });
          } else {
            actionLines.push(`\u2713 Strengthen your ${wLower}`);
          }
        }
        return `Resilience Forecast\u2122\n\nIf you:\n${actionLines.slice(0, 3).join('\n')}\n\nYour ${reportName} score could improve from:\n${currentScore} \u2192 approximately ${projectedScore}`;
      };

      // ---- confidence-phrased recommendation ----
      const buildRecommendation = (cats, dom) => {
        const entries = Object.entries(cats);
        if (entries.length === 0) return null;
        const sorted = entries.sort(([, a], [, b]) => a - b);
        const weakestName = sorted[0][0];
        const weakestScore = sorted[0][1];
        const weakArea = weakestName.toLowerCase();
        const recTexts = dom.recommendationTexts || {};
        const action = recTexts[weakArea] || `reviewing your ${weakArea} to strengthen your ${dom.closingTerm}`;
        return `Recommended First Step\n\nBased on your responses, the single action most likely to improve your CoverScore\u2122 is ${action}.\n\nImproving this area from ${weakestScore}% is expected to have the greatest impact on your ${dom.closingTerm}.`;
      };

      // ===== Message 2: Risk Pillars + CoverScore Insight\u2122 + Personalized Context =====
      let msg2 = `Your Risk Pillars\n\n${pillarChart}`;
      const insightText = generateCoverScoreInsight(riskCats, answers, name, prefix);
      if (insightText) msg2 += `\n\n${insightText}`;
      const personalContext = buildRealLifeContext(answers, prefix, dom);
      if (personalContext) msg2 += `\n\n${personalContext}`;
      postMessages.push({ type: 'pillars', text: msg2, _delay: 3000 });

      // ===== Message 3: Risk Story\u2122 + Forecast + Recommendation + Report =====
      let msg3 = `Your Risk Story\u2122\n\n${buildStrengthsExplanation(riskCats, answers, prefix, dom)}`;
      const forecast = buildResilienceForecast(riskCats, assessmentData.score, answers, prefix, dom, reportName);
      if (forecast) msg3 += `\n\n${forecast}`;
      const recommendation = buildRecommendation(riskCats, dom);
      if (recommendation) msg3 += `\n\n${recommendation}`;
      msg3 += `\n\nYour complete ${reportName} is ready.\n\nIt includes:\n\n\u2713 Your detailed CoverScore breakdown\n\u2713 Personalised recommendations\n\u2713 Protection options\n\u2713 Practical next steps\n\n\uD83D\uDCC4 View My Report: ${reportUrl}`;
      postMessages.push({ type: 'report_link', text: msg3, _delay: 3000 });

      // ===== Message 4: Advisor CTA =====
      postMessages.push({
        type: 'advisor',
        text: `Would you like a Certified Risk Advisor to review your ${reportName} with you and show you practical ways to strengthen your financial resilience?\n\nA. Yes\nB. Not now`,
        _delay: 3000
      });
      console.log(`   [Phase 3] Ending sequence built (${postMessages.length} total post-messages)`);
    }

    // Acknowledge webhook immediately so Evolution API doesn't timeout
    // (line 100 already sends 200 OK immediately; this is a safety net)
    if (!res.headersSent) res.sendStatus(200);

    // Phase 4: Send remaining messages with real data and typing indicator
    console.log(`   [Phase 4] Sending ${postMessages.length} post-messages...`);
    for (let i = 0; i < postMessages.length; i++) {
      const msg = postMessages[i];
      if (!msg.text) continue;
      msg.text = fillTemplate(msg.text);

      // Use per-message delay if set, otherwise fallback to 12s for first post-message
      const msgDelay = msg._delay != null ? msg._delay : (i === 0 && preMessages.length > 0 ? 12000 : undefined);

      const sendResult = await sendWhatsApp(phoneNumber, null, { _message: msg.text, delay: msgDelay });
      if (!sendResult.success) {
        console.error(`   ❌ Failed to send message ${i}: ${sendResult.error}. Aborting.`);
        return;
      }

      chatHistory.push({
        role: 'assistant',
        content: msg.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      if (msg.type === 'milestone' || msg.type === 'insight' || msg.type === 'trust') {
        publishEvent(CCIE_EVENTS.MICRO_INSIGHT_DISPLAYED, ccieContext, {
          messageType: msg.type, text: msg.text.substring(0, 60)
        });
      }
    }

    console.log(`   [State Save] Saving lead state (finalState: ${assessmentData._scored ? 'awaiting_consultation' : nextState})...`);
    const finalState = assessmentData._scored ? 'awaiting_consultation' : nextState;
    await run('UPDATE leads SET wa_state = ?, assessment_data = ?, chat_history = ?, ccie_context = ? WHERE id = ?',
      [finalState, JSON.stringify(assessmentData), JSON.stringify(chatHistory), JSON.stringify(updatedCcieContext || ccieContext), lead.id]);

    if (assessmentData.name || assessmentData.email) {
      await run('UPDATE leads SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?',
        [assessmentData.name || null, assessmentData.email || null, lead.id]);
    }

    if (isFinished) {
      console.log(`   [Qualifier] Assessment finished — running lead qualifier...`);
      publishEvent(CCIE_EVENTS.ASSESSMENT_COMPLETED, ccieContext, {
        leadId: lead.id, score: assessmentData.score, isQualified: !!assessmentData.is_qualified
      });

      console.log(`   🧠 Running Lead Qualifier AI for Lead ${lead.id}...`);
      let assessData = {};
      try {
        if (lead.assessment_id) {
          const rec = await get('SELECT answers FROM assessments WHERE id = ?', [lead.assessment_id]);
          if (rec && rec.answers) assessData = JSON.parse(rec.answers);
        }
      } catch (e) { }

      const qualifierOutput = await getLeadQualifier([], assessData);
      console.log(`   ✅ Qualifier output: ${JSON.stringify(qualifierOutput)}`);

      await run(`
        UPDATE leads SET status = ?, pipeline_stage = ?, is_qualified = ?,
          consultation_preference = ?, primary_concern = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        qualifierOutput.lead_status || 'Qualified',
        (qualifierOutput.lead_status || '').toLowerCase().includes('hot') ? 4 : 3,
        assessmentData.is_qualified ? 1 : 0,
        assessmentData.consultation_preference || null,
        assessmentData.primary_concern || null,
        qualifierOutput.next_best_action + " - " + qualifierOutput.qualification_reasoning,
        lead.id
      ]);

      if (process.env.ADMIN_PHONE && ((qualifierOutput.lead_status || '').toLowerCase().includes('hot') || assessmentData.is_qualified)) {
        const qualDetails = [];
        if (assessmentData.primary_concern) qualDetails.push(`Primary Concern: ${assessmentData.primary_concern}`);
        if (assessmentData.consultation_preference) qualDetails.push(`Preferred Contact: ${assessmentData.consultation_preference}`);
        if (qualifierOutput.next_best_action) qualDetails.push(`Suggested Action: ${qualifierOutput.next_best_action}`);
        const displayName = (assessmentData.entity_type === 'business' && assessmentData.business_name) ? assessmentData.business_name : (assessmentData.name || lead.name);
        const notifMsg = `🔥 *NEW QUALIFIED LEAD* 🔥\n\n👤 *Name:* ${displayName}\n📞 *Phone:* ${phoneNumber}\n🛡️ *CoverScore:* ${lead.score || 'N/A'}\n📊 *Risk Level:* ${(lead.risk_level || 'N/A').toUpperCase()}\n\n📝 *CRM Insight:*\n${qualifierOutput.lead_status} - ${qualifierOutput.qualification_reasoning}\n\n🔍 *Qualification Details:*\n${qualDetails.join('\n')}\n\n🔗 View in CRM: ${process.env.APP_URL || 'https://coverscore.site'}/admin/dashboard`;
        await sendWhatsApp(process.env.ADMIN_PHONE, null, { _message: notifMsg });
        publishEvent(CCIE_EVENTS.ADVISOR_REQUESTED, ccieContext, { adminPhone: process.env.ADMIN_PHONE, leadId: lead.id });
      }

      if (!assessmentData.is_qualified) {
        await run(`UPDATE leads SET status = 'WhatsApp Engaged', pipeline_stage = 3, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [lead.id]);
      }

      publishEvent(CCIE_EVENTS.CONVERSATION_COMPLETED, ccieContext, { leadId: lead.id });
    }

  } catch (error) {
    console.error('❌ Webhook processing error:', error.message || error);
    console.error('   Stack:', error.stack || '(no stack)');
    try {
      const errJid = req.body?.data?.key?.remoteJid;
      if (errJid) {
        const errPhone = errJid.split('@')[0];
        await sendWhatsApp(errPhone, null, { _message: "I ran into an issue processing your response. No worries — your progress is saved. Please type START ASSESSMENT to continue." });
      }
    } catch (notifErr) {
      console.error('Failed to send error notification:', notifErr);
    }
  }

  if (!res.headersSent) {
    res.sendStatus(200);
  }
});

module.exports = router;
