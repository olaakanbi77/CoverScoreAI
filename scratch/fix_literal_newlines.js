const fs = require('fs');
const path = require('path');

const viewsDir = 'src/views';
const files = fs.readdirSync(viewsDir)
  .filter(f => f.startsWith('coverscore-personal-') && f.endsWith('.hbs'))
  .map(f => path.join(viewsDir, f));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // Replace literal "\n        " with nothing
  content = content.replace(/\\n\s+/g, '');
  
  fs.writeFileSync(f, content);
  console.log('Fixed literal newlines for', f);
});
