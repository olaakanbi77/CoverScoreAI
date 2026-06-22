const fs = require('fs');

const files = [
  'src/views/advisor/dashboard.hbs',
  'src/views/advisor/leads.hbs',
  'src/views/admin/assessments.hbs',
  'src/views/admin/opportunities.hbs'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    // Replace href="..." for More tab
    content = content.replace(/<a\s+href="[^"]*"\s+class="nav-item(\s+active)?">(\s*<svg[^>]*>.*?<\/svg>\s*More\s*)<\/a>/s, 
      '<a href="/admin/more" class="nav-item$1">$2</a>');
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
  } else {
    console.log('Not found: ' + f);
  }
});
