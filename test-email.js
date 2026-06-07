require('dotenv').config();

console.log('=== Email Service Diagnostic Test ===\n');

// Show what env vars are loaded
console.log('Environment variables:');
console.log(`  SMTP_SERVICE: "${process.env.SMTP_SERVICE}"`);
console.log(`  SMTP_USER: "${process.env.SMTP_USER}"`);
console.log(`  SMTP_PASS: "${process.env.SMTP_PASS}" (length: ${(process.env.SMTP_PASS || '').length})`);
console.log(`  SMTP_FROM: "${process.env.SMTP_FROM}"`);
console.log('');

const { sendEmail, getDiagnostics } = require('./src/services/emailService');

(async () => {
  // Wait a moment for async init
  console.log('Waiting for transporter initialization...\n');

  const diag = await getDiagnostics();
  console.log('Diagnostics:', JSON.stringify(diag, null, 2));
  console.log('');

  if (!diag.configured) {
    console.error('❌ Transporter not configured. Cannot send test email.');
    process.exit(1);
  }

  console.log('Sending test email...\n');
  const result = await sendEmail({
    to: 'olaakanbi77@gmail.com',
    subject: 'CoverScore AI - Email Test (Overhauled)',
    html: '<h2>Email Service Working!</h2><p>If you received this, the overhauled email service is working correctly.</p>'
  });

  console.log('\nResult:', JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
})();
