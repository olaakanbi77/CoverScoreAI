const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;
let etherealAccount = null;
let transporterReady = null; // Promise that resolves when transporter is initialized

// Sanitize App Password — Google App Passwords are 16 chars, often displayed with spaces
const sanitizeAppPassword = (pass) => {
  if (!pass) return pass;
  // Remove all spaces (Google App Passwords work with or without spaces)
  return pass.replace(/\s+/g, '');
};

// Create transporter based on environment configuration
const createTransporter = () => {
  const smtpService = (process.env.SMTP_SERVICE || '').trim().toLowerCase();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  console.log('📧 SMTP Config Debug:');
  console.log(`   SMTP_SERVICE: "${smtpService}"`);
  console.log(`   SMTP_USER: "${smtpUser}"`);
  console.log(`   SMTP_PASS: "${smtpPass ? smtpPass.substring(0, 4) + '****' : '(empty)'}"`);
  console.log(`   SMTP_PASS length: ${smtpPass.length}`);
  console.log(`   SMTP_HOST: "${process.env.SMTP_HOST || '(not set)'}"`);
  console.log(`   SMTP_PORT: "${process.env.SMTP_PORT || '(not set)'}"`);
  console.log(`   SMTP_FROM: "${process.env.SMTP_FROM || '(not set)'}"`);

  // If using Gmail with App Passwords
  if (smtpService === 'gmail' && smtpUser && smtpPass) {
    const cleanPass = sanitizeAppPassword(smtpPass);
    console.log(`   Using Gmail service transport (password cleaned: ${smtpPass.length} -> ${cleanPass.length} chars)`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: cleanPass
      }
    });
  }

  // If using SendGrid
  if (smtpService === 'sendgrid' && process.env.SMTP_API_KEY) {
    console.log('   Using SendGrid transport');
    return nodemailer.createTransport({
      service: 'sendgrid',
      auth: {
        apiKey: process.env.SMTP_API_KEY
      }
    });
  }

  // Default to custom SMTP server with explicit Gmail fallback
  // If user set SMTP_USER to a gmail address but forgot SMTP_SERVICE, auto-detect
  if (smtpUser.endsWith('@gmail.com') && smtpPass) {
    const cleanPass = sanitizeAppPassword(smtpPass);
    console.log('   Auto-detected Gmail from SMTP_USER, using Gmail service transport');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: cleanPass
      }
    });
  }

  // Generic SMTP
  console.log('   Using generic SMTP transport');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
};

// Initialize transporter (returns a promise)
const initTransporter = async () => {
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  if (!smtpUser || !smtpPass) {
    // Create Ethereal test account for development
    if (process.env.NODE_ENV === 'development' || process.env.SMTP_HOST === 'smtp.ethereal.email') {
      try {
        const testAccount = await nodemailer.createTestAccount();
        etherealAccount = testAccount;
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('📧 Using Ethereal email for testing:');
        console.log(`   User: ${testAccount.user}`);
        console.log(`   Pass: ${testAccount.pass}`);
        console.log(`   Preview URL: https://ethereal.email/login`);
        return;
      } catch (err) {
        console.error('Failed to create Ethereal account:', err.message);
      }
    }
    console.warn('⚠️ SMTP not configured. Emails will not be sent.');
    console.warn(`   SMTP_USER is: "${smtpUser || '(empty)'}"`);
    console.warn(`   SMTP_PASS is: "${smtpPass ? '(set)' : '(empty)'}"`);
    return;
  }

  transporter = createTransporter();

  // Verify the connection works
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully — emails will be sent');
  } catch (err) {
    console.error('❌ SMTP verification FAILED:', err.message);
    console.error('   Emails will likely fail until this is resolved.');
    console.error('   Common fixes:');
    console.error('   1. Regenerate your Google App Password');
    console.error('   2. Ensure SMTP_PASS has no extra spaces or quotes');
    console.error('   3. Check that 2-Step Verification is enabled on your Google account');
    // Don't null out transporter — let it try and fail with proper error messages
  }
};

// Initialize on module load and store the promise
transporterReady = initTransporter();

// Ensure transporter is ready before sending
const ensureReady = async () => {
  if (transporterReady) {
    await transporterReady;
  }
};

