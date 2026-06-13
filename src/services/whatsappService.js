/**
 * WhatsApp Service - Africastalking Integration
 * Handles all WhatsApp messaging for CoverScore AI
 */

require('dotenv').config();
const fetch = require('node-fetch');

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_API_INSTANCE = process.env.EVOLUTION_API_INSTANCE || 'CoverScore';
const APP_URL = process.env.APP_URL || 'http://localhost:3016';

// WhatsApp message templates
const templates = {
  assessmentComplete: {
    title: 'Assessment Complete',
    template: `🧾 *Your CoverScore Risk Report is Ready*

Hi {{name}},

We've completed your risk assessment and identified areas that could expose you to significant financial loss if left unaddressed.

📊 *CoverScore:* {{score}}/100
⚠️ *Risk Level:* {{risk_level}}{{riskBreakdownMsg}}

💰 *Potential Financial Exposure:*
Based on your responses, a major uninsured incident could expose you to estimated losses between ₦{{min_loss}} and ₦{{max_loss}}.

While this does not guarantee a loss will occur, it highlights the level of financial impact your business or personal finances could face if the unexpected happens.

📋 Your report has identified key areas that may require attention and protection.

🔗 View your full report:
{{report_link}}

Before you move on, here's one important question:

❓ If an unexpected incident occurred tomorrow, are you confident you could absorb a loss of ₦{{max_loss}} without causing serious financial disruption?

Reply with:
1️⃣   YES – I believe I'm adequately protected
2️⃣   NO – I think there may be gaps in my protection
3️⃣   NOT SURE – I'd like a free review of my report

Simply reply with 1, 2, or 3.

—
CoverScore AI
Insurance Risk Intelligence Platform`
  },

  leadContacted: {
    title: 'Lead Contacted',
    template: `📞 *CoverScore AI - We'll be in touch!*

Hi {{name}},

Thank you for your interest in understanding your risk profile.

An insurance advisor will be reaching out to you shortly to discuss your assessment results and how we can help protect what matters most.

💡 *While you wait:*
• Review your risk report: {{reportUrl}}
• Learn about coverage options: {{coverageUrl}}

Questions? Reply to this message or call us directly.

—
CoverScore AI`
  },

  leadConverted: {
    title: 'Lead Converted',
    template: `🎉 *CoverScore AI - Congratulations!*

Hi {{name}},

Great news! Your insurance coverage is now active.

📋 *What's Covered:*
{{coverageDetails}}

🔒 *Your protection is in place*
Keep this confirmation for your records. Your advisor will provide full policy documents.

Need any adjustments? We're here to help.

—
CoverScore AI
Protecting What Matters Most`
  },

  followUpReminder: {
    title: 'Follow-up Reminder',
    template: `⏰ *CoverScore AI - Quick Reminder*

Hi {{name}},

Just a friendly reminder about your risk assessment.

You started an assessment but haven't completed it yet. Understanding your risk profile is the first step to protecting your business/family.

📊 *Take just 5 minutes to:*
• Identify your risk gaps
• Get personalized recommendations
• Speak with an advisor

👉 {{assessmentUrl}}

It's free, quick, and could save you significant stress (and money) down the road!

—
CoverScore AI`
  },

  highRiskAlert: {
    title: 'High Risk Alert',
    template: `🚨 *CoverScore AI - Priority Attention*

Hi {{name}},

Your recent assessment shows *{{riskLevel}} risk* (Score: {{score}}/100).

⚠️ This means significant exposure that should be addressed promptly.

📋 *Key Concerns:*
{{keyRisks}}

💡 *Recommended Action:*
Schedule a consultation with an advisor to discuss coverage options. Many risks can be mitigated with the right insurance.

📞 Book now: {{consultationUrl}}

—
CoverScore AI`
  },

  welcome: {
    title: 'Welcome Message',
    template: `👋 *Welcome to CoverScore AI!*

Hi {{name}},

Thank you for choosing CoverScore AI to understand your risk profile.

🔍 *What we do:*
• Assess your business/personal risks
• Provide AI-powered recommendations
• Connect you with the right coverage

📊 *Ready to get started?*
Take our free risk assessment: {{assessmentUrl}}

It only takes 5-10 minutes!

—
CoverScore AI
Insurance Risk Intelligence
*Powered by AI*`
  },

  adminQuoteAlert: {
    title: 'Admin Quote Request Alert',
    template: `🚨 *NEW QUOTE REQUEST* 🚨

A new prospect has requested a quote via CoverScore AI.

👤 *Name:* {{name}}
📧 *Email:* {{email}}
📱 *Phone:* {{phone}}
🏢 *Business:* {{businessName}}

📋 *Details:*
• Type: {{insuranceTypes}}
• Est. Value: {{estimatedValue}}

💬 *Message:* 
{{message}}

🔗 View CRM: {{adminUrl}}`
  },

  adminConsultationAlert: {
    title: 'Admin Consultation Alert',
    template: `📅 *NEW CONSULTATION BOOKED* 📅

A new prospect has booked a consultation.

👤 *Name:* {{name}}
📧 *Email:* {{email}}
📱 *Phone:* {{phone}}

📋 *Booking Details:*
• Type: {{consultationType}}
• Date: {{consultationDate}}
• Time: {{consultationTime}}

💬 *Message:*
{{message}}

🔗 View CRM: {{adminUrl}}`
  },

  clientConsultationConfirmation: {
    title: 'Client Consultation Confirmation',
    template: `📅 *Consultation Confirmed*

Hi {{name}},

Your consultation has been successfully scheduled! 

📋 *Meeting Details:*
• Date: {{consultationDate}}
• Time: {{consultationTime}}

{{videoDetails}}

If you need to reschedule, please reply to this message.

—
CoverScore AI`
  }
};

