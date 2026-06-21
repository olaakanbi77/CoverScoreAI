const fs = require('fs');

let content = fs.readFileSync('src/views/landing.hbs', 'utf8');

const target = '<!-- 9. FAQ SECTION -->\n  <section class="funnel-section section-faq-exact"';
const replacement = '<!-- 9. FAQ SECTION -->\n  <section class="funnel-section section-faq-exact mobile-only"';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/views/landing.hbs', content, 'utf8');
    console.log('Successfully added mobile-only to mobile FAQ section.');
} else {
    console.log('Target string not found.');
}