const sendAssessmentReport = async (to, assessmentResult) => {
  await ensureReady();

  if (!transporter) {
    console.warn('⚠️ Email not sent: SMTP not configured');
    throw new Error('Email service not configured. Please check SMTP settings.');
  }

  const { score, riskLevel, aiReport, businessName } = assessmentResult;
  const explanations = aiReport?.explanations;

  const riskColors = {
    low: '#22C55E',
    moderate: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444'
  };

  // Build AI Explanation Layer HTML
  let explanationHtml = '';

  // Personalized Narrative
  if (explanations?.narrative) {
    explanationHtml += `
      <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 12px; padding: 24px; margin-bottom: 24px; position: relative;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
          <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #3b82f6;">Your Personalized Analysis</span>
        </div>
        <p style="font-size: 15px; line-height: 1.8; color: #1e293b; margin: 0;">${explanations.narrative}</p>
      </div>`;
  }

  // Risk Contexts with Why This Matters
  if (explanations?.riskContexts?.length) {
    explanations.riskContexts.forEach(ctx => {
      const impactColors = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };
      const impactColor = impactColors[ctx.impact] || '#f59e0b';
      explanationHtml += `
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 16px; overflow: hidden;">
          <div style="display: flex; align-items: center; gap: 14px; padding: 18px 20px; border-bottom: 1px solid #e2e8f0;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: ${impactColor}15; display: flex; align-items: center; justify-content: center;">
              <span style="color: ${impactColor}; font-size: 18px;">⚠️</span>
            </div>
            <div>
              <div style="font-size: 15px; font-weight: 600; color: #1e293b;">${ctx.factor}</div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${impactColor};">${ctx.impact} Priority</div>
            </div>
          </div>
          <div style="padding: 18px 20px;">
            <p style="font-size: 14px; line-height: 1.7; color: #1e293b; margin: 0 0 14px;">${ctx.explanation}</p>
            <div style="padding: 12px 16px; background: #f8fafc; border-left: 3px solid #3b82f6; border-radius: 0 8px 8px 0;">
              <p style="font-size: 13px; color: #64748b; margin: 0;"><strong style="color: #3b82f6;">Why this matters:</strong> ${ctx.why}</p>
            </div>
          </div>
        </div>`;
    });
  }

  // Urgency Section
  if (explanations?.urgency) {
    const urgencyBg = riskLevel === 'critical' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)';
    const urgencyBorder = riskLevel === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
    explanationHtml += `
      <div style="background: ${urgencyBg}; border: 1px solid ${urgencyBorder}; border-radius: 12px; padding: 22px 24px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <span style="font-size: 16px;">⏰</span>
          <span style="font-size: 14px; font-weight: 600; color: #1e293b;">Time Sensitivity</span>
        </div>
        <p style="font-size: 14px; line-height: 1.7; color: #1e293b; margin: 0 0 14px;">${explanations.urgency.message}</p>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${(explanations.urgency.reasons || []).map(reason => `<li style="font-size: 13px; color: #64748b; padding: 4px 0; padding-left: 16px; position: relative;">→ ${reason}</li>`).join('')}
        </ul>
      </div>`;
  }

  // Education Section
  if (explanations?.education?.length) {
    explanationHtml += `
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
        <div style="padding: 18px 20px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 14px; font-weight: 600; color: #1e293b;">Understanding Your Options</div>
        </div>
        <div style="padding: 20px;">`;
    explanations.education.forEach(edu => {
      explanationHtml += `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 600; color: #3b82f6; margin-bottom: 4px;">${edu.recommendation}</div>
            <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0 0 6px;">${edu.explanation}</p>
            <div style="font-size: 12px; color: #22c55e; padding: 6px 10px; background: rgba(34, 197, 94, 0.08); border-radius: 6px;">✓ ${edu.benefit}</div>
          </div>`;
    });
    explanationHtml += `
        </div>
      </div>`;
  }

        let riskBreakdownHtml = '';
        if (aiReport?.risk_categories) {
          const categories = Object.entries(aiReport.risk_categories).map(([key, val]) => {
            const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-size: 14px; font-weight: 500;">${title}</span>
              <span style="color: #1e293b; font-size: 14px; font-weight: 700;">${val}/100</span>
            </div>`;
          }).join('');

          riskBreakdownHtml = `
            <div style="margin-bottom: 24px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="font-size: 16px; font-weight: 600; color: #1e293b; margin: 0 0 12px;">Risk Breakdown</h2>
              ${categories}
            </div>
          `;
        }

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Risk Assessment Report - CoverScore AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">CoverScore AI</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Your Personalized Risk Report</p>
      </div>

      <div style="padding: 32px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; background: ${riskColors[riskLevel]}15; border: 2px solid ${riskColors[riskLevel]}; border-radius: 12px; padding: 16px 32px;">
            <div style="font-size: 48px; font-weight: 700; color: ${riskColors[riskLevel]};">${score}</div>
            <div style="font-size: 14px; font-weight: 600; color: ${riskColors[riskLevel]}; text-transform: uppercase;">${riskLevel} Risk</div>
          </div>
        </div>

        ${riskBreakdownHtml}

        ${explanationHtml}

        ${aiReport?.topRisks?.length ? `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: 600; color: #1e293b; margin: 0 0 12px;">Top Risks Identified</h2>
          ${aiReport.topRisks.map((risk, i) => `
            <div style="background: #f8fafc; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;">
              <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${i + 1}. ${risk.risk}</div>
              <div style="color: #64748b; font-size: 13px; margin-top: 4px;">${risk.description}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${aiReport?.recommendations?.length ? `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: 600; color: #1e293b; margin: 0 0 12px;">Recommended Coverage</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${aiReport.recommendations.map(rec => {
              const recText = typeof rec === 'object' ? (rec.product || rec.name || rec.title || rec.recommendation || Object.values(rec)[0] || JSON.stringify(rec)) : rec;
              return `<span style="background: #3b82f6; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">${recText}</span>`;
            }).join('')}
          </div>
        </div>
        ` : ''}

        ${explanations?.conversion ? `
        <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">${explanations.conversion.headline}</div>
          <p style="font-size: 14px; color: #64748b; margin: 0 0 20px; line-height: 1.6;">${explanations.conversion.subtext}</p>
        </div>
        ` : ''}

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <a href="${process.env.APP_URL || 'http://localhost:3016'}/assessment/result/${assessmentResult.assessmentId}" style="flex: 1; display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center;">View Full Report</a>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 12px;">
          <a href="${process.env.APP_URL || 'http://localhost:3016'}/quote" style="flex: 1; display: inline-block; background: #22c55e; color: white; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center;">Request Quote</a>
          <a href="${process.env.APP_URL || 'http://localhost:3016'}/consultation" style="flex: 1; display: inline-block; background: white; color: #3b82f6; border: 2px solid #3b82f6; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center;">Book Consultation</a>
        </div>
      </div>

      <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          CoverScore AI - Insurance Risk Intelligence Platform (Africa)<br>
          This report is generated by AI and should be reviewed with a licensed insurance professional. Local recommendations comply with NAICOM and relevant regional insurance regulations.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    console.log(`📧 Attempting to send assessment report email to: ${to}`);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"CoverScore AI" <noreply@coverscore.ai>',
      to: to,
      subject: `Risk Assessment Report - ${businessName || 'Your Business'} (Score: ${score})`,
      html: html
    });

    // Log Ethereal preview URL if using test account
    if (etherealAccount) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Email preview (Ethereal): ${previewUrl}`);
    }

    console.log(`✅ Assessment report email sent successfully to ${to} (messageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send FAILED to ${to}:`, error.message);
    throw error; // Propagate so caller knows it failed
  }
};

