const fs = require('fs');

let hbs = fs.readFileSync('src/views/landing.hbs', 'utf8');

// 1. Calculator (font-size: 0.65rem -> 0.9rem, svgs 12x12 -> 24x24)
hbs = hbs.replace(/font-size: 0\.65rem; color: #475569; font-weight: 600;/g, 'font-size: 0.9rem; color: #475569; font-weight: 800;');
hbs = hbs.replace(/<svg width="12" height="12"/g, '<svg width="24" height="24"');

// 2. Real Risk Stories / How It Works (font-size: 0.75rem -> 0.9rem, svgs are already 24x24)
hbs = hbs.replace(/font-size: 0\.75rem; font-weight: 700; color: #1e293b; line-height: 1\.3;/g, 'font-size: 0.9rem; font-weight: 800; color: #1e293b; line-height: 1.3;');
hbs = hbs.replace(/font-size: 0\.75rem; font-weight: 700; color: #0f172a; line-height: 1\.3;/g, 'font-size: 0.9rem; font-weight: 800; color: #0f172a; line-height: 1.3;');

// 3. Sample Risk Score (font-size: 0.7rem -> 0.9rem, svgs 20x20 -> 24x24)
hbs = hbs.replace(/font-size: 0\.7rem; font-weight: 700; color: #1e293b; line-height: 1\.3; text-align: left;/g, 'font-size: 0.9rem; font-weight: 800; color: #1e293b; line-height: 1.3; text-align: left;');
hbs = hbs.replace(/<svg width="20" height="20"/g, '<svg width="24" height="24"'); // This also catches some action banner svgs, which is fine to unify.

// 4. Hero icons just to be sure (usually 18x18, hero-trust-icon-item)
// Wait, I will edit landing.css for hero-trust-icon-item
fs.writeFileSync('src/views/landing.hbs', hbs);

let cssPath = 'src/public/css/landing.css';
if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, 'utf8');
  css = css.replace(/\.hero-trust-icon-item\s*{[^}]*font-size:\s*0\.8rem;[^}]*}/, (match) => {
    return match.replace(/font-size:\s*0\.8rem;/, 'font-size: 0.9rem;').replace(/font-weight:\s*600;/, 'font-weight: 800;');
  });
  // Also replace SVGs in hero section to 24x24
  hbs = hbs.replace(/<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b"/g, '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b"');
  fs.writeFileSync('src/views/landing.hbs', hbs);
  fs.writeFileSync(cssPath, css);
}

console.log("Unified inline trust icons!");