// Normalize phone number to international format
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 0, replace with 234 (Nigeria)
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  }

  // If doesn't start with country code, assume Nigeria
  if (!cleaned.startsWith('234') && !cleaned.startsWith('1')) {
    cleaned = '234' + cleaned;
  }

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
};

// Build message from template
const buildMessage = (templateKey, data) => {
  const template = templates[templateKey];
  if (!template) {
    console.error(`Template ${templateKey} not found`);
    return null;
  }

  let message = template.template;

  // Replace all placeholders
  message = message.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });

  return message;
};

// Send WhatsApp message via Evolution API
const sendWhatsApp = async (to, templateKey, data = {}) => {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.warn('⚠️ WhatsApp not sent: Evolution API URL or Key not configured');
    return { success: false, error: 'Evolution API not configured' };
  }

  let phone = normalizePhoneNumber(to);
  if (!phone) {
    return { success: false, error: 'Invalid phone number' };
  }

  // Evolution API typically expects phone numbers without the '+' sign
  phone = phone.replace('+', '');

  let message = data._message;

  if (!message && templateKey) {
    message = buildMessage(templateKey, {
      name: data.name || 'Customer',
      score: data.score || '--',
      riskLevel: (data.riskLevel || 'unknown').toUpperCase(),
      summary: data.summary || 'See your full report for details.',
      nextSteps: data.nextSteps || 'Review your report and book a consultation.',
      reportUrl: data.reportUrl || `${APP_URL}/assessment/result/${data.assessmentId || ''}`,
      consultationUrl: data.consultationUrl || `${APP_URL}/consultation`,
      coverageUrl: data.coverageUrl || `${APP_URL}/quote`,
      assessmentUrl: data.assessmentUrl || `${APP_URL}/assessment/start`,
      coverageDetails: data.coverageDetails || 'See your policy documents.',
      keyRisks: data.keyRisks || 'Review your report for details.',
      ...data
    });
  }

  if (!message) {
    return { success: false, error: 'Failed to build message template' };
  }

  try {
    const sendUrl = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_API_INSTANCE}`;

    console.log(`📤 sendWhatsApp: Sending to ${phone} via ${sendUrl}`);

    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: phone,
        text: message,
        delay: 1200,
        presence: 'composing',
        linkPreview: true
      })
    });

    const responseText = await response.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error(`❌ Evolution API returned non-JSON response (Status: ${response.status}):`, responseText.substring(0, 250));
      return { success: false, error: `Invalid response from WhatsApp API (Status: ${response.status})` };
    }

    if (response.ok && (result.key || result.status === 'SUCCESS' || result.message?.key)) {
      console.log(`✅ WhatsApp sent to ${phone} via Evolution API`);
      return { success: true, messageId: result.key?.id || result.message?.key?.id || 'sent', messageBody: message };
    } else {
      console.error(`❌ Evolution API failed (Status: ${response.status}): ${JSON.stringify(result)}`);
      return { success: false, error: result.message || result.response?.message || JSON.stringify(result) };
    }
  } catch (error) {
    console.error(`❌ WhatsApp network error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG').format(amount);
};

