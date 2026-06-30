const fs = require('fs');
const path = require('path');

const viewsDir = 'src/views';
const files = fs.readdirSync(viewsDir)
  .filter(f => f.startsWith('coverscore-personal-') && f.endsWith('.hbs'))
  .map(f => path.join(viewsDir, f));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  const originalLength = content.length;
  
  // Replace the exact string. Note the replacement removes the <br> and increases font size.
  // Using a regex to handle possible weird character encodings around ™
  content = content.replace(
    /<span style="text-align: left; line-height: 1\.2; font-size: 0\.85rem;">Get My Score<br>& Report([^<]*)<\/span>/g,
    '<span style="text-align: left; line-height: 1.2; font-size: 0.95rem;">Get My Score & Report$1</span>'
  );
  
  if (content.length !== originalLength) {
    fs.writeFileSync(f, content);
    console.log('Fixed button text in', f);
  }
});
