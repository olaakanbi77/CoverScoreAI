const fs = require('fs');
const path = require('path');

// 1. Fix CSS for trust badges
const cssPath = path.join('src/public/css/coverscore-calculator.css');
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('flex-wrap: wrap;')) {
  css = css.replace(/\.trust-badges-row \{([\s\S]*?)\}/, (match, p1) => {
    return `.trust-badges-row {${p1}  flex-wrap: wrap;\n}`;
  });
  fs.writeFileSync(cssPath, css);
  console.log('Fixed CSS trust-badges-row');
}

// 2. Fix the font size in the CTA buttons across all templates
const viewsDir = 'src/views';
const files = fs.readdirSync(viewsDir)
  .filter(f => f.startsWith('coverscore-personal-') && f.endsWith('.hbs'))
  .map(f => path.join(viewsDir, f));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // Add font-size to the CTA text span to make it fit comfortably
  content = content.replace(
    /<span style="text-align: left; line-height: 1\.2;">(See My Full<br>Score & Report™)<\/span>/g,
    '<span style="text-align: left; line-height: 1.2; font-size: 0.85rem;">$1</span>'
  );
  
  fs.writeFileSync(f, content);
  console.log('Fixed CTA font size for', f);
});