const sendPasswordResetEmail = async (to, resetToken) => {
  await ensureReady();

  if (!transporter) {
    console.warn('⚠️ Email not sent: SMTP not configured');
    throw new Error('Email service not configured. Please check SMTP settings.');
  }

  const resetUrl = `${process.env.APP_URL || 'http://localhost:3016'}/auth/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset - CoverScore AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">CoverScore AI</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Password Reset Request</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">You requested a password reset for your CoverScore AI account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    console.log(`📧 Attempting to send password reset email to: ${to}`);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"CoverScore AI" <noreply@coverscore.ai>',
      to: to,
      subject: 'CoverScore AI - Password Reset',
      html: html
    });

    // Log Ethereal preview URL if using test account
    if (etherealAccount) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Password reset email preview (Ethereal): ${previewUrl}`);
    }

    console.log(`✅ Password reset email sent successfully to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Password reset email FAILED to ${to}:`, error.message);
    throw error;
  }
};

const sendEmail = async (options) => {
  await ensureReady();

  if (!transporter) {
    console.warn('⚠️ Email not sent: SMTP not configured');
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    console.log(`📧 Attempting to send email to: ${options.to} (subject: ${options.subject})`);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"CoverScore AI" <noreply@coverscore.ai>',
      to: options.to,
      subject: options.subject,
      html: options.html
    });

    if (etherealAccount) {
      console.log(`📧 Email preview (Ethereal): ${nodemailer.getTestMessageUrl(info)}`);
    }
    console.log(`✅ Email sent successfully to ${options.to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send FAILED to ${options.to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Diagnostic function for health check / debugging
const getDiagnostics = async () => {
  await ensureReady();
  return {
    configured: !!transporter,
    service: (process.env.SMTP_SERVICE || '').trim().toLowerCase() || 'auto',
    user: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : '(not set)',
    passLength: (process.env.SMTP_PASS || '').trim().length,
    from: process.env.SMTP_FROM || '(not set)',
    ethereal: !!etherealAccount
  };
};

// Admin Notifications
const sendAdminQuoteNotification = async (leadData) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@coverscore.site';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0f172a;">New Quote Request</h2>
      <p>A new quote request has been submitted on CoverScore AI.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <h3 style="margin-top: 0; color: #1e293b;">Contact Details</h3>
        <p><strong>Name:</strong> ${leadData.name}</p>
        <p><strong>Email:</strong> ${leadData.email}</p>
        <p><strong>Phone:</strong> ${leadData.phone}</p>
        ${leadData.businessName ? `<p><strong>Business Name:</strong> ${leadData.businessName}</p>` : ''}
        
        <h3 style="color: #1e293b;">Quote Details</h3>
        <p><strong>Insurance Types:</strong> ${leadData.insuranceTypes || 'Not specified'}</p>
        <p><strong>Estimated Value:</strong> ${leadData.estimatedValue || 'Not specified'}</p>
        ${leadData.message ? `<p><strong>Message:</strong><br>${leadData.message}</p>` : ''}
      </div>
      
      <p style="margin-top: 20px;">
        <a href="${process.env.APP_URL || 'http://localhost:3016'}/admin" style="background-color: #2563eb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View in CRM</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Quote Request: ${leadData.name}`,
    html
  });
};

