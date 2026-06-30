const fs = require('fs');
const path = require('path');

const viewsDir = 'src/views';
const files = fs.readdirSync(viewsDir)
  .filter(f => f.startsWith('coverscore-personal-') && f.endsWith('.hbs'))
  .map(f => path.join(viewsDir, f));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // This regex matches exactly whitespace followed by 1 to 3 digits, a colon, and whitespace
  // but only inside the CTA section where we accidentally pasted it.
  // Example: '  251:           </svg>'
  
  // A safe way is to just do a global replace for lines matching \n\s*\d+:\s+
  const originalLength = content.length;
  content = content.replace(/\n\s*\d+:\s+/g, '\n          ');
  content = content.replace(/\n\s*\d+:\s*</g, '\n          <');
  content = content.replace(/\n\s*\d+:\s*$/gm, '');
  
  if (content.length !== originalLength) {
    fs.writeFileSync(f, content);
    console.log('Stripped line numbers from', f);
  }
});
