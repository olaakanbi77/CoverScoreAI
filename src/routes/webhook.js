const express = require('express');
const router = express.Router();
const { sendWhatsApp } = require('../services/whatsappService');
const emailService = require('../services/emailService');
const { get, run } = require('../config/database');
const { generateRiskReport, getLeadQualifier, getWhatsappAdvisor } = require('../services/aiService');
const { calculateScore } = require('../services/scoringEngine');
const { generateRecommendations } = require('../services/cre');
const { getNextStateAndReply, getInitialWelcome } = require('../services/whatsappFlow');

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

      console.log(`📩 Received WhatsApp reply from ${phoneNumber}: "${incomingText}"`);

      // 1. Load lead state from DB
      let searchPhone = phoneNumber.length > 10 ? phoneNumber.slice(-10) : phoneNumber;
      let lead = await get('SELECT * FROM leads WHERE phone LIKE ? ORDER BY id DESC LIMIT 1', ['%' + searchPhone]);
      
      // Use word-boundary matching to avoid false positives on names like "Chidinma", "Ibrahim", etc.
      const words = incomingText.split(/\s+/);
      const isStartTrigger = words.some(w => w === 'START' || w === 'ASSESSMENT' || w === 'HELLO' || w === 'HI' || w === 'BEGIN');
      // Explicit restart requires specific phrases
      const isRestartTrigger = incomingText.includes('START ') && incomingText.includes(' ASSESSMENT') || incomingText.includes('RESTART') || incomingText.includes('START OVER');

      // Detect Industry if they used dynamic link
      let detectedIndustry = null;
      if (incomingText.includes('START ') && incomingText.includes(' ASSESSMENT')) {
        const match = incomingText.match(/START\s+(.+)\s+ASSESSMENT/);
        if (match && match[1]) {
          detectedIndustry = match[1].trim().toLowerCase();
        }
      }

      console.log(`   Lead found: ${!!lead}, isStartTrigger: ${isStartTrigger}, isRestartTrigger: ${isRestartTrigger}, detectedIndustry: ${detectedIndustry}`);

      const flowMap = {
        'school': 'school_risk',
        'manufacturing': 'manufacturing_risk',
        'hospital': 'hospital_risk',
        'healthcare': 'hospital_risk',
        'church': 'church_risk',
        'sme': 'sme_risk',
        'family': 'family_protection',
        'personal': 'family_protection'
      };
      const { getFlow } = require('../services/conversationEngine');
      const getInitState = (ind) => {
        const tId = flowMap[ind] || 'sme_risk';
        const flow = getFlow(tId);
        if (flow && flow.assessment_template && flow.assessment_template.initial_state) {
          return flow.assessment_template.initial_state;
        }
        return 'welcome_name';
      };

      let currentState, chatHistory, assessmentData;
      const resolvedIndustry = detectedIndustry || (lead ? lead.industry : null);

      if (lead) {
        if (isRestartTrigger) {
          const initState = getInitState(resolvedIndustry);
          console.log(`   Lead ${lead.id} requesting restart mid-flow`);
          await run('UPDATE leads SET wa_state = ?, chat_history = ?, assessment_data = ? WHERE id = ?', [initState, '{}', '{}', lead.id]);
          lead.wa_state = initState;
          lead.chat_history = '{}';
          lead.assessment_data = '{}';
          currentState = initState;
          chatHistory = [];
          assessmentData = {};
        } else {
          currentState = lead.wa_state || 'initial';
          chatHistory = JSON.parse(lead.chat_history || '[]');
          assessmentData = JSON.parse(lead.assessment_data || '{}');
        }
      } else if (isStartTrigger || isRestartTrigger) {
        const initState = getInitState(resolvedIndustry);
        console.log(`   Creating NEW lead for phone ${phoneNumber} (implicit start trigger)`);
        const insertResult = await run(`
          INSERT INTO leads (name, email, phone, status, wa_state, chat_history, entity_type, contact_person, industry)
          VALUES (?, ?, ?, 'New Lead', ?, '{}', 'unknown', ?, ?)
        `, ['WhatsApp User', 'whatsapp@coverscore.site', phoneNumber, initState, 'WhatsApp User', resolvedIndustry]);
        
        lead = await get('SELECT * FROM leads WHERE id = ?', [insertResult.lastInsertRowid]);
        console.log(`   Created new lead ID: ${lead.id}`);
        currentState = initState;
        chatHistory = [];
        assessmentData = {};
      } else {
        console.log(`   Lead not found for phone ending in ${searchPhone} and message didn't trigger start.`);
        return;
      }

      // Handle leads in 'initial' state (from web form) or 'finished' state receiving a start trigger
      if ((lead.wa_state === 'initial' || lead.wa_state === null) && isStartTrigger) {
        const initState = getInitState(resolvedIndustry);
        console.log(`   Lead ${lead.id} in '${lead.wa_state}' state, transitioning to ${initState}`);
        await run('UPDATE leads SET wa_state = ?, chat_history = ? WHERE id = ?', [initState, '{}', lead.id]);
        lead.wa_state = initState;
        lead.chat_history = '{}';
        currentState = initState;
      }

      if (!currentState) {
        currentState = getInitState(resolvedIndustry);
      }
      
      if (currentState === 'finished' || currentState === 'awaiting_consultation' || currentState === 'awaiting_consultation_day') {
        if (isRestartTrigger) {
          const initState = getInitState(resolvedIndustry);
          console.log(`   Lead ${lead.id} finished but requesting restart`);
          await run('UPDATE leads SET wa_state = ?, chat_history = ?, assessment_data = ? WHERE id = ?', [initState, '{}', '{}', lead.id]);
          lead.wa_state = initState;
          currentState = initState;
        } else if (currentState === 'finished') {
          console.log(`   Lead ${lead.id} is in finished state, passing to AI Advisor`);
        }
      }

      // ── NEW STRUCTURED FLOW STATE MACHINE ──
      
      let processText = incomingTextRaw;
      let evalState = currentState;

      const templateId = flowMap[resolvedIndustry] || 'sme_risk';
      const { getFlow } = require('../services/conversationEngine');
      const flow = getFlow(templateId);

      // Send initial welcome message instantly without advancing state
      if ((isStartTrigger || isRestartTrigger) && (!flow || evalState === flow.assessment_template.initial_state || evalState === 'welcome_name')) {
        let initialWelcome = "👋 Welcome to CoverScore AI\n\nWe help individuals and businesses identify hidden financial risks and protection gaps.\n\nIn about 3 minutes, you'll receive:\n✅ Your CoverScore\n✅ Risk Level\n✅ Potential Financial Exposure\n✅ Personalized Recommendations\n\nBefore we begin, what is your first name?";

        if (flow) {
          const initConfig = flow.states.find(s => s.state === flow.assessment_template.initial_state);
          if (initConfig) initialWelcome = initConfig.message;
          evalState = flow.assessment_template.initial_state;
        }

        console.log(`   Sending welcome message to ${phoneNumber}...`);
        const welcomeResult = await sendWhatsApp(phoneNumber, null, { _message: initialWelcome });
        console.log(`   Welcome message result: ${JSON.stringify(welcomeResult)}`);
        
        chatHistory.push({
          role: 'user',
          content: processText,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        chatHistory.push({
          role: 'assistant',
          content: initialWelcome,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        await run('UPDATE leads SET wa_state = ?, chat_history = ? WHERE id = ?', [evalState, JSON.stringify(chatHistory), lead.id]);
        
        return; // wait for them to answer
      }

      if (!evalState) {
        evalState = flow ? flow.assessment_template.initial_state : 'welcome_name';
      }

      // 1. Process Message through State Machine
      let { nextState, replyText, updatedData, isComplete } = await getNextStateAndReply(evalState, processText, assessmentData, templateId);
      console.log(`   State transition: ${evalState} -> ${nextState}, isComplete: ${isComplete}`);

      let finalReplyText = replyText;

      // PROMPT 3: WHATSAPP ADVISOR INTELLIGENCE
      // If the static flow doesn't know what to say (e.g. post-assessment), trigger AI
      if (!finalReplyText && (evalState === 'finished' || evalState === 'qualification')) {
        console.log(`   Triggering WhatsApp Advisor AI for state ${evalState}...`);
        finalReplyText = await getWhatsappAdvisor(updatedData.__messages || [], evalState, processText);
        // Ensure state remains finished so we don't restart flow
        nextState = 'finished';
      }

      // 2. Update Database & Send Next Message
      if (finalReplyText) {
        // Send WhatsApp reply
        console.log(`   Sending reply to ${phoneNumber}: "${finalReplyText.substring(0, 80)}..."`);
        const sendResult = await sendWhatsApp(phoneNumber, null, { _message: finalReplyText });
        
        if (!sendResult.success) {
          console.error(`   ❌ Failed to send reply: ${sendResult.error}. State NOT advanced.`);
          return; // Don't advance state if message failed to send
        }
        console.log(`   ✅ Reply sent successfully. Advancing state to: ${nextState}`);
        
        chatHistory.push({
          role: 'user',
          content: processText,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        chatHistory.push({
          role: 'assistant',
          content: finalReplyText,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        
        // ── ENGAGEMENT SCORING ──
        let engagementBonus = 0;
        
        if (evalState === 'welcome_name' && nextState === 'welcome_email') engagementBonus = 20;

        if (engagementBonus > 0) {
          await run('UPDATE leads SET engagement_points = engagement_points + ?, sales_score = sales_score + ? WHERE id = ?', [engagementBonus, engagementBonus, lead.id]);
        }

        // Process final risk score if complete
        if (isComplete && !updatedData._scored) {
          updatedData._scored = true;
          
          if (!flow) {
            const indName = lead.industry ? lead.industry.charAt(0).toUpperCase() + lead.industry.slice(1) : 'organization';
            const consultationOffer = `\n\nBased on your assessment, several opportunities exist to strengthen your protection strategy.\n\nWould you like a complimentary 30-minute consultation with a CoverScore Certified Risk Advisor?\n\nA. Yes\nB. Maybe Later\nC. No`;
            
            // Only send the text report + consultation question now. 
            await sendWhatsApp(phoneNumber, null, { _message: "Thank you for completing the assessment." + consultationOffer });
          }
        }

        // Update lead state (only if message was sent successfully)
        await run('UPDATE leads SET wa_state = ?, assessment_data = ?, chat_history = ? WHERE id = ?', [nextState, JSON.stringify(updatedData), JSON.stringify(chatHistory), lead.id]);
        
        if (updatedData.name || updatedData.email) {
          await run('UPDATE leads SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?', [updatedData.name || null, updatedData.email || null, lead.id]);
        }
        
        // 🚀 CHECK IF LEAD IS NOW QUALIFIED 🚀
        if (nextState === 'finished') {
          console.log(`   🧠 Running Lead Qualifier AI for Lead ${lead.id}...`);
          
          let assessmentData = {};
          try {
            if (lead.assessment_id) {
              const assessRecord = await get('SELECT answers FROM assessments WHERE id = ?', [lead.assessment_id]);
              if (assessRecord && assessRecord.answers) {
                assessmentData = JSON.parse(assessRecord.answers);
              }
            }
          } catch(e) {}
          
          const qualifierOutput = await getLeadQualifier(updatedData.__messages || [], assessmentData);
          console.log(`   ✅ Qualifier output: ${JSON.stringify(qualifierOutput)}`);
          
          // Update CRM status with AI insights
          await run(`
            UPDATE leads 
            SET status = ?, 
                pipeline_stage = ?, 
                is_qualified = ?, 
                consultation_preference = ?,
                primary_concern = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [
            qualifierOutput.lead_status || 'Qualified',
            (qualifierOutput.lead_status || '').toLowerCase().includes('hot') ? 4 : 3,
            updatedData.is_qualified ? 1 : 0,
            updatedData.consultation_preference || null,
            updatedData.primary_concern || null,
            qualifierOutput.next_best_action + " - " + qualifierOutput.qualification_reasoning,
            lead.id
          ]);
          
          // Send Admin Notification if Hot or Qualified
          if (process.env.ADMIN_PHONE && ((qualifierOutput.lead_status || '').toLowerCase().includes('hot') || updatedData.is_qualified)) {
            const qualDetails = [];
            if (updatedData.primary_concern) qualDetails.push(`Primary Concern: ${updatedData.primary_concern}`);
            if (updatedData.consultation_preference) qualDetails.push(`Preferred Contact: ${updatedData.consultation_preference}`);
            if (qualifierOutput.next_best_action) qualDetails.push(`Suggested Action: ${qualifierOutput.next_best_action}`);
            
            const displayName = (updatedData.entity_type === 'business' && updatedData.business_name) ? updatedData.business_name : (updatedData.name || lead.name);
            const notifMsg = `🔥 *NEW QUALIFIED LEAD* 🔥\n\n👤 *Name:* ${displayName}\n📞 *Phone:* ${phoneNumber}\n🛡️ *CoverScore:* ${lead.score || 'N/A'}\n📊 *Risk Level:* ${(lead.risk_level || 'N/A').toUpperCase()}\n\n📝 *CRM Insight:*\n${qualifierOutput.lead_status} - ${qualifierOutput.qualification_reasoning}\n\n🔍 *Qualification Details:*\n${qualDetails.join('\n')}\n\n🔗 View in CRM: ${process.env.APP_URL || 'https://coverscore.site'}/admin/dashboard`;
            await sendWhatsApp(process.env.ADMIN_PHONE, null, { _message: notifMsg });
            console.log(`   📱 Admin notification sent for qualified lead ${lead.id}`);
          }
        }
        
        // ── HANDLE DECLINED USERS (finished but not qualified) ──
        if (nextState === 'finished' && !updatedData.is_qualified) {
          console.log(`   Lead ${lead.id} declined qualification, updating status`);
          await run(`
            UPDATE leads 
            SET status = 'WhatsApp Engaged', 
                pipeline_stage = 3, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [lead.id]);
        }

        // If the user just answered the consultation question, process and send the final report!
        if ((evalState === 'awaiting_consultation' || evalState === 'awaiting_consultation_day') && nextState === 'finished' && !updatedData._report_sent) {
          try {
            updatedData._report_sent = true;
            // Map the collected data to the scoring engine format
            const entityType = (lead.industry === 'personal' || lead.industry === 'family') ? 'individual' : 'business';
            
            // Build Final Answers for V1 scoringEngine
            const finalAnswers = { 
                ...updatedData.answers, 
                template_selection: { template_id: templateId } 
            };

            // Calculate score using dynamic V1 engine
            const scoreResult = await calculateScore(finalAnswers);

            const assessmentDataObj = {
              answers: finalAnswers,
              score: scoreResult.score,
              riskLevel: scoreResult.riskLevel,
              min_loss: scoreResult.min_loss,
              max_loss: scoreResult.max_loss,
              recommendations: scoreResult.recommendations,
              identified_gaps: scoreResult.identified_gaps,
              risk_categories: scoreResult.risk_categories,
              entityType
            };

            // Run CRE Rules
            const creIntelligence = await generateRecommendations(assessmentDataObj);

            // Generate AI Report
            const aiReportData = await generateRiskReport(assessmentDataObj, creIntelligence);

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
            `, [JSON.stringify(finalAnswers), scoreResult.score, dbRiskLevel, JSON.stringify(aiReportData)]);

            const assessmentId = assessRes.lastInsertRowid;
            
            // Build report URL
            const reportUrl = `${process.env.APP_URL || 'https://coverscore.site'}/assessment/result/${assessmentId}`;
            
            // Format currency values
            const formatNaira = (val) => new Intl.NumberFormat('en-NG').format(val);
            const minLossStr = formatNaira(scoreResult.min_loss);
            const maxLossStr = formatNaira(scoreResult.max_loss);
            
            let riskBreakdownMsg = '';
            if (scoreResult.risk_categories) {
              const formattedCategories = Object.entries(scoreResult.risk_categories)
                .map(([key, val]) => {
                  const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  return `• ${title}: ${val}/100`;
                }).join('\n');
              riskBreakdownMsg = `\n\n📈 *Risk Breakdown:*\n${formattedCategories}`;
            }

            // Send Final Web Report Link with Financial Exposure AFTER consultation response
            const finalReportMsg = `🧾 *Your Official CoverScore Risk Report is Ready*\n\nThank you for your response.\n\nWe've processed your full assessment and identified areas that could expose you to significant financial loss if left unaddressed.\n\n💰 *Potential Financial Exposure:*\n₦${minLossStr} – ₦${maxLossStr}\n\n🔗 View and download your full report:\n${reportUrl}\n\nIf you requested a consultation, our Certified Risk Advisor will contact you shortly!`;
            
            await sendWhatsApp(phoneNumber, null, { _message: finalReportMsg });
            
            updatedData.__messages = updatedData.__messages || [];
            updatedData.__messages.push({
              role: 'assistant',
              content: finalReportMsg,
              timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            });
            
            // Send email report
            if (updatedData.email) {
              try {
                await emailService.sendAssessmentReport(updatedData.email, {
                  score: scoreResult.score,
                  riskLevel: dbRiskLevel,
                  aiReport: aiReportData,
                  businessName: updatedData.business_name || updatedData.name,
                  assessmentId: assessmentId
                });
                console.log(`✅ Assessment report emailed successfully to ${updatedData.email}`);
              } catch (emailErr) {
                console.error(`❌ Failed to email assessment report to ${updatedData.email}:`, emailErr);
              }
            }

            // Calculate estimated premium
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
              let annualPremium = 0;
              let monthlyPremium = 0;
              const recs = scoreResult.recommendations || [];
              if (recs.length > 0) {
                recs.forEach(rec => { 
                  const rate = PREMIUM_RATES[rec] || 0.01;
                  if (rec.toLowerCase().includes('life')) {
                    monthlyPremium += (scoreResult.min_loss * rate) / 12;
                  } else {
                    annualPremium += (scoreResult.min_loss * rate);
                  }
                });
                estimatedPremium = Math.round(annualPremium + monthlyPremium);
              } else { 
                estimatedPremium = Math.round(scoreResult.min_loss * 0.013); 
              }
            }

            // Update lead with assessment data, set state to qualification, +20 engagement for completing assessment
            await run(`
              UPDATE leads 
              SET assessment_id = ?, score = ?, risk_level = ?, entity_type = ?, 
                  name = ?, email = ?, wa_state = 'qualification', 
                  status = 'Report Sent', pipeline_stage = 2,
                  engagement_points = engagement_points + 20, sales_score = sales_score + 20,
                  estimated_premium = ?,
                  chat_history = ?,
                  birth_date = ?,
                  anniversary_date = ?,
                  contact_person = ?
              WHERE id = ?
            `, [
              assessmentId, scoreResult.score, dbRiskLevel, entityType, 
              (entityType === 'business' && updatedData.business_name) ? updatedData.business_name : (updatedData.name || 'WhatsApp User'), 
              updatedData.email || 'whatsapp@coverscore.site',
              estimatedPremium, JSON.stringify(updatedData), 
              updatedData.birth_date || null,
              updatedData.anniversary_date || null,
              updatedData.name || 'WhatsApp User',
              lead.id
            ]);
            console.log(`   📊 Assessment completed. Lead ${lead.id} → qualification state (+20 engagement)`);

          } catch(err) {
            console.error("Error generating report after completion:", err);
            await sendWhatsApp(phoneNumber, null, { _message: "I'm sorry, I encountered an error generating your report. Error details: " + err.message + ". Please contact support." });
          }
        }
      }

    } // end messages.upsert
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
});

module.exports = router;