const sendAdminConsultationNotification = async (leadData) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@coverscore.site';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0f172a;">New Consultation Request</h2>
      <p>A new consultation has been booked on CoverScore AI.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <h3 style="margin-top: 0; color: #1e293b;">Contact Details</h3>
        <p><strong>Name:</strong> ${leadData.name}</p>
        <p><strong>Email:</strong> ${leadData.email}</p>
        <p><strong>Phone:</strong> ${leadData.phone}</p>
        
        <h3 style="color: #1e293b;">Booking Details</h3>
        <p><strong>Type:</strong> ${leadData.consultationType || 'Not specified'}</p>
        <p><strong>Date:</strong> ${leadData.consultationDate || 'Not specified'}</p>
        <p><strong>Time:</strong> ${leadData.consultationTime || 'Not specified'}</p>
        ${leadData.message ? `<p><strong>Message:</strong><br>${leadData.message}</p>` : ''}
      </div>
      
      <p style="margin-top: 20px;">
        <a href="${process.env.APP_URL || 'http://localhost:3016'}/admin" style="background-color: #2563eb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View in CRM</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Consultation Booking: ${leadData.name}`,
    html
  });
};

module.exports = { 
  sendAssessmentReport, 
  sendPasswordResetEmail, 
  sendEmail, 
  getDiagnostics,
  sendAdminQuoteNotification,
  sendAdminConsultationNotification
};
