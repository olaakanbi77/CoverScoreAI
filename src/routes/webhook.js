const express = require('express');
const router = express.Router();
const { sendWhatsApp } = require('../services/whatsappService');
const emailService = require('../services/emailService');

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

      incomingText = incomingText.trim();
      if (!incomingText) return;

      // Extract sender's phone number
      const remoteJid = messageData.key.remoteJid;
      if (!remoteJid) return;
      const phoneNumber = remoteJid.split('@')[0];

      console.log(`Received WhatsApp reply from ${phoneNumber}: "${incomingText}"`);

      // Determine the response based on the input
      if (incomingText === '1') {
        const replyText = "That's great. Would you like us to conduct a complimentary insurance gap analysis to confirm your current protection is adequate?";
        await sendWhatsApp(phoneNumber, null, { _message: replyText });
      } 
      else if (incomingText === '2') {
        const replyText = "Thank you. Which concerns you most right now?\n\nA) Property/Fire\nB) Employee Welfare\nC) Liability\nD) Vehicles/Transit\nE) Other";
        await sendWhatsApp(phoneNumber, null, { _message: replyText });
      } 
      else if (incomingText === '3') {
        const replyText = "Thank you. We'd like to offer you a free review of your report.\n\nPlease book a consultation with our advisor here:\nhttps://coverscore.site/consultation";
        await sendWhatsApp(phoneNumber, null, { _message: replyText });
        
        // Notify advisor
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@coverscore.site';
        const emailContent = `
          <h2>New Consultation Request via WhatsApp</h2>
          <p>A prospect has requested a report review via the WhatsApp automation.</p>
          <p><strong>Phone Number:</strong> ${phoneNumber}</p>
          <p>They selected option 3: "NOT SURE - I'd like a free review of my report".</p>
        `;
        
        try {
          await emailService.sendEmail({
            to: adminEmail,
            subject: `🚨 WhatsApp Lead Request: Report Review (${phoneNumber})`,
            html: emailContent
          });
          console.log('Notified advisor about option 3 selection.');
        } catch (emailErr) {
          console.error('Failed to notify advisor via email:', emailErr.message);
        }
      }
      else if (['A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e'].includes(incomingText)) {
        // Handle follow up for Option 2
        const replyText = "Noted. An advisor specializing in this area will review your profile and reach out to you shortly.";
        await sendWhatsApp(phoneNumber, null, { _message: replyText });
      }
    }
  } catch (error) {
    console.error('Webhook error:', error);
  }
});

module.exports = router;
