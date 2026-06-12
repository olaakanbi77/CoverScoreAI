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

      console.log(`📩 Received WhatsApp reply from ${phoneNumber}: "${incomingText}"`);

      // 1. Load lead state from DB
      let searchPhone = phoneNumber.length > 10 ? phoneNumber.slice(-10) : phoneNumber;
      let lead = await get('SELECT * FROM leads WHERE phone LIKE ? ORDER BY id DESC LIMIT 1', ['%' + searchPhone]);
      
      // Use word-boundary matching to avoid false positives on names like "Chidinma", "Ibrahim", etc.
      const words = incomingText.split(/\s+/);
      const isStartTrigger = words.some(w => w === 'START' || w === 'ASSESSMENT' || w === 'HELLO' || w === 'HI' || w === 'BEGIN');
      // Explicit restart requires specific phrases
      const isRestartTrigger = incomingText.includes('START ASSESSMENT') || incomingText.includes('RESTART') || incomingText.includes('START OVER');

      console.log(`   Lead found: ${!!lead}, isStartTrigger: ${isStartTrigger}, isRestartTrigger: ${isRestartTrigger}`);

      if (!lead) {
        if (isStartTrigger) {
          const insertResult = await run(`
            INSERT INTO leads (name, email, phone, status, wa_state, chat_history, entity_type)
            VALUES (?, ?, ?, 'New Lead', 'welcome_name', '{}', 'unknown')
          `, ['WhatsApp User', 'whatsapp@coverscore.site', phoneNumber]);
          
          lead = await get('SELECT * FROM leads WHERE id = ?', [insertResult.lastInsertRowid]);
          console.log(`   Created new lead ID: ${lead.id}`);
        } else {
          console.log(`   Lead not found for phone ending in ${searchPhone} and message didn't trigger start.`);
          return;
        }
      } else if (isRestartTrigger) {
        // Only restart the flow for explicit restart triggers, not for any message containing "HI"
        console.log(`   Restarting flow for lead ID: ${lead.id} (explicit restart trigger)`);
        await run('UPDATE leads SET wa_state = ?, chat_history = ? WHERE id = ?', ['welcome_name', '{}', lead.id]);
        lead.wa_state = 'welcome_name';
        lead.chat_history = '{}';
      }

      // Handle leads in 'initial' state (from web form) or 'finished' state receiving a start trigger
      if ((lead.wa_state === 'initial' || lead.wa_state === null) && isStartTrigger) {
        console.log(`   Lead ${lead.id} in '${lead.wa_state}' state, transitioning to welcome_name`);
        await run('UPDATE leads SET wa_state = ?, chat_history = ? WHERE id = ?', ['welcome_name', '{}', lead.id]);
        lead.wa_state = 'welcome_name';
        lead.chat_history = '{}';
      }

      const currentState = lead.wa_state || 'welcome_name';
      
      if (currentState === 'finished') {
        if (isRestartTrigger) {
          // Allow finished leads to restart with explicit trigger
          console.log(`   Lead ${lead.id} finished but requesting restart`);
          await run('UPDATE leads SET wa_state = ?, chat_history = ? WHERE id = ?', ['welcome_name', '{}', lead.id]);
          lead.wa_state = 'welcome_name';
        } else {
          console.log(`   Lead ${lead.id} already finished, ignoring message`);
          return;
        }
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
        console.log(`   Sending welcome message to ${phoneNumber}...`);
        const welcomeResult = await sendWhatsApp(phoneNumber, null, { _message: initialWelcome });
        console.log(`   Welcome message result: ${JSON.stringify(welcomeResult)}`);
        
        currentData.__messages = currentData.__messages || [];
        currentData.__messages.push({
          role: 'user',
          content: processText,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        currentData.__messages.push({
          role: 'assistant',
          content: initialWelcome,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        await run('UPDATE leads SET chat_history = ? WHERE id = ?', [JSON.stringify(currentData), lead.id]);
        
        return; // wait for them to answer name
      }

      console.log(`   Processing state: ${evalState} with input: "${processText}"`);
      const { nextState, replyText, updatedData, isComplete } = getNextStateAndReply(evalState, processText, currentData);
      console.log(`   State transition: ${evalState} → ${nextState}, isComplete: ${isComplete}`);

      let finalReplyText = replyText;

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
        
        updatedData.__messages = updatedData.__messages || [];
        updatedData.__messages.push({
          role: 'user',
          content: processText,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        updatedData.__messages.push({
          role: 'assistant',
          content: finalReplyText,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        
        // ── ENGAGEMENT SCORING ──
        let engagementBonus = 0;
        
        // +20 for first WhatsApp reply (assessment completed already gives +20)
        if (evalState === 'welcome_name' && nextState === 'welcome_email') {
          engagementBonus = 20; // Replied to WhatsApp
        }
        // +10 for selecting 1, 2, or 3 in qualification
        if (evalState === 'qualification' && ['qual_path1_situation','qual_path2_concern','qual_path3_preference'].includes(nextState)) {
          engagementBonus = 10;
        }
        // +30 for requesting review (YES) or plan (PLAN)
        if (updatedData.requested_review === true && !currentData.requested_review) {
          engagementBonus = 30;
        }
        if (updatedData.requested_plan === true && !currentData.requested_plan) {
          engagementBonus = 30;
        }
        // +40 for choosing consultation type
        if (updatedData.consultation_preference && !currentData.consultation_preference) {
          engagementBonus = 40;
        }
        
        // Apply engagement scoring
        if (engagementBonus > 0) {
          await run('UPDATE leads SET engagement_points = engagement_points + ?, sales_score = sales_score + ? WHERE id = ?', [engagementBonus, engagementBonus, lead.id]);
          console.log(`   📊 Engagement +${engagementBonus} points for lead ${lead.id}`);
        }

        // Update lead state (only if message was sent successfully)
        await run('UPDATE leads SET wa_state = ?, chat_history = ? WHERE id = ?', [nextState, JSON.stringify(updatedData), lead.id]);
        
        // ── CHECK IF LEAD IS NOW QUALIFIED ──
        if (nextState === 'finished' && updatedData.is_qualified) {
          console.log(`   🎯 Lead ${lead.id} is now QUALIFIED!`);
          
          // Update CRM status
          await run(`
            UPDATE leads 
            SET status = 'Qualified', 
                pipeline_stage = 4, 
                is_qualified = 1, 
                consultation_preference = ?,
                primary_concern = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [
            updatedData.consultation_preference || null,
            updatedData.primary_concern || null,
            lead.id
          ]);
          
          // Send Admin Notification
          if (process.env.ADMIN_PHONE) {
            const qualDetails = [];
            if (updatedData.qualification_path) qualDetails.push(`Path: ${updatedData.qualification_path === 'path1' ? 'Adequately Protected' : updatedData.qualification_path === 'path2' ? 'Has Gaps' : 'Not Sure'}`);
            if (updatedData.primary_concern) qualDetails.push(`Primary Concern: ${updatedData.primary_concern}`);
            if (updatedData.consultation_preference) qualDetails.push(`Preferred Contact: ${updatedData.consultation_preference}`);
            if (updatedData.insurance_situation) qualDetails.push(`Insurance Situation: ${updatedData.insurance_situation}`);
            if (updatedData.describe_role) qualDetails.push(`Role: ${updatedData.describe_role}`);
            
            const notifMsg = `🚨 *NEW QUALIFIED LEAD* 🚨\n\n👤 *Name:* ${updatedData.name || lead.name}\n📱 *Phone:* ${phoneNumber}\n📊 *CoverScore:* ${lead.score || 'N/A'}\n⚠️ *Risk Level:* ${(lead.risk_level || 'N/A').toUpperCase()}\n\n📋 *Qualification Details:*\n${qualDetails.join('\n')}\n\n🔗 View in CRM: ${process.env.APP_URL || 'https://coverscore.site'}/admin/dashboard`;
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
                turnover: updatedData.turnover_bracket || '10m_50m',
                employees: updatedData.employee_bracket || '1_5'
              };
              mockAnswers.employee_risk = {
                employ_staff: 'yes',
                death_benefits: updatedData.has_employee_benefits === 'yes' ? 'yes' : 'no',
                accidents: 'none'
              };
              if (updatedData.has_location === 'yes') {
                mockAnswers.property = { 
                  own_building: updatedData.location_ownership === 'own' ? 'yes' : 'no', 
                  building_value: updatedData.asset_value || 'under_5m', 
                  equipment_value: updatedData.asset_value || 'under_5m',
                  fire_extinguishers: 'some',
                  fire_incident: 'no'
                };
              }
              if (updatedData.has_vehicles === 'yes') {
                mockAnswers.vehicle = {
                  own_vehicles: 'yes',
                  num_vehicles: '1_3',
                  transport_goods: (updatedData.vehicle_type === 'both' || updatedData.vehicle_type === 'goods_only') ? 'daily' : 'never',
                  transit_value: '1m_10m'
                };
              } else {
                mockAnswers.vehicle = { own_vehicles: 'no' };
              }
              if (updatedData.business_interruption_risk) {
                const impactMap = {
                  'minor': 'minor',
                  'significant': 'significantly',
                  'severe': 'catastrophically',
                  'survival_threatened': 'catastrophically'
                };
                mockAnswers.business_interruption = {
                  revenue_impact: impactMap[updatedData.business_interruption_risk] || 'significantly',
                  alt_location: 'no'
                };
              }
              if (updatedData.public_liability_risk) {
                mockAnswers.liability = {
                  customer_interaction: updatedData.public_liability_risk === 'yes' ? 'frequently' : 'never',
                  premises_injury: updatedData.public_liability_risk === 'yes' ? 'high' : 'low',
                  product_liability: 'no'
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

            // Send combined Report Summary + Qualification Question (single message per user's spec)
            const reportAndQualMsg = `🧾 *Your CoverScore Risk Report is Ready*\n\nHi ${updatedData.name || 'there'},\n\nWe've completed your risk assessment and identified areas that could expose you to significant financial loss if left unaddressed.\n\n📊 *CoverScore:* ${scoreResult.score}/100\n⚠️ *Risk Level:* ${scoreResult.riskLevel}${riskBreakdownMsg}\n\n💰 *Potential Financial Exposure:*\n₦${minLossStr} – ₦${maxLossStr}\n\n🔗 View your full report:\n${reportUrl}\n\n❓ If an unexpected incident occurred tomorrow, are you confident you could absorb a loss of ₦${maxLossStr} without serious financial disruption?\n\nReply:\n1 = YES, I believe I'm adequately protected\n2 = NO, I think there may be gaps in my protection\n3 = NOT SURE, I'd like a free review`;
            
            await sendWhatsApp(phoneNumber, null, { _message: reportAndQualMsg });
            
            updatedData.__messages = updatedData.__messages || [];
            updatedData.__messages.push({
              role: 'assistant',
              content: reportAndQualMsg,
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

            // Update lead with assessment data, set state to qualification, +20 engagement for completing assessment
            await run(`
              UPDATE leads 
              SET assessment_id = ?, score = ?, risk_level = ?, entity_type = ?, 
                  name = ?, email = ?, wa_state = 'qualification', 
                  status = 'Report Sent', pipeline_stage = 2,
                  engagement_points = engagement_points + 20, sales_score = sales_score + 20,
                  chat_history = ?
              WHERE id = ?
            `, [
              assessmentId, scoreResult.score, dbRiskLevel, entityType, 
              (updatedData.name || 'WhatsApp User'), (updatedData.email || 'whatsapp@coverscore.site'), 
              JSON.stringify(updatedData), lead.id
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
