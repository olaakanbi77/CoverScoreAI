const fs = require('fs');
const path = require('path');

// 1. Update CSS
const cssPath = path.join('src/public/css/coverscore-calculator.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Add flex-shrink: 0 to WhatsApp SVGs
if (!css.includes('.btn-whatsapp svg {')) {
  css += `\n\n.btn-whatsapp svg {\n  flex-shrink: 0;\n}\n`;
}

// Update trust badge CSS to prevent squishing and fix divider
css = css.replace(/\.trust-badge \{([\s\S]*?)\}/, (match, p1) => {
  if (p1.includes('white-space: nowrap;')) return match;
  return `.trust-badge {${p1}  white-space: nowrap;\n}`;
});

css = css.replace(/\.trust-badge svg \{([\s\S]*?)\}/, (match, p1) => {
  if (p1.includes('flex-shrink: 0;')) return match;
  return `.trust-badge svg {${p1}  flex-shrink: 0;\n}`;
});

css = css.replace(/\.trust-divider \{([\s\S]*?)\}/, () => {
  return `.trust-divider {
  width: auto;
  height: auto;
  background-color: transparent;
  color: var(--border-color);
}
.trust-divider::before {
  content: "•";
}`;
});

fs.writeFileSync(cssPath, css);
console.log('Fixed CSS');

// 2. Update all HTML files
const viewsDir = 'src/views';
const files = fs.readdirSync(viewsDir)
  .filter(f => f.startsWith('coverscore-personal-') && f.endsWith('.hbs'))
  .map(f => path.join(viewsDir, f));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // Replace the old span with a shorter one
  content = content.replace(
    /<span style="text-align: left; line-height: 1\.2; font-size: 0\.85rem;">See My Full<br>Score & Report™<\/span>/g,
    '<span style="text-align: left; line-height: 1.2; font-size: 0.85rem;">Get My Score<br>& Report™</span>'
  );
  // Also handle if the script missed replacing the old font-size in the last run for any reason
  content = content.replace(
    /<span style="text-align: left; line-height: 1\.2;">See My Full<br>Score & Report™<\/span>/g,
    '<span style="text-align: left; line-height: 1.2; font-size: 0.85rem;">Get My Score<br>& Report™</span>'
  );
  
  fs.writeFileSync(f, content);
});
console.log('Fixed HTML');
