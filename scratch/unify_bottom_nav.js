const fs = require('fs');

const files = [
  { path: 'src/views/advisor/lead-details.hbs', active: 'leads' },
  { path: 'src/views/advisor/dashboard.hbs', active: 'dashboard' },
  { path: 'src/views/advisor/assessment.hbs', active: 'assessments' },
  { path: 'src/views/advisor/leads.hbs', active: 'leads' },
  { path: 'src/views/advisor/proposal-writer.hbs', active: 'more' },
  { path: 'src/views/admin/assessments.hbs', active: 'assessments' },
  { path: 'src/views/admin/more.hbs', active: 'more' },
  { path: 'src/views/admin/opportunities.hbs', active: 'opportunities' },
  { path: 'src/views/admin/proposals.hbs', active: 'more' }
];

const getNavHTML = (activePage) => `
<div class="bottom-nav">
  <a href="/advisor/dashboard" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    Home
  </a>
  <a href="/admin/leads" class="nav-item ${activePage === 'leads' ? 'active' : ''}">
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
    Leads
  </a>
  <a href="/admin/assessments" class="nav-item ${activePage === 'assessments' ? 'active' : ''}">
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
    Assessments
  </a>
  <a href="/admin/opportunities" class="nav-item ${activePage === 'opportunities' ? 'active' : ''}">
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
    Opportunities
  </a>
  <a href="/admin/more" class="nav-item ${activePage === 'more' ? 'active' : ''}">
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
    More
  </a>
</div>
`;

files.forEach(f => {
  if (fs.existsSync(f.path)) {
    let content = fs.readFileSync(f.path, 'utf8');
    const regex = /<(div|nav)\s+class="bottom-nav">.*?<\/\1>/s;
    if (regex.test(content)) {
      content = content.replace(regex, getNavHTML(f.active).trim());
      fs.writeFileSync(f.path, content);
      console.log('Updated ' + f.path);
    } else {
      console.log('No bottom-nav found in ' + f.path);
    }
  } else {
    console.log('File not found: ' + f.path);
  }
});
