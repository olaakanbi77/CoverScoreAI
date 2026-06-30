const fs = require('fs');
const path = require('path');

const viewsDir = 'src/views';
const files = fs.readdirSync(viewsDir)
  .filter(f => f.startsWith('coverscore-personal-') && f.endsWith('.hbs'))
  .map(f => path.join(viewsDir, f));

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/<footer class="footer">[\s\S]*?<\/footer>/g, '');
  fs.writeFileSync(f, c);
  console.log('Removed footer from', f);
});