// Send assessment completion notification
const sendAssessmentComplete = async (lead, assessment) => {
  const riskLevel = assessment.risk_level || 'moderate';
  
  // Use min/max loss from assessment if available, otherwise fallback to score-based formula
  const baseAmount = 500000 + (assessment.score || 50) * 100000;
  const minLoss = assessment.min_loss || baseAmount;
  const maxLoss = assessment.max_loss || (baseAmount * 3.5);
  
  return sendWhatsApp(lead.phone || lead.email, 'assessmentComplete', {
    name: lead.name || 'Customer',
    score: assessment.score || '--',
    risk_level: riskLevel.toUpperCase(),
    min_loss: formatCurrency(minLoss),
    max_loss: formatCurrency(maxLoss),
    report_link: `${APP_URL}/assessment/result/${assessment.id}`,
    assessmentId: assessment.id,
    riskBreakdownMsg: assessment.riskBreakdownMsg || ''
  });
};

// Send lead contacted notification
const sendLeadContacted = async (lead) => {
  return sendWhatsApp(lead.phone || lead.email, 'leadContacted', {
    name: lead.name || 'Customer',
    assessmentId: lead.assessment_id
  });
};

// Send lead converted notification
const sendLeadConverted = async (lead) => {
  return sendWhatsApp(lead.phone || lead.email, 'leadConverted', {
    name: lead.name || 'Customer',
    coverageDetails: 'Your policy documents have been sent to your email.'
  });
};

// Send follow-up reminder
const sendFollowUpReminder = async (lead) => {
  return sendWhatsApp(lead.phone || lead.email, 'followUpReminder', {
    name: lead.name || 'Customer'
  });
};

// Send high risk alert to sales team
const sendHighRiskAlert = async (lead, assessment) => {
  // For high/critical risks, also notify via in-app or email
  // WhatsApp primarily goes to customer

  // If customer has WhatsApp, send them the alert
  if (lead.phone) {
    return sendWhatsApp(lead.phone, 'highRiskAlert', {
      name: lead.name || 'Customer',
      score: assessment.score || '--',
      riskLevel: assessment.risk_level || 'high',
      keyRisks: 'Multiple areas of concern identified in your assessment require prompt attention.',
      assessmentId: assessment.id
    });
  }

  return { success: false, error: 'No phone number available' };
};

// Admin Notifications
const sendAdminWhatsAppQuoteAlert = async (leadData) => {
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) {
    console.log('⚠️ No ADMIN_PHONE configured for WhatsApp notifications.');
    return { success: false, error: 'No ADMIN_PHONE configured' };
  }
  
  return sendWhatsApp(adminPhone, 'adminQuoteAlert', {
    name: leadData.name || 'N/A',
    email: leadData.email || 'N/A',
    phone: leadData.phone || 'N/A',
    businessName: leadData.businessName || 'N/A',
    insuranceTypes: leadData.insuranceTypes || 'N/A',
    estimatedValue: leadData.estimatedValue || 'N/A',
    message: leadData.message || 'No message provided',
    adminUrl: `${APP_URL}/admin`
  });
};

const sendAdminWhatsAppConsultationAlert = async (leadData) => {
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) {
    console.log('⚠️ No ADMIN_PHONE configured for WhatsApp notifications.');
    return { success: false, error: 'No ADMIN_PHONE configured' };
  }
  
  return sendWhatsApp(adminPhone, 'adminConsultationAlert', {
    name: leadData.name || 'N/A',
    email: leadData.email || 'N/A',
    phone: leadData.phone || 'N/A',
    consultationType: leadData.consultationType || 'N/A',
    consultationDate: leadData.consultationDate || 'N/A',
    consultationTime: leadData.consultationTime || 'N/A',
    message: leadData.message || 'No message provided',
    adminUrl: `${APP_URL}/admin`
  });
};

const sendClientWhatsAppConsultationConfirmation = async (leadData, meetLink) => {
  if (!leadData.phone) return { success: false, error: 'No phone number provided' };

  let videoDetails = '';
  if (leadData.consultationType === 'video' && meetLink) {
    videoDetails = `🎥 *Google Meet Link:*\n${meetLink}\n(Click this link at the scheduled time to join)`;
  } else if (leadData.consultationType === 'phone') {
    videoDetails = `📞 Our advisor will call you at this number.`;
  }

  return sendWhatsApp(leadData.phone, 'clientConsultationConfirmation', {
    name: leadData.name || 'Customer',
    consultationDate: leadData.consultationDate || 'TBD',
    consultationTime: leadData.consultationTime || 'TBD',
    videoDetails
  });
};

module.exports = {
  sendWhatsApp,
  sendAssessmentComplete,
  sendLeadContacted,
  sendLeadConverted,
  sendFollowUpReminder,
  sendHighRiskAlert,
  sendAdminWhatsAppQuoteAlert,
  sendAdminWhatsAppConsultationAlert,
  sendClientWhatsAppConsultationConfirmation,
  normalizePhoneNumber,
  buildMessage,
  templates
};