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

  // For INC, build a single concise discovery paragraph
  if (prefix === 'INC') {
    const incomeSrc = answers['INC_011'];
    const savings = answers['INC_012'];
    const hasProtection = answers['INC_014'];
    const incomeStop = answers['INC_018'];

    let srcPhrase = 'your income';
    if (incomeSrc === 'Salary from employment') srcPhrase = 'your salary';
    else if (incomeSrc === 'Freelance/Contract') srcPhrase = 'your freelance income';
    else if (incomeSrc === 'Business owner') srcPhrase = 'your business income';

    let savingsPhrase = '';
    const savingsMap = {
      'Less than 1 month': 'less than one month of expenses',
      '1-3 months': 'about 1\u20133 months of expenses',
      '3-6 months': 'about 3\u20136 months of expenses',
      '6+ months': 'over six months of expenses'
    };
    if (savings && savingsMap[savings]) savingsPhrase = savingsMap[savings];
    else savingsPhrase = 'less than one month of expenses';

    let protectionPhrase = '';
    if (hasProtection === 'No') protectionPhrase = "and you don't have income protection cover";

    let incomeStopPhrase = '';
    if (incomeStop === 'It would stop completely' || !incomeStop) {
      incomeStopPhrase = 'an unexpected interruption to your income could quickly affect your financial stability';
    } else if (incomeStop === 'It would reduce significantly') {
      incomeStopPhrase = 'even a partial income reduction could create financial pressure over time';
    } else if (incomeStop === 'My income would continue') {
      incomeStopPhrase = 'continuing your income during disruption is important, but gaps in savings and cover remain';
    }

    const middle = protectionPhrase ? `, ${protectionPhrase}` : '';
    const body = `Your assessment shows that your income resilience currently depends almost entirely on ${srcPhrase}. Because your emergency savings would cover ${savingsPhrase}${middle}, ${incomeStopPhrase}.`;
    return `CoverScore Insight\u2122 \u2B50\n\n${body}`;
  }

  // For all other prefixes, use domain config insight texts (concise single paragraph)
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
  } else {
    body = dom.insightTexts?.catchAll ||
      `Your assessment shows that your biggest opportunity to strengthen your ${dom.improvementTerm} is your ${weakestName.toLowerCase()}.`;
  }

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
    try { chatHistory = JSON.parse(lead.chat_history || '[]'); } catch (e) { chatHistory = []; }
    try { assessmentData = JSON.parse(lead.assessment_data || '{}'); } catch (e) { assessmentData = {}; }
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
          try {
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

            let estimatedPremium = 0;
            if (scoreResult.min_loss) {
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
                name = ?, email = ?,
                status = 'Report Sent', pipeline_stage = 2,
                engagement_points = engagement_points + 20, sales_score = sales_score + 20,
                estimated_premium = ?,
                birth_date = ?, anniversary_date = ?, contact_person = ?
              WHERE id = ?
            `, [
              assessmentId, scoreResult.score, dbRiskLevel, entityType,
              (entityType === 'business' && assessmentData.business_name) ? assessmentData.business_name : (assessmentData.name || 'WhatsApp User'),
              assessmentData.email || 'whatsapp@coverscore.site',
              estimatedPremium,
              assessmentData.birth_date || null, assessmentData.anniversary_date || null,
              assessmentData.name || 'WhatsApp User', lead.id
            ]);
            console.log(`   📊 Assessment completed. Lead ${lead.id} → qualification state`);
          } catch (e) {
            console.error('Background setImmediate error:', e);
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

      // ===== Message 1: Completion + Summary + Score + Resilience Level + Highest Priority =====
      const msg1Parts = [
        `\uD83C\uDF89 Your ${dom.assessmentTitle} Assessment is complete.\n\nHere\u2019s a summary of what we discovered.`,
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

      // ---- Risk Story\u2122: consequence narrative (what could happen if nothing changes) ----
      const buildRiskStory = (cats, answers, prefix, dom) => {
        const entries = Object.entries(cats);
        if (entries.length === 0) return '';
        if (prefix === 'INC') {
          const incomeStop = answers['INC_018'];
          const savings = answers['INC_012'];
          const hasProtection = answers['INC_014'];
          const hasDebt = answers['INC_015'];
          const incomeSrc = answers['INC_011'];

          let scenario = "If you were unable to work for the next six months because of illness or injury, here\u2019s what your assessment suggests:";
          const consParts = [];

          if (!incomeStop || incomeStop === 'It would stop completely') {
            consParts.push("your income would stop");
          } else if (incomeStop === 'It would reduce significantly') {
            consParts.push("your income would reduce significantly");
          }

          if (!savings || savings === 'Less than 1 month') {
            consParts.push("your emergency savings would be exhausted quickly");
          } else if (savings === '1-3 months') {
            consParts.push("your emergency savings would only cover a few months");
          }

          if (hasProtection === 'No') {
            consParts.push("you don't have income protection cover to replace lost earnings");
          }

          if (!hasDebt || hasDebt === 'Yes') {
            consParts.push("ongoing financial commitments could become difficult to maintain");
          } else if (hasDebt === 'No') {
            consParts.push("and your existing commitments could become harder to maintain");
          }

          if (consParts.length > 0) {
            const last = consParts.pop();
            const consequence = consParts.length > 0
              ? consParts.join(', ') + ', and ' + last
              : last;
            scenario += `\n\nBased on your responses, ${consequence}.`;
          }

          scenario += `\n\nThese circumstances could place considerable pressure on both you and your household. The goal is to protect your income when life is interrupted.`;
          return scenario;
        }
        if (prefix === 'YPR') {
          const careerStability = answers['YPR_011'];
          const criticalIllness = answers['YPR_012'];
          const incomeStability = answers['YPR_013'];
          const hasInsurance = answers['YPR_014'];
          const hasGoal = answers['YPR_015'];

          const positives = [];
          const gaps = [];

          if (hasGoal === 'Yes') positives.push("you've already started saving toward a major life goal");
          if (careerStability === 'Over 5 years') positives.push("you've built solid career stability");
          if (criticalIllness === 'Yes easily') positives.push("you have an emergency fund that can handle unexpected costs");
          if (incomeStability === 'Yes') positives.push("your household could manage without your income for a period");

          if (hasInsurance === 'No') gaps.push("you don't have personal health or accident insurance");
          if (criticalIllness === 'No') gaps.push("a single unexpected medical event could force you to use your savings or take on debt");
          if (criticalIllness === 'With difficulty') gaps.push("an unexpected health event would still create significant financial strain");
          if (careerStability === 'Under 2 years') gaps.push("you're still early in your career, so your income history and financial buffer are still developing");
          if (incomeStability === 'No') gaps.push("if your income stopped, your household would struggle to maintain financial stability");

          let story;
          if (positives.length > 0) {
            const lastPos = positives.pop();
            const posStr = positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos;
            story = `You've already taken positive steps\u2014${posStr}. `;
          } else {
            story = `You're at the beginning of your financial journey, and that's exactly the right time to build strong foundations. `;
          }

          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            const gapStr = gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap;
            story += `However, ${gapStr}. `;
          }

          story += `Without action, an unexpected event could delay important life goals like buying a home, starting a family, or investing in your future. The progress you\u2019ve already made deserves to be protected.`;
          return story;
        }
        if (prefix === 'HLT') {
          const insurance = answers['HLT_012'];
          const age = answers['HLT_009'];
          const checkups = answers['HLT_015'];
          const conditions = answers['HLT_014'];
          const emergencyFund = answers['HLT_013'];
          const surgeryCover = answers['HLT_016'];
          const illnessResilience = answers['HLT_017'];
          const dependants = answers['HLT_010'];

          const positives = [];
          const gaps = [];

          if (insurance === 'Private Health Insurance') positives.push("you have private health insurance in place");
          if (insurance === 'Employer HMO') positives.push("you have health coverage through your employer");
          if (checkups === 'Every 6 months' || checkups === 'Annually') positives.push("you stay on top of your health with regular check-ups");
          if (emergencyFund === 'Savings') positives.push("you have savings set aside for medical emergencies");
          if (conditions === 'None') positives.push("you don't currently have any chronic health conditions");

          if (insurance === 'None') gaps.push("you don't have any health insurance coverage");
          if (surgeryCover === 'No') gaps.push("your current cover may not be sufficient for major surgical procedures");
          if (checkups === 'Rarely/Only when sick') gaps.push("you only visit a doctor when you're already unwell, which means you may miss early detection of health issues");
          if (illnessResilience === 'No') gaps.push("your household would face financial pressure if a serious illness kept you from working");
          if (dependants === '4+' || dependants === '3') gaps.push("a health emergency would affect not just you but multiple family members who depend on you");

          let story = '';
          if (positives.length > 0) {
            const lastPos = positives.pop();
            story = `You've taken positive steps to manage your health\u2014${positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos}. `;
          }

          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }

          story += `If a serious health issue required extended treatment, gaps in your coverage could create financial pressure at a time when you should be focused on recovery. The goal is to stay healthy without financial hardship.`;
          return story;
        }
        if (prefix === 'FAM') {
          const dependents = answers['FAM_011'];
          const incomeBuffer = answers['FAM_012'];
          const insurance = answers['FAM_013'];
          const education = answers['FAM_014'];
          const healthCover = answers['FAM_015'];

          const positives = [];
          const gaps = [];

          if (insurance === 'Yes') positives.push("your family has insurance protection in place");
          if (healthCover === 'Yes') positives.push("your family is covered by a health plan");
          if (education === 'Yes') positives.push("you've planned for your children's education costs");
          if (incomeBuffer === 'Over 6 months') positives.push("your family has more than six months of income buffer");

          if (insurance === 'No') gaps.push("your family doesn't have adequate insurance coverage");
          if (insurance === 'Not sure') gaps.push("you're not certain whether your family's insurance coverage is adequate");
          if (healthCover === 'No') gaps.push("your family doesn't have comprehensive health insurance");
          if (incomeBuffer === 'Less than 3 months') gaps.push("your family would face financial difficulty within three months if your income stopped");
          if (education === 'No') gaps.push("your children's education costs are not secured against unexpected events");
          if (dependents === '3 or more') gaps.push("with multiple people relying on you, the impact of any disruption is magnified");

          let story = '';
          if (positives.length > 0) {
            const lastPos = positives.pop();
            story = `You've taken important steps to protect your family\u2014${positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos}. `;
          } else {
            story = `Your family depends on you, and that responsibility is at the heart of this assessment. `;
          }

          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }

          story += `Without action, an unexpected event could affect not just your finances but the daily lives of the people who depend on you. The people who depend on you deserve peace of mind.`;
          return story;
        }
        if (prefix === 'ENT') {
          const keyPerson = answers['ENT_011'];
          const guarantees = answers['ENT_012'];
          const survival = answers['ENT_013'];
          const keyInsurance = answers['ENT_014'];
          const assetSeparation = answers['ENT_015'];

          const positives = [];
          const gaps = [];

          if (keyPerson === 'No it runs itself') positives.push("your business doesn't depend entirely on your personal involvement");
          if (keyInsurance === 'Yes') positives.push("you have key person insurance in place");
          if (assetSeparation === 'Yes') positives.push("you've separated your personal and business assets");
          if (guarantees === 'No') positives.push("you've avoided personal guarantees on business debts");

          if (keyPerson === 'Yes completely') gaps.push("your business completely depends on your personal involvement, creating significant risk if you're unavailable");
          if (survival === 'No') gaps.push("your business would not survive three months without you");
          if (survival === 'Not sure') gaps.push("you're uncertain whether your business could survive without you");
          if (keyInsurance === 'No') gaps.push("you don't have key person insurance to protect the business if you become incapacitated");
          if (guarantees === 'Yes') gaps.push("your personal assets are at risk due to personal guarantees on business debts");
          if (assetSeparation === 'No') gaps.push("your personal and business assets are not adequately separated");

          let story = '';
          if (positives.length > 0) {
            const lastPos = positives.pop();
            story = `You've built smart practices into your business\u2014${positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos}. `;
          } else {
            story = `Your business is an extension of you, and that personal investment is both your greatest strength and your greatest risk. `;
          }

          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }

          story += `Without addressing these gaps, a single unexpected event could put both your business and your personal finances at risk. Protect both your company and your personal future.`;
          return story;
        }
        if (prefix === 'RET') {
          const plan = answers['RET_010'];
          const horizon = answers['RET_011'];
          const pension = answers['RET_012'];
          const medicalConcern = answers['RET_013'];
          const longTermCare = answers['RET_014'];
          const legacy = answers['RET_015'];

          const positives = [];
          const gaps = [];

          if (plan === 'I already have a written retirement plan') positives.push("you have a written retirement plan in place");
          if (plan === "I'm saving but don't have a clear plan") positives.push("you're already saving for retirement");
          if (pension === 'Yes') positives.push("you have a dedicated pension or retirement savings account");
          if (legacy === 'Yes, I have a documented plan') positives.push("you've documented your estate and legacy plans");

          if (pension === 'No') gaps.push("you don't have a dedicated pension or retirement savings account");
          if (plan === "I haven't thought seriously about retirement") gaps.push("you haven't started planning for retirement yet");
          if (plan === 'I know I should start planning') gaps.push("you know you should be planning for retirement but haven't taken concrete action");
          if (longTermCare === 'No') gaps.push("you don't have a plan for long-term care or critical illness needs in retirement");
          if (medicalConcern === 'Very concerned') gaps.push("you're very concerned about medical costs exhausting your retirement savings");
          if (horizon === 'Within 5 years' && pension === 'No') gaps.push("you're close to retirement but without sufficient savings in place");

          let story = '';
          if (positives.length > 0) {
            const lastPos = positives.pop();
            story = `You've taken important steps toward securing your retirement\u2014${positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos}. `;
          } else {
            story = `Retirement may feel distant, but the decisions you make today determine whether your later years are defined by freedom or financial pressure. `;
          }

          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }

          story += `Time is the most powerful asset in retirement planning. Addressing these gaps now gives your savings more time to grow. Confidence in retirement comes from preparation, not hope.`;
          return story;
        }
        if (prefix === 'HOM') {
          const tenure = answers['HOM_011'];
          const insurance = answers['HOM_012'];
          let story = '';
          if (tenure === 'Own') story += "You own your home, which is a valuable asset that deserves to be protected. ";
          else if (tenure === 'Rent') story += "You're currently renting, which means your personal belongings and liability need coverage even though you don't own the property. ";
          else story += "Without stable housing, you face significant exposure to cost changes and lack the security of homeownership. ";
          if (insurance === 'No') story += "Without adequate home insurance, a fire, theft, or liability claim could result in significant financial loss that could have been avoided. ";
          else story += "While you have some protections in place, making sure your coverage matches the full value of your belongings is essential. ";
          story += "Your home is more than a building\u2014it's your foundation. Protecting it protects everything else.";
          return story;
        }
        if (prefix === 'MOT') {
          const count = answers['MOT_011'];
          const insurance = answers['MOT_012'];
          let story = '';
          if (count === '1') story += "You have a single vehicle, which simplifies your risk exposure. ";
          else if (count === '2') story += "With two vehicles, your combined exposure to accidents, theft, and repair costs increases. ";
          else story += "With multiple vehicles, your overall risk exposure and insurance costs multiply significantly. ";
          if (insurance === 'No') story += "Without comprehensive motor insurance, a serious accident or theft could leave you with substantial out-of-pocket costs. ";
          else story += "Having insurance on your primary vehicle is a good start, but ensuring every vehicle you use is adequately covered is important. ";
          story += "Being on the road shouldn\u2019t mean being at risk. Protect your mobility so you can keep moving.";
          return story;
        }
        if (prefix === 'SME') {
          const workforce = answers['SME_013'];
          const revenue = answers['SME_014'];
          const propertyIns = answers['SME_016'];
          const disasterSurvival = answers['SME_017'];
          const positives = [];
          const gaps = [];
          if (propertyIns === 'Yes') positives.push("you have fire and burglary insurance for your business");
          if (disasterSurvival === 'Yes easily') positives.push("your business could recover easily from a major disruption");
          if (workforce === '1-10') positives.push("you run a lean operation with manageable workforce exposure");
          if (workforce === '51+') gaps.push("you have a significant workforce that creates substantial employment liability exposure");
          if (revenue === 'Over \u20A6200M') gaps.push("your business has significant financial exposure that needs adequate coverage");
          if (propertyIns === 'No') gaps.push("you don't have fire and burglary insurance for your business");
          if (disasterSurvival === 'No, we would close') gaps.push("your business would not survive a three-month closure");
          if (disasterSurvival === 'With difficulty') gaps.push("your business would struggle to recover from a major disaster");
          let story = '';
          if (positives.length > 0) {
            const lastPos = positives.pop();
            story = `You've put important safeguards in place for your business\u2014${positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos}. `;
          } else {
            story = `Your business is the result of hard work, and every day you're building something worth protecting. `;
          }
          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }
          story += `A fire, burglary, or prolonged closure could undo years of effort. A disruption shouldn't undo everything you've built.`;
          return story;
        }
        if (prefix === 'MFG') {
          const workforce = answers['MFG_013'];
          const equipment = answers['MFG_014'];
          const facilityIns = answers['MFG_016'];
          const disasterRecovery = answers['MFG_017'];
          const gaps = [];
          if (workforce === '200+') gaps.push("your large workforce creates significant liability exposure");
          if (equipment === 'Immediately') gaps.push("a critical machine breakdown would halt production immediately");
          if (facilityIns === 'No') gaps.push("you don't have fire and special perils insurance for your facility");
          if (disasterRecovery === 'No, we would close') gaps.push("your business would not survive a major disaster closure");
          if (disasterRecovery === 'With difficulty') gaps.push("your business would struggle to recover from a major disaster");
          let story = equipment === 'Immediately'
            ? "Your manufacturing operation depends on equipment running continuously. "
            : "Your manufacturing operation has some resilience in its equipment setup. ";
          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }
          story += `In manufacturing, downtime is expensive and protection is essential.`;
          return story;
        }
        if (prefix === 'HOS') {
          const patientExposure = answers['HOS_013'];
          const medicalLiability = answers['HOS_015'];
          const equipmentValue = answers['HOS_016'];
          const equipmentIns = answers['HOS_017'];
          const gaps = [];
          if (patientExposure === 'Over 100') gaps.push("your large patient volume creates significant liability exposure");
          if (medicalLiability === 'No') gaps.push("you don't have professional indemnity or medical malpractice insurance");
          if (equipmentValue === 'Yes') gaps.push("you have high-value medical equipment that needs specialized coverage");
          if (equipmentIns === 'No') gaps.push("your critical equipment is not insured against damage or breakdown");
          let story = "Your healthcare facility's first priority is patient care, but without proper protection, a liability claim or equipment failure could disrupt that care. ";
          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `${gaps.length > 0 ? gaps.join(', ') + ', and ' : ''}${lastGap}. `;
          }
          story += `In healthcare, patient care depends on being prepared for anything.`;
          return story;
        }
        if (prefix === 'SCH') {
          const studentCount = answers['SCH_013'];
          const injuryLiability = answers['SCH_016'];
          const propertyIns = answers['SCH_017'];
          const gaps = [];
          if (studentCount === 'Over 500') gaps.push("your large student population creates substantial liability exposure");
          if (injuryLiability === 'No') gaps.push("you don't have insurance coverage if a student is injured on your premises");
          if (propertyIns === 'No') gaps.push("you don't have fire insurance for your school buildings");
          let story = "Your school is responsible for the safety of every student in your care. ";
          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }
          story += `A student injury or property damage claim could disrupt everything\u2014because the safety of your students and staff comes first.`;
          return story;
        }
        if (prefix === 'CHR') {
          const congregation = answers['CHR_013'];
          const valuableAssets = answers['CHR_014'];
          const eventLiability = answers['CHR_015'];
          const buildingIns = answers['CHR_017'];
          const gaps = [];
          if (congregation === 'Over 1000') gaps.push("your large congregation creates significant liability during gatherings");
          if (eventLiability === 'No') gaps.push("you don't have insurance if a congregant is injured on your premises");
          if (valuableAssets === 'Yes') gaps.push("you have valuable instruments and equipment that need specialized coverage");
          if (buildingIns === 'No') gaps.push("your church building and contents are not insured against fire");
          let story = "Your church serves as a gathering place for your community, and protecting that space is part of protecting your mission. ";
          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }
          story += `A fire, injury, or theft could disrupt your services\u2014because protecting your congregation protects your mission.`;
          return story;
        }
        if (prefix === 'CON') {
          const projectCount = answers['CON_013'];
          const machinery = answers['CON_014'];
          const contractorIns = answers['CON_015'];
          const accidentCover = answers['CON_016'];
          const penaltyProtection = answers['CON_017'];
          const gaps = [];
          if (projectCount === 'More than 5') gaps.push("managing many concurrent projects increases your overall risk exposure");
          if (machinery === 'Yes') gaps.push("heavy machinery on site creates significant liability and damage risk");
          if (contractorIns === 'No') gaps.push("you don't have contractor's all-risk insurance for your projects");
          if (accidentCover === 'No') gaps.push("your on-site workers don't have group personal accident cover");
          if (penaltyProtection === 'No') gaps.push("you're not protected against project delay penalties");
          let story = "Construction projects involve inherent risk, but the right protection keeps those risks from becoming crises. ";
          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }
          story += `An accident, equipment damage, or project delay\u2014every project deserves to be protected.`;
          return story;
        }
        if (prefix === 'TRN') {
          // same pattern as CON
          const fleetSize = answers['TRN_013'];
          const goodsIns = answers['TRN_015'];
          const driverCover = answers['TRN_016'];
          const compliance = answers['TRN_017'];
          const gaps = [];
          if (fleetSize === 'Over 20') gaps.push("your large fleet creates significant cumulative risk exposure");
          if (goodsIns === 'No') gaps.push("you don't have goods-in-transit insurance for your cargo");
          if (driverAccident === 'No') gaps.push("your drivers are not covered by group personal accident insurance");
          if (compliance === 'No') gaps.push("your fleet vehicles are not comprehensively insured");
          if (compliance === 'Some of them') gaps.push("only some of your fleet vehicles have comprehensive motor insurance");
          let story = fleetSize === 'Over 20'
            ? "With a fleet of this size, every vehicle on the road represents both opportunity and risk. "
            : "Your fleet is the backbone of your transport operation. ";
          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }
          story += `An accident, cargo theft, or compliance issue\u2014your fleet should keep moving, not stop for the unexpected.`;
          return story;
        }
        // Generic fallback
        return `Your overall ${dom.closingTerm} profile shows areas of strength and opportunities to build greater resilience for the future.`;
      };

      // ---- resilience forecast (illustrative, based on improvement gains) ----
      const buildResilienceForecast = (cats, currentScore, answers, prefix, dom, reportName) => {
        const entries = Object.entries(cats);
        if (entries.length === 0) return null;
        const sorted = entries.sort(([, a], [, b]) => a - b);
        const wName = sorted[0][0];
        const scoringConfig = require('../config/scoring/index');
        const prefixConfig = scoringConfig[prefix];
        let actionLines = [];
        let totalGain = 0;
        if (prefixConfig && prefixConfig.improvements) {
          let used = 0;
          for (const [qId, qImprovements] of Object.entries(prefixConfig.improvements)) {
            if (used >= 3) break;
            const answer = answers[qId];
            if (answer && qImprovements[answer]) {
              const imp = qImprovements[answer];
              totalGain += imp.gain;
              const verbMatch = imp.action.match(/^(Build|Get|Create|Review|Expand|Start|Consider|Supplement|Diversify|Strengthen|Extend|Increase|Reduce|Make|Explore|Begin)/i);
              const prefixWord = verbMatch ? verbMatch[1] : 'Build';
              const rest = imp.action.replace(/^(Build|Get|Create|Review|Expand|Start|Consider|Supplement|Diversify|Strengthen|Extend|Increase|Reduce|Make|Explore|Begin)\s+/i, '');
              actionLines.push(`\u2713 ${prefixWord} ${rest.charAt(0).toLowerCase() + rest.slice(1)}`);
              used++;
            }
          }
        }
        let projectedScore = Math.min(Math.round(currentScore + totalGain), 95);
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
          const fallbackGain = Math.round((95 - currentScore) * 0.6);
          projectedScore = Math.max(Math.round(currentScore + fallbackGain), Math.round(currentScore * 1.5));
        }
        return { text: `Resilience Forecast\u2122\n\nHere\u2019s how your resilience could improve\n${actionLines.slice(0, 3).join('\n')}\n\nYour ${reportName} score could improve from\n${currentScore} \u2192 approximately ${projectedScore}`, projectedScore };
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
        return `Recommended First Step\n\nThe single action most likely to improve your ${dom.closingTerm} is ${action}.\n\nImproving this area from ${weakestScore}% is expected to have the greatest impact on your ${dom.closingTerm}.`;
      };

      const reportNames = {
        HLT: 'Health Protection Report\u2122', YPR: 'Young Professional Report\u2122',
        ENT: 'Entrepreneur Report\u2122', FAM: 'Family Protection Report\u2122',
        INC: 'Income Protection Report\u2122', RET: 'Retirement Readiness Report\u2122',
        HOM: 'Home Protection Report\u2122', MOT: 'Motor Protection Report\u2122',
        SME: 'Business Risk Report\u2122', MFG: 'Manufacturing Risk Report\u2122',
        HOS: 'Hospital Risk Report\u2122', SCH: 'School Risk Report\u2122',
        CHR: 'Church Risk Report\u2122', CON: 'Construction Risk Report\u2122',
        TRN: 'Transport Risk Report\u2122'
      };
      const reportName = reportNames[prefix] || `${dom.assessmentTitle} Report\u2122`;

      const makePillarBar = (s) => {
        const filled = Math.round(Math.min(s, 100) / 10);
        return '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
      };
      const pillarNames = Object.keys(riskCats);
      const maxNameLen = pillarNames.length > 0 ? Math.max(...pillarNames.map(n => n.length), 20) : 20;
      const pillarChart = Object.entries(riskCats)
        .sort(([, a], [, b]) => b - a)
        .map(([n, s]) => `${n.padEnd(maxNameLen)} ${makePillarBar(s)} ${s}%`)
        .join('\n');

      // ===== Message 2: Risk Pillars + CoverScore Insight\u2122 =====
      let msg2 = `Your Risk Pillars\n\n${pillarChart}`;
      const insightText = generateCoverScoreInsight(riskCats, answers, name, prefix);
      if (insightText) msg2 += `\n\n${insightText}`;
      postMessages.push({ type: 'pillars', text: msg2, _delay: 3000 });

      // ===== Message 3: Risk Story\u2122 + Forecast + Progress Potential + Recommendation + Report =====
      let msg3 = `Your Risk Story\u2122\n\n${buildRiskStory(riskCats, answers, prefix, dom)}`;
      const forecast = buildResilienceForecast(riskCats, assessmentData.score, answers, prefix, dom, reportName);
      if (forecast) msg3 += `\n\n${forecast.text}`;
      // Your Improvement Potential\u2122
      if (forecast && forecast.projectedScore > assessmentData.score) {
        const diff = forecast.projectedScore - assessmentData.score;
        msg3 += `\n\nYour Improvement Potential\u2122\n\nCurrent CoverScore\u2122\n${assessmentData.score}\n\n\u2B07\n\nPotential CoverScore\u2122\n${forecast.projectedScore}\n\nYou could improve your resilience by approximately ${diff} points by implementing the recommendations in your report.`;
      }
      const recommendation = buildRecommendation(riskCats, dom);
      if (recommendation) msg3 += `\n\n${recommendation}`;
      msg3 += `\n\nYour complete ${reportName} is ready.\n\nIt includes:\n\n\u2713 Your detailed CoverScore breakdown\n\u2713 Personalised recommendations\n\u2713 Protection options\n\u2713 Practical next steps\n\n\uD83D\uDCC4 View My Report: ${reportUrl}`;
      postMessages.push({ type: 'report_link', text: msg3, _delay: 3000 });

      // ===== Message 4: Advisor CTA =====
      const advisorCTAs = {
        INC: 'review your income protection report with you and help you build a plan to protect your income when life is interrupted',
        HLT: 'review your health protection report with you and help you build a plan to stay healthy without financial hardship',
        YPR: 'review your young professional report with you and help you protect the progress you\u2019re building',
        FAM: 'review your family protection report with you and help you give your family the peace of mind they deserve',
        ENT: 'review your business protection report with you and help you protect both your company and your personal future',
        RET: 'review your retirement readiness report with you and help you build confidence that comes from preparation, not hope',
        HOM: 'review your home protection report with you and help you protect what matters most',
        MOT: 'review your motor protection report with you and help you stay safe on the road without being at risk',
        SME: 'review your business risk report with you and help you make sure a disruption doesn\u2019t undo everything you\u2019ve built',
        MFG: 'review your manufacturing risk report with you and help you keep production running without costly downtime',
        HOS: 'review your healthcare risk report with you and help you ensure your facility is prepared for anything',
        SCH: 'review your school risk report with you and help you put the safety of your students and staff first',
        CHR: 'review your church risk report with you and help you protect your congregation and your mission',
        CON: 'review your construction risk report with you and help you make sure every project is protected',
        TRN: 'review your transport risk report with you and help you keep your fleet moving'
      };
      const ctaPhrase = advisorCTAs[prefix] || 'show you practical ways to strengthen your financial resilience';
      postMessages.push({
        type: 'advisor',
        text: `Would you like a Certified Risk Advisor to ${ctaPhrase}?\n\nA. Yes\nB. Not now`,
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
        console.error(`   ❌ Failed to send message ${i}: ${sendResult.error}. Saving state and aborting.`);
        await run('UPDATE leads SET wa_state = ?, assessment_data = ?, chat_history = ?, ccie_context = ? WHERE id = ?',
          [currentState, JSON.stringify(assessmentData), JSON.stringify(chatHistory), JSON.stringify(updatedCcieContext || ccieContext), lead.id]);
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
