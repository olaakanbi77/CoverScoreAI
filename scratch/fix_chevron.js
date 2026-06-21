const fs = require('fs');
let content = fs.readFileSync('src/views/landing.hbs', 'utf8');

// Replace any div or button chevron with a clean button
content = content.replace(/<div class="exact-faq-chevron"[\s\S]*?<svg/g, '<button class="exact-faq-chevron" type="button" aria-label="Toggle Answer"><svg');
content = content.replace(/<\/svg>\s*<\/div>/g, '</svg></button>');
content = content.replace(/<button class="exact-faq-chevron"[\s\S]*?<svg/g, '<button class="exact-faq-chevron" type="button" aria-label="Toggle Answer"><svg');
content = content.replace(/<\/svg>\s*<\/button>/g, '</svg></button>');

// Remove inline styles in the button just in case
content = content.replace(/style="cursor: pointer; padding: 12px; margin: -12px; border-radius: 50%;"/g, '');

// Ensure script exists
if (!content.includes('chevrons.forEach')) {
  content = content.replace(/<\/body>/, `<script>
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
</script>\n</body>`);
}

fs.writeFileSync('src/views/landing.hbs', content);
