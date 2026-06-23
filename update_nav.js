const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'src', 'views');

const NAV_BASE = `    <!-- BOTTOM NAV -->
    <div class="bottom-nav">
      <a href="/advisor/dashboard" class="nav-item{{homeActive}}">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        Home
      </a>
      <a href="/admin/leads" class="nav-item{{leadsActive}}">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        Leads
      </a>
      <a href="/admin/assessments" class="nav-item{{assessmentsActive}}">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
        Assessments
      </a>
      <a href="/admin/opportunities" class="nav-item{{opportunitiesActive}}">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
        Opportunities
      </a>
      <a href="/advisor/profile" class="nav-item{{moreActive}}">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
        More
      </a>
    </div>`;

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.hbs')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const regex = /<!-- BOTTOM NAV -->[\s\S]*?(?=<\/div>\s*<\/body>|<\/div>\s*<script>|<\/div>\s*<\/div>\s*<script>|<\/div>\s*<\/div>\s*<\/body>)/;
      
      const match = content.match(/<div class="bottom-nav">[\s\S]*?<\/div>/);
      
      if (match || content.includes('bottom-nav')) {
        let activeTab = 'more';
        if (file === 'dashboard.hbs') activeTab = 'home';
        else if (file === 'leads.hbs' || file === 'lead-details.hbs' || file === 'follow-up.hbs') activeTab = 'leads';
        else if (file === 'assessments.hbs' || file === 'assessment.hbs') activeTab = 'assessments';
        else if (file === 'opportunities.hbs' || file === 'proposals.hbs' || file === 'proposal-writer.hbs') activeTab = 'opportunities';
        
        let newNav = NAV_BASE
          .replace('{{homeActive}}', activeTab === 'home' ? ' active' : '')
          .replace('{{leadsActive}}', activeTab === 'leads' ? ' active' : '')
          .replace('{{assessmentsActive}}', activeTab === 'assessments' ? ' active' : '')
          .replace('{{opportunitiesActive}}', activeTab === 'opportunities' ? ' active' : '')
          .replace('{{moreActive}}', activeTab === 'more' ? ' active' : '');
        
        // Also fix the CSS if it contains the old position: absolute
        let newContent = content.replace(/<!-- BOTTOM NAV -->[\s\S]*?(?=<\/div>\s*<\/body>|<\/div>\s*<script>|<\/div>\s*<\/div>\s*<script>|<\/div>\s*<\/div>\s*<\/body>)/, newNav + '\n  ');
        
        // Just replacing the outer <div class="bottom-nav"> block
        newContent = content.replace(/<div class="bottom-nav">[\s\S]*?<\/div>\s*(?=<\/div>\s*<\/body>|<\/div>\s*<script>|<\/div>\s*<\/div>\s*<script>|<\/div>\s*<\/div>\s*<\/body>)/, newNav.replace('<!-- BOTTOM NAV -->\n', '') + '\n');
        
        // Let's do a more robust replacement
        let lines = content.split('\n');
        let inNav = false;
        let outLines = [];
        let replaced = false;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('<!-- BOTTOM NAV -->') || lines[i].includes('<div class="bottom-nav">') || lines[i].includes('<nav class="bottom-nav">')) {
            if (!replaced) {
              outLines.push(newNav);
              replaced = true;
            }
            inNav = true;
            
            // Try to find the closing div
            let divCount = lines[i].includes('<div') ? 1 : (lines[i].includes('<nav') ? 1 : 0);
            if (!lines[i].includes('<div') && !lines[i].includes('<nav')) {
               // it was just the comment
               i++;
               divCount = 1; // assuming next line is the div
            }
            
            while (divCount > 0 && i < lines.length) {
              i++;
              if (i >= lines.length) break;
              if (lines[i].includes('<div') || lines[i].includes('<nav')) divCount++;
              if (lines[i].includes('</div') || lines[i].includes('</nav')) divCount--;
            }
            continue;
          }
          if (!inNav) {
            outLines.push(lines[i]);
          } else {
             inNav = false;
          }
        }
        
        newContent = outLines.join('\n');
        
        // Fix CSS
        newContent = newContent.replace(/\.bottom-nav\s*\{[^}]*position:\s*absolute[^}]*\}/g, '.bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: white; display: flex; justify-content: space-around; align-items: center; padding: 12px 0 24px 0; border-top: 1px solid #e2e8f0; z-index: 100; }');
        newContent = newContent.replace(/\.b-nav-item\s*\{[^}]*\}/g, '.nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--text-sec); text-decoration: none; font-size: 10px; font-weight: 600; }');
        newContent = newContent.replace(/\.b-nav-item\.active\s*\{[^}]*\}/g, '.nav-item.active { color: var(--green); }');
        newContent = newContent.replace(/\.b-nav-item\s*span\s*\{[^}]*\}/g, '.nav-item svg { width: 24px; height: 24px; stroke-width: 2; }');

        // Also fix CSS in academy, calendar, copilot, leaderboard, pipeline, profile, risk-report, tasks 
        // to make sure color: var(--text-sec) is used instead of var(--c-gray) for active nav items if they are missing
        newContent = newContent.replace(/\.nav-item\s*\{[^}]*color:\s*var\(--c-gray\)[^}]*\}/g, '.nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--text-sec); text-decoration: none; font-size: 10px; font-weight: 600; }');
        
        // Ensure var(--text-sec) is defined if they only had --c-gray
        if (newContent.includes('var(--text-sec)') && !newContent.includes('--text-sec:')) {
            newContent = newContent.replace('--c-gray: #64748b;', '--c-gray: #64748b;\n    --text-sec: #64748b;');
        }
        if (newContent.includes('var(--green)') && !newContent.includes('--green:')) {
            newContent = newContent.replace('--c-green-dark: #047857;', '--green: #108A43;\n    --c-green-dark: #047857;');
        }

        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Updated', file);
      }
    }
  }
}

processDir(viewsDir);
