const fs = require('fs');

const followUpFile = 'src/views/advisor/follow-up.hbs';
if (fs.existsSync(followUpFile)) {
  let content = fs.readFileSync(followUpFile, 'utf8');
  content = content.replace(/<a href="javascript:void\(0\)" class="btn-call">/, '<a href="tel:+2348000000000" class="btn-call">');
  content = content.replace(/<a href="javascript:void\(0\)" class="qa-btn wa">/, '<a href="https://wa.me/" class="qa-btn wa" target="_blank">');
  content = content.replace(/<a href="javascript:void\(0\)" class="qa-btn call">/, '<a href="tel:+2348000000000" class="qa-btn call">');
  content = content.replace(/<a href="javascript:void\(0\)" class="qa-btn email">/, '<a href="mailto:info@example.com" class="qa-btn email">');
  content = content.replace(/<a href="javascript:void\(0\)" class="qa-btn sched">/, '<a href="/admin/calendar" class="qa-btn sched">');
  content = content.replace(/<button class="btn-complete">/, '<button class="btn-complete" onclick="window.location.href=\'/advisor/dashboard\'">');
  content = content.replace(/<a href="javascript:void\(0\)" class="view-full">/, '<a href="/admin/leads" class="view-full">');
  content = content.replace(/<a href="javascript:void\(0\)" class="card-link">View All<\/a>/, '<a href="/admin/leads" class="card-link">View All</a>');
  content = content.replace(/<a href="javascript:void\(0\)" class="card-link">Edit<\/a>/, '<a href="/admin/leads" class="card-link">Edit</a>');
  fs.writeFileSync(followUpFile, content);
}

const notifFile = 'src/views/advisor/notifications.hbs';
if (fs.existsSync(notifFile)) {
  let content = fs.readFileSync(notifFile, 'utf8');
  content = content.replace(/<a href="javascript:void\(0\)" class="notif-card c-green">/, '<a href="/admin/opportunities" class="notif-card c-green">');
  content = content.replace(/<a href="javascript:void\(0\)" class="notif-card c-blue">/, '<a href="/admin/opportunities" class="notif-card c-blue">');
  content = content.replace(/<a href="javascript:void\(0\)" class="notif-card c-purple">/, '<a href="/admin/assessments" class="notif-card c-purple">');
  // First c-orange is New Lead
  content = content.replace(/<a href="javascript:void\(0\)" class="notif-card c-orange">/, '<a href="/admin/leads" class="notif-card c-orange">');
  // Second c-orange is Follow Up Reminder
  content = content.replace(/<a href="javascript:void\(0\)" class="notif-card c-orange">/, '<a href="/advisor/follow-up/1" class="notif-card c-orange">');
  content = content.replace(/<a href="javascript:void\(0\)" class="notif-card c-red">/, '<a href="/admin/leads" class="notif-card c-red">');
  content = content.replace(/<a href="javascript:void\(0\)" class="notif-card c-teal">/, '<a href="/admin/leads" class="notif-card c-teal">');
  content = content.replace(/<a href="javascript:void\(0\)" class="notif-card c-indigo">/, '<a href="/admin/opportunities" class="notif-card c-indigo">');
  content = content.replace(/<a href="javascript:void\(0\)" class="btn-pref">Manage Preferences<\/a>/, '<a href="/admin/settings" class="btn-pref">Manage Preferences</a>');
  fs.writeFileSync(notifFile, content);
}

console.log("Done updating links.");
