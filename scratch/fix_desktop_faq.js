const fs = require('fs');

let content = fs.readFileSync('src/views/landing.hbs', 'utf8');

const startTag = '<!-- 7. FAQ SECTION -->';
const endTag = '<!-- 11. CTA BANNER -->';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const newSection = `<!-- 7. FAQ SECTION -->
  <section class="funnel-section funnel-section-light faq-section hide-on-mobile">
    <div class="funnel-container">
      <h2 class="section-title text-center" style="margin-bottom: 32px; font-size: 1.5rem;">Frequently Asked Questions</h2>
      <div class="faq-list">
        {{#each data.faq}}
        <div class="faq-item" onclick="this.classList.toggle('open')">
          <button class="faq-question" type="button">{{this.q}}</button>
          <div class="faq-answer">
            <div class="faq-answer-inner">{{this.a}}</div>
          </div>
        </div>
        {{/each}}
      </div>
    </div>
  </section>

  `;
    
    content = content.substring(0, startIndex) + newSection + content.substring(endIndex);
    fs.writeFileSync('src/views/landing.hbs', content, 'utf8');
    console.log('Successfully reverted Desktop FAQ block.');
} else {
    console.log('Could not find start or end tags.');
}
