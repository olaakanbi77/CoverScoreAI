const fs = require('fs');
let content = fs.readFileSync('src/views/landing.hbs', 'utf8');

// 1. Replace the chevron div with a button
content = content.replace(/<div class="exact-faq-chevron" onclick="this\.closest\('\.exact-faq-item'\)\.classList\.toggle\('open'\)" style="cursor: pointer; padding: 12px; margin: -12px; border-radius: 50%;">/g, '<button class="exact-faq-chevron" type="button" aria-label="Toggle Answer">');
content = content.replace(/<button class="exact-faq-chevron" type="button" aria-label="Toggle Answer">\s*<svg([\s\S]*?)<\/svg>\s*<\/div>/g, '<button class="exact-faq-chevron" type="button" aria-label="Toggle Answer">\n              <svg$1</svg>\n            </button>');

// 2. Add the style block before the first section
if (!content.includes('/* Injected exact FAQ CSS to bypass cache */')) {
  content = content.replace(/(<section class="funnel-section section-faq-exact".*?>)/, `<style>
    /* Injected exact FAQ CSS to bypass cache */
    .section-faq-exact { background: white; }
    .exact-faq-list { display: flex; flex-direction: column; gap: 16px; }
    .exact-faq-item { background: white; border: 1px solid #f1f5f9; border-radius: 12px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04); padding: 20px; transition: all 0.3s ease; }
    .exact-faq-item.open { background: #f8fafc; border-color: #10B981; }
    .exact-faq-header { display: flex; align-items: flex-start; gap: 16px; }
    .exact-faq-icon-wrapper { width: 44px; height: 44px; border-radius: 50%; background: #f0fdf4; border: 1px solid #10B981; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #10B981; }
    .exact-faq-item.open .exact-faq-icon-wrapper { background: white; }
    .exact-faq-title-area { flex: 1; padding-top: 2px; }
    .exact-faq-title { font-size: 1.1rem; font-weight: 800; color: #071739; margin: 0 0 4px 0; line-height: 1.3; transition: color 0.3s ease; }
    .exact-faq-item.open .exact-faq-title { color: #10B981; }
    .exact-faq-answer { max-height: 0; overflow: hidden; opacity: 0; transition: max-height 0.4s ease, opacity 0.4s ease; display: block; }
    .exact-faq-item.open .exact-faq-answer { max-height: 400px; opacity: 1; margin-top: 8px; }
    .exact-faq-answer p { margin: 0; font-size: 0.95rem; color: #64748b; line-height: 1.5; }
    .exact-faq-chevron { padding-top: 4px; color: #0f172a; transition: transform 0.3s ease; background: transparent; border: none; cursor: pointer; padding: 12px; margin: -12px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .exact-faq-item.open .exact-faq-chevron { transform: rotate(180deg); color: #10B981; }
  </style>\n  $1`);
}

// 3. Append the script block at the end of the file
if (!content.includes('chevrons.forEach')) {
  content += `\n<script>
  document.addEventListener('DOMContentLoaded', function() {
    var chevrons = document.querySelectorAll('.exact-faq-chevron');
    chevrons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var item = this.closest('.exact-faq-item');
        if (item) {
          item.classList.toggle('open');
        }
      });
    });
  });
</script>\n`;
}

fs.writeFileSync('src/views/landing.hbs', content);
