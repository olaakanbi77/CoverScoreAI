const cron = require('node-cron');
const { all, run } = require('../config/database');
const { sendWhatsApp } = require('./whatsappService');
const { sendEmail } = require('./emailService');

const startCronJobs = () => {
  // Run every day at 08:00 AM server time
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily automation tasks...');
    try {
      await processBirthdaysAndAnniversaries();
      await processRenewalNotices();
      await processMonthlyRiskTips();
    } catch (error) {
      console.error('Error running daily automation tasks:', error);
    }
  });

  // Run every hour to check for proposal follow-ups
  cron.schedule('0 * * * *', async () => {
    console.log('Running hourly automation tasks...');
    try {
      await processProposalFollowUps();
    } catch (error) {
      console.error('Error running hourly automation tasks:', error);
    }
  });
};

const sendMultiChannelMessage = async (lead, subject, message) => {
  // WhatsApp
  if (lead.phone) {
    try {
      await sendWhatsApp(lead.phone, null, { _message: message });
    } catch (err) {
      console.error(`Failed to send WA to ${lead.phone}:`, err.message);
    }
  }

  // Email
  if (lead.email && lead.email !== 'whatsapp@coverscore.site') {
    try {
      await sendEmail({
        to: lead.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
        `
      });
    } catch (err) {
      console.error(`Failed to send Email to ${lead.email}:`, err.message);
    }
  }
};

const processBirthdaysAndAnniversaries = async () => {
  const today = new Date();
  const monthDay = String(today.getDate()).padStart(2, '0') + '/' + String(today.getMonth() + 1).padStart(2, '0');
  
  // Leads with birthday today (format assumed DD/MM/YYYY)
  const leads = await all("SELECT * FROM leads WHERE birth_date LIKE ? OR anniversary_date LIKE ?", [`%${monthDay}%`, `%${monthDay}%`]);
  
  for (const lead of leads) {
    if (lead.birth_date && lead.birth_date.startsWith(monthDay)) {
      const msg = `Happy Birthday ${lead.name.split(' ')[0]}! 🎉\n\nWishing you a fantastic day and a prosperous year ahead.\n\n— Your Team at CoverScore`;
      await sendMultiChannelMessage(lead, 'Happy Birthday from CoverScore!', msg);
    }

    if (lead.anniversary_date && lead.anniversary_date.startsWith(monthDay)) {
      const msg = `Happy Wedding Anniversary ${lead.name.split(' ')[0]}! 🥂\n\nWishing you and your family continued joy and protection.\n\n— Your Team at CoverScore`;
      await sendMultiChannelMessage(lead, 'Happy Anniversary from CoverScore!', msg);
    }
  }
};

const processRenewalNotices = async () => {
  // For SQLite, expiry_date might be ISO string (YYYY-MM-DD...)
  // Let's compute target dates for 60, 30, 14, 7, 3 days from now
  const daysToCheck = [60, 30, 14, 7, 3];
  
  for (const days of daysToCheck) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const expiringPolicies = await all(`
      SELECT p.*, l.name, l.phone, l.email 
      FROM policies p 
      JOIN leads l ON p.lead_id = l.id 
      WHERE DATE(p.expiry_date) = DATE(?)
    `, [targetDateString]);
    
    for (const policy of expiringPolicies) {
      const msg = `Hello ${policy.name.split(' ')[0]},\n\nThis is a friendly reminder from CoverScore that your ${policy.product} policy (No. ${policy.policy_number}) will expire in exactly ${days} days.\n\nPlease reach out to us to arrange your renewal so your protection remains uninterrupted.`;
      await sendMultiChannelMessage(policy, `Renewal Notice: ${policy.product} expires in ${days} days`, msg);
    }
  }
};

const processMonthlyRiskTips = async () => {
  // Send a monthly tip if it has been roughly 30, 60, 90, 120... days since created_at
  const activeLeads = await all("SELECT * FROM leads WHERE status = 'Won' OR pipeline_stage = 5");
  
  const today = new Date();
  
  const tips = [
    "Risk Tip 💡: Review your property valuations annually to avoid being underinsured due to inflation.",
    "Risk Tip 💡: Did you know that cyber attacks often target small businesses? Consider reviewing your digital exposure.",
    "Risk Tip 💡: Life events like marriage or a new child should trigger a review of your Life Insurance coverage.",
    "Risk Tip 💡: A well-maintained emergency fund covers deductibles and prevents minor shocks from becoming major crises.",
    "Risk Tip 💡: Having a documented business continuity plan can significantly reduce recovery time after an incident."
  ];
  
  for (const lead of activeLeads) {
    const createdDate = new Date(lead.created_at);
    // Difference in days
    const diffTime = Math.abs(today - createdDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if diffDays is a multiple of 30, but not exactly 0.
    if (diffDays > 0 && diffDays % 30 === 0) {
      // Pick a tip based on the cycle (month 1, 2, 3...)
      const cycle = Math.floor(diffDays / 30);
      const tipIndex = (cycle - 1) % tips.length;
      const msg = `Hello ${lead.name.split(' ')[0]},\n\n${tips[tipIndex]}\n\n— Your CoverScore Risk Advisor`;
      
      await sendMultiChannelMessage(lead, 'Your Monthly CoverScore Risk Tip', msg);
    }
  }
};

const processProposalFollowUps = async () => {
  // Find leads in 'Proposal Sent' stage whose last update was between 24 and 48 hours ago
  const leads = await all(`
    SELECT * FROM leads 
    WHERE pipeline_stage = 'Proposal Sent' 
      AND updated_at <= datetime('now', '-24 hours')
      AND updated_at > datetime('now', '-48 hours')
  `);

  for (const lead of leads) {
    const msg = `Hi ${lead.name.split(' ')[0]},\n\nI'm following up on the CoverScore insurance proposal we sent over yesterday.\n\nDo you have any questions or would you like to schedule a quick call to review it together?\n\n— Your Team at CoverScore`;
    await sendMultiChannelMessage(lead, 'Following up on your CoverScore Proposal', msg);
    
    // We update the updated_at timestamp so it doesn't get picked up again in the next hour
    await run("UPDATE leads SET updated_at = datetime('now') WHERE id = ?", [lead.id]);
  }
};

module.exports = {
  startCronJobs,
  // Export for manual triggering
  processBirthdaysAndAnniversaries,
  processRenewalNotices,
  processMonthlyRiskTips,
  processProposalFollowUps
};
