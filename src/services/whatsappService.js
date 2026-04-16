/**
 * WhatsApp Service - Africastalking Integration
 * Handles all WhatsApp messaging for CoverScore AI
 */

require('dotenv').config();
const fetch = require('node-fetch');

const AFRICASTALKING_USERNAME = process.env.AFRICASTALKING_USERNAME || 'sandbox';
const AFRICASTALKING_API_KEY = process.env.AFRICASTALKING_API_KEY;
const AFRICASTALKING_SENDER_ID = process.env.AFRICASTALKING_SENDER_ID || 'CoverScore';
const APP_URL = process.env.APP_URL || 'http://localhost:3016';

const WHATSAPP_API_URL = 'https://api.africastalking.com/waids/1/messages';

// WhatsApp message templates
const templates = {
  assessmentComplete: {
    title: 'Assessment Complete',
    template: `🧾 *CoverScore AI - Risk Assessment Complete!*

Hi {{name}},

Your risk assessment has been processed successfully.

📊 *Your Score:* {{score}}/100
⚠️ *Risk Level:* {{riskLevel}}

📋 *Summary:*
{{summary}}

🔗 View your full report: {{reportUrl}}

💡 *Next Steps:*
{{nextSteps}}

Need help understanding your results? Book a free consultation: {{consultationUrl}}

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

// Send WhatsApp message via Africastalking
const sendWhatsApp = async (to, templateKey, data = {}) => {
  if (!AFRICASTALKING_API_KEY) {
    console.warn('⚠️ WhatsApp not sent: Africastalking API key not configured');
    return { success: false, error: 'API key not configured' };
  }

  const phone = normalizePhoneNumber(to);
  if (!phone) {
    return { success: false, error: 'Invalid phone number' };
  }

  const message = buildMessage(templateKey, {
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

  if (!message) {
    return { success: false, error: 'Failed to build message template' };
  }

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'apiKey': AFRICASTALKING_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: AFRICASTALKING_USERNAME,
        to: [phone],
        from: AFRICASTALKING_SENDER_ID,
        message: message
      })
    });

    const result = await response.json();

    if (result.status === 'success' || result.statusCode === '0' || result.entries?.length > 0) {
      console.log(`✅ WhatsApp sent to ${phone}`);
      return { success: true, messageId: result.entries?.[0]?.messageId || result.messageId || 'sent' };
    } else {
      console.error(`❌ WhatsApp failed: ${JSON.stringify(result)}`);
      return { success: false, error: result.errorMessage || result.description || 'Send failed' };
    }
  } catch (error) {
    console.error(`❌ WhatsApp error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send assessment completion notification
const sendAssessmentComplete = async (lead, assessment) => {
  const riskEmojis = {
    low: '✅',
    moderate: '⚠️',
    high: '🚨',
    critical: '🚨'
  };

  const riskLevel = assessment.risk_level || 'moderate';
  const emoji = riskEmojis[riskLevel] || '📊';

  return sendWhatsApp(lead.phone || lead.email, 'assessmentComplete', {
    name: lead.name || 'Customer',
    score: assessment.score || '--',
    riskLevel: riskLevel,
    summary: `Your ${riskLevel} risk profile requires ${riskLevel === 'critical' || riskLevel === 'high' ? 'prompt' : 'timely'} attention.`,
    nextSteps: riskLevel === 'critical' || riskLevel === 'high'
      ? 'Book a consultation with an advisor immediately to discuss urgent coverage needs.'
      : 'Review your report at your convenience and consider speaking with an advisor.',
    assessmentId: assessment.id
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

module.exports = {
  sendWhatsApp,
  sendAssessmentComplete,
  sendLeadContacted,
  sendLeadConverted,
  sendFollowUpReminder,
  sendHighRiskAlert,
  normalizePhoneNumber,
  buildMessage,
  templates
};