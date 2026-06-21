const fs = require('fs');

// 1. Update landing.hbs
let html = fs.readFileSync('src/views/landing.hbs', 'utf8');

// Replace arrow (Mobile Funnel Footer)
html = html.replace(
  /<svg width="24" height="24" viewBox="0 0 50 50" style="margin-top:2px; transform: scaleY\(-1\);">\s*<path d="M40 10 Q20 20 15 35" stroke="#10B981" stroke-width="2\.5" fill="none" stroke-linecap="round"\/>\s*<path d="M10 28 L15 35 L22 30" stroke="#10B981" stroke-width="2\.5" fill="none" stroke-linecap="round" stroke-linejoin="round"\/>\s*<\/svg>/,
  `<svg width="40" height="40" viewBox="0 0 50 50" style="margin-top:2px; transform: scaleY(-1);">
        <path d="M40 10 Q20 20 15 35" stroke="#10B981" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <path d="M10 28 L15 35 L22 30" stroke="#10B981" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
);

// Replace copyright (Mobile Funnel Footer)
html = html.replace(
  /<div style="color:#e2e8f0; font-weight:600; margin-bottom:4px; font-size:0\.75rem;">© 2024 CoverScore AI\. All rights reserved\.<\/div>/g,
  '<div style="color:#e2e8f0; font-weight:600; margin-bottom:4px; font-size:0.75rem;">&copy; <script>document.write(new Date().getFullYear())</script> CoverScore AI. All rights reserved.</div>'
);
// In case the symbol is corrupted:
html = html.replace(
  /<div style="color:#e2e8f0; font-weight:600; margin-bottom:4px; font-size:0\.75rem;">. 2024 CoverScore AI\. All rights reserved\.<\/div>/g,
  '<div style="color:#e2e8f0; font-weight:600; margin-bottom:4px; font-size:0.75rem;">&copy; <script>document.write(new Date().getFullYear())</script> CoverScore AI. All rights reserved.</div>'
);

// Replace copyright (Desktop Footer)
html = html.replace(
  /<div>&copy; \d{4} CoverScore\. All rights reserved\.<\/div>/g,
  '<div>&copy; <script>document.write(new Date().getFullYear())</script> CoverScore. All rights reserved.</div>'
);

fs.writeFileSync('src/views/landing.hbs', html);

// 2. Update scratch/apply_mobile_footer.js
let js = fs.readFileSync('scratch/apply_mobile_footer.js', 'utf8');

js = js.replace(
  /<svg width="24" height="24" viewBox="0 0 50 50" style="margin-top:2px; transform: scaleY\(-1\);">\\n\s*<path d="M40 10 Q20 20 15 35" stroke="#10B981" stroke-width="2\.5" fill="none" stroke-linecap="round"\/>\\n\s*<path d="M10 28 L15 35 L22 30" stroke="#10B981" stroke-width="2\.5" fill="none" stroke-linecap="round" stroke-linejoin="round"\/>\\n\s*<\/svg>/,
  `<svg width="40" height="40" viewBox="0 0 50 50" style="margin-top:2px; transform: scaleY(-1);">
        <path d="M40 10 Q20 20 15 35" stroke="#10B981" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <path d="M10 28 L15 35 L22 30" stroke="#10B981" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
);

js = js.replace(
  /<div style="color:#e2e8f0; font-weight:600; margin-bottom:4px; font-size:0\.75rem;">© 2024 CoverScore AI\. All rights reserved\.<\/div>/g,
  '<div style="color:#e2e8f0; font-weight:600; margin-bottom:4px; font-size:0.75rem;">&copy; <script>document.write(new Date().getFullYear())</script> CoverScore AI. All rights reserved.</div>'
);

fs.writeFileSync('scratch/apply_mobile_footer.js', js);

console.log('Successfully patched arrow and copyright year.');
