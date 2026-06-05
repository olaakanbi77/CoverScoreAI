const express = require('express');
const router = express.Router();
const { sendWhatsApp } = require('../services/whatsappService');
const emailService = require('../services/emailService');
const { get, run } = require('../config/database');

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
      let incomingText = '';
      if (messageData.message) {
        incomingText = 
          messageData.message.conversation || 
          (messageData.message.extendedTextMessage && messageData.message.extendedTextMessage.text) ||
          '';
      }

      incomingText = incomingText.trim().toUpperCase();
      if (!incomingText) return;

      // Extract sender's phone number
      const remoteJid = messageData.key.remoteJid;
      if (!remoteJid) return;
      const phoneNumber = remoteJid.split('@')[0];

      console.log(`Received WhatsApp reply from ${phoneNumber}: "${incomingText}"`);

      // 1. Load lead state from DB
      // Use LIKE to match the last 10 digits, as web forms might save +234 or 080
      let searchPhone = phoneNumber.length > 10 ? phoneNumber.slice(-10) : phoneNumber;
      let lead = await get('SELECT * FROM leads WHERE phone LIKE ? ORDER BY id DESC LIMIT 1', ['%' + searchPhone]);
      
      if (!lead) {
        console.log(`Lead not found for phone ending in ${searchPhone}`);
        return;
      }

      const currentState = lead.wa_state || 'initial';
      let nextState = currentState;
      let replyText = '';
      let pointsToAdd = 0;
      let markQualified = false;
      let primaryConcern = lead.primary_concern;
      let consultationPref = lead.consultation_preference;

      // Award 20 points for the VERY first reply to the assessment message
      if (currentState === 'initial' || currentState === 'none') {
        pointsToAdd += 20; 
      }

      // ── STATE MACHINE LOGIC ──
      switch (currentState) {
        case 'none':
        case 'initial':
          if (incomingText === '1') {
            pointsToAdd += 10; // Selected 1, 2, or 3
            replyText = "Thank you.\n\nIt's encouraging to hear that you believe you're adequately protected.\n\nWhich best describes your situation?\nA = I have comprehensive insurance cover\nB = I have some insurance cover but I'm not sure it's enough\nC = My insurance policies have not been reviewed in over 12 months\n\nReply A, B or C.";
            nextState = 'awaiting_1_followup';
          } else if (incomingText === '2') {
            pointsToAdd += 10; // Selected 1, 2, or 3
            replyText = "Thank you.\n\nWhich area concerns you most?\nA = Fire & Property Damage\nB = Employee Welfare\nC = Liability Claims\nD = Vehicle & Transit Risks\nE = Cyber & Data Risks\nF = Not Sure\n\nReply A, B, C, D, E or F.";
            nextState = 'awaiting_2_concern';
          } else if (incomingText === '3') {
            pointsToAdd += 10; // Selected 1, 2, or 3
            replyText = "Thank you.\n\nWould you prefer:\nA = WhatsApp Review\nB = Phone Call\nC = Virtual Meeting\n\nReply A, B or C.";
            nextState = 'awaiting_3_preference';
          } else {
            replyText = "Please reply with 1, 2, or 3.";
          }
          break;

        case 'awaiting_1_followup':
          if (incomingText === 'A') {
            replyText = "Excellent.\n\nWhen was the last time your insurance programme was professionally reviewed?\n\n1 = Within the last 12 months\n2 = 1–3 years ago\n3 = More than 3 years ago\n4 = Never\n\nReply 1, 2, 3 or 4.";
            nextState = 'awaiting_1a_review';
          } else if (incomingText === 'B') {
            replyText = "Thank you.\n\nWhich area concerns you most?\nA = Property or Fire Loss\nB = Medical Expenses\nC = Loss of Income\nD = Liability Claims\nE = Employee Protection\nF = Not Sure\n\nReply A, B, C, D, E or F.";
            nextState = 'awaiting_1b_concern';
          } else if (incomingText === 'C') {
            replyText = "Thank you.\n\nInsurance needs often change as businesses grow, assets increase, employees are hired, or responsibilities evolve.\n\nWould you like a complimentary Insurance Gap Review?\n\nYES / NO";
            nextState = 'awaiting_gap_review';
          } else {
            replyText = "Please reply with A, B or C.";
          }
          break;

        case 'awaiting_1a_review':
          if (incomingText === '1') {
            replyText = "Great.\n\nMany businesses still benefit from periodic benchmarking against current risks.\n\nWould you like a complimentary Insurance Gap Review?\n\nYES / NO";
            nextState = 'awaiting_gap_review';
          } else if (['2', '3', '4'].includes(incomingText)) {
            replyText = "Thank you.\n\nYour response suggests there may be value in reviewing whether your current insurance arrangements still align with your present risks.\n\nWould you like a complimentary Insurance Gap Review?\n\nYES / NO";
            nextState = 'awaiting_gap_review';
          } else {
            replyText = "Please reply with 1, 2, 3 or 4.";
          }
          break;

        case 'awaiting_1b_concern':
        case 'awaiting_2_concern':
          const concernMap1B = { A: 'Property/Fire', B: 'Medical', C: 'Income', D: 'Liability', E: 'Employee', F: 'Not Sure' };
          const concernMap2 = { A: 'Fire/Property', B: 'Employee', C: 'Liability', D: 'Vehicle/Transit', E: 'Cyber', F: 'Not Sure' };
          
          if (['A', 'B', 'C', 'D', 'E', 'F'].includes(incomingText)) {
            primaryConcern = currentState === 'awaiting_1b_concern' ? concernMap1B[incomingText] : concernMap2[incomingText];
            if (currentState === 'awaiting_1b_concern') {
              replyText = "Thank you.\n\nBased on your assessment and concerns, a personalized Insurance Gap Review may help identify areas that require attention.\n\nWould you like a complimentary review?\n\nYES / NO";
              nextState = 'awaiting_gap_review';
            } else {
              replyText = "Thank you.\n\nBased on your assessment, there may be opportunities to strengthen your protection in this area.\n\nWould you like a customized insurance recommendation based on your risk profile?\n\nPLAN / NO";
              nextState = 'awaiting_plan';
            }
          } else {
            replyText = "Please reply with A, B, C, D, E or F.";
          }
          break;

        case 'awaiting_gap_review':
          if (incomingText === 'YES') {
            pointsToAdd += 30; // Requested Review
            replyText = "Thank you.\n\nWould you prefer:\nA = WhatsApp Review\nB = Phone Call\nC = Virtual Meeting\n\nReply A, B or C.";
            nextState = 'awaiting_3_preference';
          } else if (incomingText === 'NO') {
            replyText = "Noted. We are always here if you change your mind. Have a great day!";
            nextState = 'finished';
          } else {
            replyText = "Please reply with YES or NO.";
          }
          break;

        case 'awaiting_plan':
          if (incomingText === 'PLAN') {
            pointsToAdd += 30; // Requested PLAN
            replyText = "Thank you.\n\nWould you prefer:\nA = WhatsApp Review\nB = Phone Call\nC = Virtual Meeting\n\nReply A, B or C.";
            nextState = 'awaiting_3_preference';
          } else if (incomingText === 'NO') {
            replyText = "Noted. We are always here if you need us. Have a great day!";
            nextState = 'finished';
          } else {
            replyText = "Please reply with PLAN or NO.";
          }
          break;

        case 'awaiting_3_preference':
          const prefMap = { A: 'WhatsApp', B: 'Phone Call', C: 'Virtual Meeting' };
          if (['A', 'B', 'C'].includes(incomingText)) {
            pointsToAdd += 40; // Chose Consultation Type
            consultationPref = prefMap[incomingText];
            replyText = "Thank you.\n\nTo help us prepare for your review, which best describes you?\n\n1 = Business Owner\n2 = Employee\n3 = Self-Employed Professional\n4 = Family Provider\n\nReply 1, 2, 3 or 4.";
            nextState = 'awaiting_qualification';
          } else {
            replyText = "Please reply with A, B or C.";
          }
          break;

        case 'awaiting_qualification':
          const demoMap = { '1': 'Business Owner', '2': 'Employee', '3': 'Self-Employed Professional', '4': 'Family Provider' };
          if (['1', '2', '3', '4'].includes(incomingText)) {
            replyText = "Thank you. Your request has been received. Our advisor will reach out to you shortly via your preferred channel.";
            nextState = 'finished';
            markQualified = true;
          } else {
            replyText = "Please reply with 1, 2, 3 or 4.";
          }
          break;

        case 'finished':
          // Conversation is fully complete, do nothing.
          return;
      }

      // 2. Update Database & Send Next Message
      if (replyText) {
        // Send WhatsApp immediately
        await sendWhatsApp(phoneNumber, null, { _message: replyText });

        // Build updates
        let updateQuery = 'UPDATE leads SET wa_state = ?, engagement_points = engagement_points + ?';
        let queryParams = [nextState, pointsToAdd];
        
        if (primaryConcern && primaryConcern !== lead.primary_concern) {
          updateQuery += ', primary_concern = ?';
          queryParams.push(primaryConcern);
        }
        if (consultationPref && consultationPref !== lead.consultation_preference) {
          updateQuery += ', consultation_preference = ?';
          queryParams.push(consultationPref);
        }
        if (markQualified) {
          updateQuery += ", is_qualified = 1, status = 'contacted'";
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(lead.id);

        await run(updateQuery, queryParams);

        // 3. Notify Advisor if freshly qualified
        if (markQualified) {
          const adminEmail = process.env.ADMIN_EMAIL || 'admin@coverscore.site';
          const emailContent = `
            <h2>New Qualified Lead via WhatsApp! 🚀</h2>
            <p><strong>Name:</strong> ${lead.name || 'Unknown'}</p>
            <p><strong>Phone:</strong> ${phoneNumber}</p>
            <p><strong>Primary Concern:</strong> ${primaryConcern || 'Not specified'}</p>
            <p><strong>Consultation Preference:</strong> ${consultationPref || 'Not specified'}</p>
            <p><strong>Demographic:</strong> ${incomingText === '1' ? 'Business Owner' : incomingText === '2' ? 'Employee' : incomingText === '3' ? 'Self-Employed Professional' : 'Family Provider'}</p>
            <p><strong>Total Engagement Points:</strong> ${lead.engagement_points + pointsToAdd}</p>
            <hr />
            <p><a href="https://coverscore.site/admin">Login to CRM to view full details</a></p>
          `;
          
          try {
            await emailService.sendEmail({
              to: adminEmail,
              subject: `🚨 QUALIFIED LEAD: ${lead.name || phoneNumber} (Points: ${lead.engagement_points + pointsToAdd})`,
              html: emailContent
            });
            console.log('Notified advisor about newly qualified lead.');
          } catch (emailErr) {
            console.error('Failed to notify advisor via email:', emailErr.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('Webhook error:', error);
  }
});

module.exports = router;
