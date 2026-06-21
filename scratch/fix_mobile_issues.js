const fs = require('fs');

const dataFile = 'src/data/industry_content.json';
const landingFile = 'src/views/landing.hbs';

// 1. Update industry_content.json with howItWorks
let data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const hospitalHowItWorks = data.hospital.howItWorks;

if (hospitalHowItWorks) {
  ['school', 'sme', 'manufacturing', 'church'].forEach(key => {
    if (data[key] && !data[key].howItWorks) {
      data[key].howItWorks = hospitalHowItWorks;
    }
  });
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  console.log('Added howItWorks to other industries.');
} else {
  console.log('Error: Could not find hospital.howItWorks');
}

// 2. Fix landing.hbs
let landing = fs.readFileSync(landingFile, 'utf8');

// Fix: "What This Means" box
landing = landing.replace(
  /<div style="background: #eff6ff; border-radius: 16px; padding: 24px; display: flex; gap: 16px; align-items: flex-start; margin-bottom: 24px;">\s*<div style="color: #3b82f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding-top: 4px;">/g,
  `<div style="background: #eff6ff; border-radius: 16px; padding: 24px; display: flex; gap: 16px; align-items: center; margin-bottom: 24px;">\n        <div style="color: #3b82f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">`
);

landing = landing.replace(
  /<h4 style="font-size: 1\.15rem; font-weight: 800; color: #1e3a8a; margin: 0 0 6px 0;">What This Means<\/h4>\s*<p style="font-size: 0\.95rem; color: #3b82f6; margin: 0; line-height: 1\.5; font-weight: 500;">/g,
  `<h4 style="font-size: 1rem; font-weight: 800; color: #1e3a8a; margin: 0 0 6px 0;">What This Means</h4>\n          <p style="font-size: 0.85rem; color: #3b82f6; margin: 0; line-height: 1.5; font-weight: 500;">`
);


// Fix: "WHY COVERSCORE" inline trust badges
// Add it after the </div> of why-choose-list
const whyChooseEndIndex = landing.indexOf('</div>', landing.indexOf('<div class="why-choose-list">'));

const ssTrustBadgesHTML = `
      <!-- Trust Badges -->
      <div class="ss-trust-badges" style="margin-top: 24px;">
        <div class="ss-trust-badge-item">
          <div style="color: #16a34a; flex-shrink: 0;"><svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg></div>
          <div class="tb-text">Trusted by 500+<br>{{data.facilityType}}</div>
        </div>
        <div class="ss-trust-badge-item">
          <div style="color: #16a34a; flex-shrink: 0;"><svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
          <div class="tb-text">100% Secure<br>& Confidential</div>
        </div>
        <div class="ss-trust-badge-item" style="border-right: none; padding-right: 0;">
          <div style="color: #16a34a; flex-shrink: 0;"><svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
          <div class="tb-text">Takes Less Than<br>5 Minutes</div>
        </div>
      </div>
`;

if (!landing.includes('<!-- Trust Badges -->\n      <div class="ss-trust-badges" style="margin-top: 24px;">') && !landing.includes('<div class="wc-title-divider"></div>')) {
   // The condition above isn't reliable, let's use a regex replacement after why-choose-list
}
// Actually, let's insert it after {{/each}} </div> of why-choose-list
landing = landing.replace(
  /(\{\{\/each\}\}\s*<\/div>)\s*<\/div>\s*<\/section>\s*<!-- 6\. REAL RISK STORIES -->/g,
  `$1${ssTrustBadgesHTML}\n    </div>\n  </section>\n\n  <!-- 6. REAL RISK STORIES -->`
);

// Fix: SAMPLE RISK SCORE Trust Badges
// Replace existing .ss-trust-badges block
const sampleTrustRegex = /<div class="ss-trust-badges">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<!-- 9\. FAQ SECTION -->/;
landing = landing.replace(sampleTrustRegex, `${ssTrustBadgesHTML}\n    </div>\n  </section>\n\n  <!-- 9. FAQ SECTION -->`);

// Fix inline CSS for .ss-trust-badges
const cssBlockRegex = /\.ss-trust-badges \{ display: flex; flex-wrap: nowrap; justify-content: center; align-items: center; gap: 16px; padding-top: 8px; \}[\s\S]*?<\/style>/;
const newCssBlock = `
      .ss-trust-badges { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 20px; padding-top: 8px; }
      .ss-trust-badge-item { display: flex; align-items: center; gap: 6px; border-right: 1px solid #e2e8f0; padding-right: 20px; }
      .ss-trust-badges svg { width: 16px; height: 16px; flex-shrink: 0; }
      .ss-trust-badges .tb-text { font-size: 13px !important; font-weight: 500 !important; color: #1e293b; line-height: 1.3; text-align: left; }
      @media (max-width: 768px) {
        .ss-grid { grid-template-columns: 1fr; }
        .ss-trust-badges { flex-direction: column; align-items: center; gap: 20px; border: none; padding: 0; }
        .ss-trust-badge-item { border-right: none !important; padding-right: 0 !important; gap: 6px !important; justify-content: center; }
        .tb-text br { display: block; }
      }
    </style>`;
landing = landing.replace(cssBlockRegex, newCssBlock.trim());


fs.writeFileSync(landingFile, landing);
console.log('landing.hbs updated.');

// 3. Fix landing.css .wc-check-pill white-space
const cssFile = 'src/public/css/landing.css';
let css = fs.readFileSync(cssFile, 'utf8');
css = css.replace(
  /\.wc-check-pill \{[\s\S]*?align-self: flex-start;\n\}/g,
  `.wc-check-pill {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 0.7rem;\n  font-weight: 700;\n  padding: 4px 10px;\n  border-radius: 20px;\n  align-self: flex-start;\n  white-space: nowrap;\n}`
);

// Actually just replace align-self: flex-start; with align-self: flex-start; white-space: nowrap; just to be safe
if (!css.includes('white-space: nowrap;')) {
  // It's safer to just do a direct string replace if exact matches are hard
}

fs.writeFileSync(cssFile, css);
console.log('landing.css updated.');
