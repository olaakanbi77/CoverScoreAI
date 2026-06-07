const express = require('express');
const router = express.Router();
const { sendWhatsApp } = require('../services/whatsappService');
const emailService = require('../services/emailService');
const { get, run } = require('../config/database');
const { generateRiskReport } = require('../services/aiService');
const { calculateScore } = require('../services/scoringEngine');
const { getNextStateAndReply } = require('../services/whatsappFlow');

// Evolution API webhook endpoint
router.post('/evolution', async (req, res) => {
  // Always respond 200 OK immediately to acknowledge receipt
  res.status(200).send('OK');

  try {
    const payload = req.body;

    // Check if this is a message upsert event
    if (payload && payload.event === 'messages.upsert') {
      const messageData = payload.data;
      
      // Ignore messages sent by the bot itself
      if (messageData.key && messageData.key.fromMe) {
        return;
      }

      // Extract text content
      let incomingTextRaw = '';
      if (messageData.message) {
        incomingTextRaw = 
          messageData.message.conversation || 
          (messageData.message.extendedTextMessage && messageData.message.extendedTextMessage.text) ||
          '';
      }

      const incomingText = incomingTextRaw.trim().toUpperCase();
      if (!incomingText) return;

      // Extract sender's phone number
      const remoteJid = messageData.key.remoteJid;
      if (!remoteJid) return;
      const phoneNumber = remoteJid.split('@')[0];

      console.log(`Received WhatsApp reply from ${phoneNumber}: "${incomingText}"`);

      // 1. Load lead state from DB
      let searchPhone = phoneNumber.length > 10 ? phoneNumber.slice(-10) : phoneNumber;
      let lead = await get('SELECT * FROM leads WHERE phone LIKE ? ORDER BY id DESC LIMIT 1', ['%' + searchPhone]);
      
      const isStartTrigger = incomingText.includes('START') || incomingText.includes('ASSESSMENT') || incomingText.includes('HELLO') || incomingText.includes('HI');

      if (!lead) {
        if (isStartTrigger) {
          const insertResult = await run(`
            INSERT INTO leads (name, email, phone, status, wa_state, chat_history, entity_type)
            VALUES (?, ?, ?, 'New Lead', 'welcome_name', '{}', 'unknown')
          `, ['WhatsApp User', 'whatsapp@coverscore.site', phoneNumber]);
          
          lead = await get('SELECT * FROM leads WHERE id = ?', [insertResult.lastInsertRowid]);
        } else {
          console.log(`Lead not found for phone ending in ${searchPhone} and message didn't trigger start.`);
          return;
        }
      } else if (isStartTrigger) {
        // If lead exists but sends a START trigger, override their state to restart the flow
        await run('UPDATE leads SET wa_state = ?, chat_history = ? WHERE id = ?', ['welcome_name', '{}', lead.id]);
        lead.wa_state = 'welcome_name';
        lead.chat_history = '{}';
      }

      const currentState = lead.wa_state || 'welcome_name';
      
      if (currentState === 'finished') {
        // Conversation fully complete
        return;
      }

      let currentData = {};
      try {
        currentData = JSON.parse(lead.chat_history || '{}');
      } catch(e) {}

      // ── NEW STRUCTURED FLOW STATE MACHINE ──
      
      // If we are just starting, fake the first transition
      let processText = incomingTextRaw;
      let evalState = currentState;

      if (currentState === 'welcome_name' && isStartTrigger) {
        // Send initial welcome message instantly without advancing state
        const initialWelcome = "👋 Welcome to CoverScore AI\n\nWe help individuals and businesses identify hidden financial risks and protection gaps.\n\nIn about 3 minutes, you'll receive:\n✅ Your CoverScore\n✅ Risk Level\n✅ Potential Financial Exposure\n✅ Personalized Recommendations\n\nBefore we begin, what is your first name?";
        await sendWhatsApp(phoneNumber, null, { _message: initialWelcome });
        return; // wait for them to answer name
      }

      const { nextState, replyText, updatedData, isComplete } = getNextStateAndReply(evalState, processText, currentData);

      let finalReplyText = replyText;

      // 2. Update Database & Send Next Message
      if (finalReplyText) {
        // Send WhatsApp immediately
        await sendWhatsApp(phoneNumber, null, { _message: finalReplyText });
        
        // Update lead state
        await run('UPDATE leads SET wa_state = ?, chat_history = ? WHERE id = ?', [nextState, JSON.stringify(updatedData), lead.id]);
        
        // If the flow is complete, trigger report generation
        if (isComplete) {
          try {
            // Map the collected data to the scoring engine format
            const entityType = updatedData.entity_type === 'business' ? 'business' : 'individual';
            let mockAnswers = { type: { entity_type: entityType } };

            if (entityType === 'business') {
              mockAnswers.business = {
                business_name: updatedData.name || 'Your Business',
                industry: updatedData.industry || 'General Business',
                turnover: updatedData.turnover_bracket || '10m_50m'
              };
              mockAnswers.employee_risk = {
                employ_staff: 'yes',
                employees: updatedData.employee_bracket || '1_5'
              };
              if (updatedData.has_location === 'yes') {
                mockAnswers.property = { 
                  own_building: updatedData.location_ownership === 'own' ? 'yes' : 'no', 
                  building_value: updatedData.asset_value || 'under_5m', 
                  equipment_value: updatedData.asset_value || 'under_5m' 
                };
              }
            } else {
              mockAnswers.personal = {
                name: updatedData.name || 'User',
                dependents: updatedData.dependents === '1_2' ? '1_2' : 
                            updatedData.dependents === '3_5' ? '3_5' : 
                            updatedData.dependents === 'over_5' ? 'more_than_5' : 'none'
              };
              mockAnswers.family_protection = {
                life_insurance: updatedData.has_life_insurance || 'no',
                lifestyle_maintenance: 'less_than_3m'
              };
              mockAnswers.health_protection = {
                health_insurance: updatedData.has_health_insurance || 'no',
                medical_emergency: 'borrowing'
              };
              mockAnswers.home_risk = {
                household_contents_value: updatedData.home_value === 'under_5m' ? '1m_5m' :
                                          updatedData.home_value === '5m_20m' ? '5m_20m' : 'above_20m',
                burglary_fire_experience: 'no'
              };
              mockAnswers.motor_risk = {
                own_vehicle: updatedData.owns_vehicle || 'no',
                motor_insurance_status: updatedData.vehicle_insurance === 'none' ? 'uninsured' :
                                        updatedData.vehicle_insurance === 'third_party' ? 'third_party' : 'comprehensive',
                accident_history: 'no'
              };
              mockAnswers.financial_resilience = {
                survival_months: updatedData.savings_buffer === 'less_1m' ? 'less_than_1m' :
                                 updatedData.savings_buffer === '1_3m' ? '1_3m' :
                                 updatedData.savings_buffer === '3_6m' ? '3_6m' : 'more_than_6m'
              };
            }

            // Calculate score
            const scoreResult = calculateScore(mockAnswers);

            // Generate AI Report
            const aiReportData = await generateRiskReport({
              answers: mockAnswers,
              score: scoreResult.score,
              riskLevel: scoreResult.riskLevel,
              min_loss: scoreResult.min_loss,
              max_loss: scoreResult.max_loss,
              recommendations: scoreResult.recommendations,
              identified_gaps: scoreResult.identified_gaps,
              risk_categories: scoreResult.risk_categories,
              entityType
            });

            const dbRiskLevelMap = {
              'Very Low Risk': 'low',
              'Low Risk': 'low',
              'Moderate Risk': 'moderate',
              'High Risk': 'high',
              'Critical Risk': 'critical'
            };
            const dbRiskLevel = dbRiskLevelMap[scoreResult.riskLevel] || 'low';

            // Save to DB
            const assessRes = await run(`
              INSERT INTO assessments (user_id, answers, score, risk_level, ai_report)
              VALUES (NULL, ?, ?, ?, ?)
            `, [JSON.stringify(mockAnswers), scoreResult.score, dbRiskLevel, JSON.stringify(aiReportData)]);

            const assessmentId = assessRes.lastInsertRowid;
            
            // Send final link
            const reportUrl = `${process.env.APP_URL || 'https://coverscore.site'}/assessment/result/${assessmentId}`;
            
            // Send completion message
            const completionMsg = `✅ *Your assessment is complete!*\n\nView your full Risk Report here:\n${reportUrl}`;
            await sendWhatsApp(phoneNumber, null, { _message: completionMsg });
            
            // Send Qualification message
            const maxLossStr = scoreResult.max_loss.toLocaleString();
            const qualMsg = `Based on your assessment, there may be opportunities to strengthen your financial protection and reduce potential exposure.\n\n❓ If an unexpected incident occurred tomorrow, are you confident you could absorb a loss of ₦${maxLossStr} without serious financial disruption?\n\n1️⃣ YES – I believe I'm adequately protected\n2️⃣ NO – I think there may be gaps in my protection\n3️⃣ NOT SURE – I'd like a free review\n\nReply with 1, 2 or 3.`;
            await sendWhatsApp(phoneNumber, null, { _message: qualMsg });

            // Update lead state to qualification
            await run('UPDATE leads SET assessment_id = ?, score = ?, risk_level = ?, entity_type = ?, name = ?, email = ?, wa_state = ? WHERE id = ?', [
              assessmentId, scoreResult.score, dbRiskLevel, entityType, (updatedData.name || 'WhatsApp User'), (updatedData.email || 'whatsapp@coverscore.site'), 'qualification', lead.id
            ]);

          } catch(err) {
            console.error("Error generating report after completion:", err);
            await sendWhatsApp(phoneNumber, null, { _message: "I'm sorry, I encountered an error generating your report. Error details: " + err.message + ". Please contact support." });
          }
        }
      }

      // Check if we need to send Admin Notification for qualification
      if (currentState === 'qualification' && ['1','2','3'].includes(incomingText)) {
        if (process.env.ADMIN_PHONE) {
          const qualMapText = {'1': 'Adequately Protected', '2': 'Has Gaps', '3': 'Not Sure / Needs Review'};
          const userResponseText = qualMapText[incomingText];
          
          const notifMsg = `🚨 *NEW QUALIFIED LEAD* 🚨\n\nName: ${currentData.name || lead.name}\nPhone: ${phoneNumber}\nScore: ${lead.score || 'N/A'}\nQualification: ${userResponseText}\n\nPlease reach out to them via CRM.`;
          await sendWhatsApp(process.env.ADMIN_PHONE, null, { _message: notifMsg });
        }
      }

    } // end messages.upsert
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
});

module.exports = router;
