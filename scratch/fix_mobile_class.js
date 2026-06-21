const fs = require('fs');
let code = fs.readFileSync('src/views/landing.hbs', 'utf8');
code = code.replace(/<!-- 9\. FAQ SECTION -->\r?\n\s*<section class=\"funnel-section section-faq-exact\"/g, '<!-- 9. FAQ SECTION -->\r\n  <section class=\"funnel-section section-faq-exact mobile-only\"');
fs.writeFileSync('src/views/landing.hbs', code, 'utf8');
console.log('Done');
