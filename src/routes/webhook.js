const express = require('express');
const router = express.Router();
const { sendWhatsApp } = require('../services/whatsappService');
const emailService = require('../services/emailService');
const { get, run } = require('../config/database');
const { generateRiskReport, getLeadQualifier, getWhatsappAdvisor } = require('../services/aiService');
const { calculateScore } = require('../services/scoringEngine');
const { generateRecommendations } = require('../services/cre');
const ccieEngine = require('../services/ccieEngine');
const { CCIE_EVENTS, publishEvent } = require('../services/ccieEvents');

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
    const reachedResults = ccieEngine.determinePhase(nextState) === 'RESULTS';

    if ((isFinished || reachedResults) && !assessmentData._scored) {
      console.log(`   [CCIE SCORING] Calculating CoverScore for ${phoneNumber}`);
      const finalAnswers = { ...(assessmentData.answers || {}), template_selection: { template_id: prefix } };
      try {
        const scoreResult = await calculateScore(finalAnswers);
        assessmentData.score = scoreResult.score;
        assessmentData.riskLevel = scoreResult.riskLevel;
        assessmentData.identified_gaps = scoreResult.identified_gaps || [];
        assessmentData.min_loss = scoreResult.min_loss;
        assessmentData.max_loss = scoreResult.max_loss;

        const fb = {
          HLT: { strengths: "✓ You already have a health insurance plan.\n✓ You are aware of your family's medical history.", risks: "⚠ Your current health plan may not provide sufficient coverage for major illnesses.\n⚠ You rely heavily on out-of-pocket payments.\n⚠ You do not have Critical Illness protection.", recommendations: "• Review your HMO benefits.\n• Compare health plans that provide wider hospital coverage.\n• Schedule an annual preventive health screening." },
          ENT: { strengths: "✓ Strong business vision\n✓ Market awareness", risks: "⚠ High key-person dependency\n⚠ Inadequate liability protection", recommendations: "• Review Key Person Insurance.\n• Separate personal and business assets." },
          FAM: { strengths: "✓ Clear long-term goals\n✓ Strong familial support", risks: "⚠ Inadequate life cover\n⚠ Education funding gap", recommendations: "• Review Life Insurance policy.\n• Set up an education trust." },
          DEFAULT: { strengths: "✓ Career Stability\n✓ Digital Safety\n✓ Personal Responsibility", risks: "⚠ Limited emergency savings\n⚠ Inadequate income protection\n⚠ No long-term financial protection strategy", recommendations: "• Build an emergency fund\n• Review income protection\n• Begin a structured long-term financial plan" }
        };
        const fallbacks = fb[prefix] || fb.DEFAULT;

        let strengthsText = fallbacks.strengths;
        if (scoreResult.risk_categories) {
          const strengthLabels = {
            'Medical Risk': 'Health Management',
            'Financial Risk': 'Financial Planning',
            'Property Risk': 'Property Protection',
            'Liability Risk': 'Liability Management',
            'Cyber Risk': 'Cybersecurity',
            'Income Risk': 'Income Protection',
            'Business Risk': 'Business Resilience',
            'Family Risk': 'Family Protection',
            'Retirement Risk': 'Retirement Readiness',
            'Motor Risk': 'Motor Coverage',
            'Travel Risk': 'Travel Protection',
            'Education Risk': 'Education Planning',
          };
          const strongCats = Object.entries(scoreResult.risk_categories)
            .filter(([k, v]) => v >= 80)
            .map(([k, v]) => '✓ ' + (strengthLabels[k] || k));
          strengthsText = strongCats.length > 0 ? strongCats.join('\n') : "✓ Strong potential for risk reduction\n✓ High opportunity for coverage optimization";
        }
        assessmentData.strengths = strengthsText;
        assessmentData.top_risks = scoreResult.identified_gaps && scoreResult.identified_gaps.length > 0
          ? scoreResult.identified_gaps.slice(0, 3).map(g => '⚠ ' + g).join('\n') : fallbacks.risks;
        assessmentData.recommendations = scoreResult.recommendations && scoreResult.recommendations.length > 0
          ? scoreResult.recommendations.slice(0, 3).map(r => '• ' + r).join('\n') : fallbacks.recommendations;
        assessmentData._scored = true;

        const entityType = (lead.industry === 'personal' || lead.industry === 'family') ? 'individual' : 'business';
        const assessmentDataObj = {
          answers: finalAnswers, score: scoreResult.score, riskLevel: scoreResult.riskLevel,
          min_loss: scoreResult.min_loss, max_loss: scoreResult.max_loss,
          recommendations: scoreResult.recommendations, identified_gaps: scoreResult.identified_gaps,
          risk_categories: scoreResult.risk_categories, entityType
        };

        const creIntelligence = await generateRecommendations(assessmentDataObj);
        const aiReportData = await generateRiskReport(assessmentDataObj, creIntelligence);

        const dbRiskLevelMap = {
          'Excellent': 'low', 'Good': 'low', 'Moderate': 'moderate',
          'Vulnerable': 'high', 'Critical': 'critical',
          'Very Low Risk': 'low', 'Low Risk': 'low', 'Moderate Risk': 'moderate',
          'High Risk': 'high', 'Critical Risk': 'critical'
        };
        const dbRiskLevel = dbRiskLevelMap[scoreResult.riskLevel] || 'low';

        publishEvent(CCIE_EVENTS.SCORE_CALCULATED, ccieContext, {
          score: scoreResult.score, riskLevel: scoreResult.riskLevel, entityType
        });

        const assessRes = await run(`
          INSERT INTO assessments (user_id, answers, score, risk_level, ai_report)
          VALUES (NULL, ?, ?, ?, ?)
        `, [JSON.stringify(finalAnswers), scoreResult.score, dbRiskLevel, JSON.stringify(aiReportData)]);

        const assessmentId = assessRes.lastInsertRowid;
        assessmentData.assessmentId = assessmentId;
        assessmentData.reportUrl = `${process.env.APP_URL || 'https://coverscore.site'}/assessment/result/${assessmentId}`;
        publishEvent(CCIE_EVENTS.REPORT_GENERATED, ccieContext, { assessmentId, reportUrl: assessmentData.reportUrl });

        if (assessmentData.email) {
          emailService.sendAssessmentReport(assessmentData.email, {
            score: scoreResult.score, riskLevel: dbRiskLevel, aiReport: aiReportData,
            businessName: assessmentData.business_name || assessmentData.name, assessmentId
          }).then(() => {
            publishEvent(CCIE_EVENTS.REPORT_DELIVERED, ccieContext, { email: assessmentData.email, assessmentId });
            console.log(`✅ Assessment report emailed to ${assessmentData.email}`);
          }).catch(err => console.error(`❌ Failed to email report:`, err));
        }

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
        console.error('Scoring error:', e);
      }
    }

    let reportMessage = null;
    if (isFinished && assessmentData._scored) {
      try {
        const advisorMsg = await getWhatsappAdvisor([], 'finished', '');
        if (advisorMsg) {
          reportMessage = advisorMsg
            .replace(/{{score}}/g, assessmentData.score || '0')
            .replace(/{{riskLevel}}/g, (assessmentData.riskLevel || 'Moderate').toUpperCase())
            .replace(/{{strengths}}/g, assessmentData.strengths || '')
            .replace(/{{top_risks}}/g, assessmentData.top_risks || '')
            .replace(/{{recommendations}}/g, assessmentData.recommendations || '')
            .replace(/{{reportUrl}}/g, assessmentData.reportUrl || 'https://coverscore.site');
        }
      } catch (e) {
        console.error('WhatsApp advisor error:', e);
      }
      if (!reportMessage) {
        reportMessage = `🛡️ *Your CoverScore Report*\n\n📊 Score: *${assessmentData.score || 'N/A'}*/100\n📋 Risk Level: *${(assessmentData.riskLevel || 'Moderate').toUpperCase()}*\n\n${assessmentData.strengths ? '*Strengths:*\n' + assessmentData.strengths + '\n\n' : ''}${assessmentData.top_risks ? '*Top Risks:*\n' + assessmentData.top_risks + '\n\n' : ''}${assessmentData.recommendations ? '*Recommendations:*\n' + assessmentData.recommendations : ''}\n\n📄 Full Report: ${assessmentData.reportUrl || 'N/A'}`;
      }
    }

    let allMessages = [...messages];
    if (reportMessage) {
      allMessages.push({ type: 'report', text: reportMessage });
    }

    if (allMessages.length > 0) {
      // Replace template placeholders in all messages with actual assessment data
      const riskLabelMap = {
        'Excellent': 'Excellent', 'Good': 'Good', 'Moderate': 'Moderate',
        'Vulnerable': 'Vulnerable', 'Critical': 'Critical',
        'Very Low Risk': 'Very Low', 'Low Risk': 'Low', 'Moderate Risk': 'Moderate',
        'High Risk': 'High', 'Critical Risk': 'Critical'
      };
      const userRiskLabel = riskLabelMap[assessmentData.riskLevel] || assessmentData.riskLevel || 'Moderate';
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

      for (let i = 0; i < allMessages.length; i++) {
        const msg = allMessages[i];
        if (!msg.text) continue;
        msg.text = fillTemplate(msg.text);

        // Simulate typing/processing delay for results after auto-advance
        const isAfterAutoAdvance = i > 0 && allMessages[i - 1].type === 'auto_advance';
        const msgDelay = isAfterAutoAdvance ? 4000 : undefined;

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
    }

    const finalState = assessmentData._scored ? (nextState.includes('awaiting') ? nextState : 'qualification') : nextState;
    await run('UPDATE leads SET wa_state = ?, assessment_data = ?, chat_history = ?, ccie_context = ? WHERE id = ?',
      [finalState, JSON.stringify(assessmentData), JSON.stringify(chatHistory), JSON.stringify(updatedCcieContext || ccieContext), lead.id]);

    if (assessmentData.name || assessmentData.email) {
      await run('UPDATE leads SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?',
        [assessmentData.name || null, assessmentData.email || null, lead.id]);
    }

    if (isFinished) {
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
    console.error('Webhook processing error:', error);
  }
});

module.exports = router;
