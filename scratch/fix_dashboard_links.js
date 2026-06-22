const fs = require('fs');

const file = 'src/views/advisor/dashboard.hbs';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/<a href="javascript:void\(0\)" class="qa-item">\s*<div class="qa-icon green">/g, '<a href="/admin/leads" class="qa-item">\n            <div class="qa-icon green">');
  content = content.replace(/<a href="javascript:void\(0\)" class="qa-item">\s*<div class="qa-icon blue">/g, '<a href="/admin/assessments" class="qa-item">\n            <div class="qa-icon blue">');
  content = content.replace(/<a href="javascript:void\(0\)" class="qa-item">\s*<div class="qa-icon purple">/g, '<a href="/admin/proposals" class="qa-item">\n            <div class="qa-icon purple">');
  content = content.replace(/<a href="javascript:void\(0\)" class="qa-item">\s*<div class="qa-icon orange">/g, '<a href="/admin/opportunities" class="qa-item">\n            <div class="qa-icon orange">');

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}
