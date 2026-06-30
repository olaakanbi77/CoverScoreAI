const fs = require('fs');

const replacement = `<div class="rrs-track" id="rrs-track">
          <!-- SLIDE 1 -->
          <div class="rrs-slide">
            <div class="rrs-top-grid">
              <div class="rrs-top-left">
                <div class="rrs-badge green">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  RETIREMENT CAME EARLIER THAN PLANNED
                </div>
                <div class="rrs-slide-title">Retirement Came Earlier Than Planned</div>
                <div class="rrs-location">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--green-color)">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Lagos, Nigeria
                </div>
                <div class="rrs-slide-desc">A senior manager retired early due to ill health. His savings looked enough—until he realized it would only last half as long as he thought.</div>
              </div>
              <div class="rrs-top-right">
                <img src="/images/risk-retirement-1.jpg" alt="Retirement Came Earlier Than Planned" class="rrs-image">
              </div>
            </div>
  
            <div class="rrs-box rrs-impact-box green">
              <div class="rrs-impact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <div class="rrs-impact-label">TOTAL RETIREMENT GAP</div>
                <div class="rrs-impact-amount">₦18,500,000</div>
                <div class="rrs-impact-desc">Eighteen million, five hundred thousand naira retirement shortfall.</div>
              </div>
            </div>
  
            <div class="rrs-box rrs-lesson-box">
              <div class="rrs-lesson-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <div>
                <div class="rrs-lesson-label">KEY LESSON</div>
                <div class="rrs-lesson-text">Retirement planning should start early, not right before you stop working.</div>
              </div>
            </div>
  
            <div class="rrs-box rrs-risk-box">
              <div class="rrs-risk-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <div>
                <div class="rrs-risk-title">Every future deserves preparation.</div>
                <div class="rrs-risk-desc">Know yours before it becomes your burden.</div>
              </div>
            </div>
  
            <div class="rrs-cta-box" onclick="startAssessment('rrs_slide1')">
              <div class="rrs-cta-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <div style="flex: 1;">
                <div class="rrs-cta-title">Know My Retirement Risk</div>
                <div class="rrs-cta-desc">Find your risks before they find you.</div>
              </div>
            </div>
  
            <div class="rrs-trust-row">
              <div class="rrs-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                100% Secure
              </div>
              <div class="rrs-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                Private & Confidential
              </div>
              <div class="rrs-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Takes Less Than 3 Minutes
              </div>
            </div>
          </div>
  
          <!-- SLIDE 2 -->
          <div class="rrs-slide">
            <div class="rrs-top-grid">
              <div class="rrs-top-left">
                <div class="rrs-badge orange">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  INFLATION REDUCED RETIREMENT SAVINGS
                </div>
                <div class="rrs-slide-title">Inflation Reduced Retirement Savings</div>
                <div class="rrs-location">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--green-color)">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Abuja, Nigeria
                </div>
                <div class="rrs-slide-desc">After 15 years of saving, inflation silently reduced the purchasing power of his retirement fund. His money couldn't buy what it once could.</div>
              </div>
              <div class="rrs-top-right">
                <img src="/images/risk-retirement-2.jpg" alt="Inflation Reduced Retirement Savings" class="rrs-image">
              </div>
            </div>
  
            <div class="rrs-box rrs-impact-box orange">
              <div class="rrs-impact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <div class="rrs-impact-label">TOTAL RETIREMENT GAP</div>
                <div class="rrs-impact-amount">₦12,300,000</div>
                <div class="rrs-impact-desc">Twelve million, three hundred thousand naira purchasing power gap.</div>
              </div>
            </div>
  
            <div class="rrs-box rrs-lesson-box">
              <div class="rrs-lesson-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <div>
                <div class="rrs-lesson-label">KEY LESSON</div>
                <div class="rrs-lesson-text">Plan for inflation today, or it will erode your tomorrow.</div>
              </div>
            </div>
  
            <div class="rrs-box rrs-risk-box">
              <div class="rrs-risk-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <div>
                <div class="rrs-risk-title">Every future deserves preparation.</div>
                <div class="rrs-risk-desc">Know yours before it becomes your burden.</div>
              </div>
            </div>
  
            <div class="rrs-cta-box" onclick="startAssessment('rrs_slide2')">
              <div class="rrs-cta-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <div style="flex: 1;">
                <div class="rrs-cta-title">Know My Retirement Risk</div>
                <div class="rrs-cta-desc">Find your risks before they find you.</div>
              </div>
            </div>
  
            <div class="rrs-trust-row">
              <div class="rrs-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                100% Secure
              </div>
              <div class="rrs-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                Private & Confidential
              </div>
              <div class="rrs-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Takes Less Than 3 Minutes
              </div>
            </div>
          </div>
  
          <!-- SLIDE 3 -->
          <div class="rrs-slide">
            <div class="rrs-top-grid">
              <div class="rrs-top-left">
                <div class="rrs-badge blue">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  SUPPORTING ADULT CHILDREN DELAYED RETIREMENT
                </div>
                <div class="rrs-slide-title">Supporting Adult Children Delayed Retirement</div>
                <div class="rrs-location">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--green-color)">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Port Harcourt, Nigeria
                </div>
                <div class="rrs-slide-desc">Years of supporting adult children and family needs meant she couldn't save enough for a comfortable retirement.</div>
              </div>
              <div class="rrs-top-right">
                <img src="/images/risk-retirement-3.jpg" alt="Supporting Adult Children Delayed Retirement" class="rrs-image">
              </div>
            </div>
  
            <div class="rrs-box rrs-impact-box blue">
              <div class="rrs-impact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <div class="rrs-impact-label">TOTAL RETIREMENT GAP</div>
                <div class="rrs-impact-amount">₦15,750,000</div>
                <div class="rrs-impact-desc">Fifteen million, seven hundred and fifty thousand naira retirement gap.</div>
              </div>
            </div>
  
            <div class="rrs-box rrs-lesson-box">
              <div class="rrs-lesson-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <div>
                <div class="rrs-lesson-label">KEY LESSON</div>
                <div class="rrs-lesson-text">Helping loved ones is important, but your future matters too.</div>
              </div>
            </div>
  
            <div class="rrs-box rrs-risk-box">
              <div class="rrs-risk-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <div>
                <div class="rrs-risk-title">Every future deserves preparation.</div>
                <div class="rrs-risk-desc">Know yours before it becomes your burden.</div>
              </div>
            </div>
  
            <div class="rrs-cta-box" onclick="startAssessment('rrs_slide3')">
              <div class="rrs-cta-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <div style="flex: 1;">
                <div class="rrs-cta-title">Know My Retirement Risk</div>
                <div class="rrs-cta-desc">Find your risks before they find you.</div>
              </div>
            </div>
  
            <div class="rrs-trust-row">
              <div class="rrs-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                100% Secure
              </div>
              <div class="rrs-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                Private & Confidential
              </div>
              <div class="rrs-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Takes Less Than 3 Minutes
              </div>
            </div>
          </div>
        </div>`;

const processFile = (file) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  const startSplit = content.split('<div class="rrs-track" id="rrs-track">');
  if (startSplit.length === 2) {
    const endSplit = startSplit[1].split(/<\/div>\s*<\/div>\s*<\/section>/);
    if (endSplit.length >= 2) {
      // Re-add the split string
      content = startSplit[0] + replacement + '\n      </div>\n    </section>' + endSplit.slice(1).join('</div>\n      </div>\n    </section>');
      fs.writeFileSync(file, content);
      console.log('Updated', file);
    } else {
        console.log('Could not find end of track in', file);
    }
  } else {
      console.log('Could not find start of track in', file);
      // fallback in case there is no id="rrs-track"
      const fallbackStartSplit = content.split('<div class="rrs-track">');
      if (fallbackStartSplit.length === 2) {
          const endSplit = fallbackStartSplit[1].split(/<\/div>\s*<\/div>\s*<\/section>/);
          if (endSplit.length >= 2) {
            content = fallbackStartSplit[0] + replacement + '\n      </div>\n    </section>' + endSplit.slice(1).join('</div>\n      </div>\n    </section>');
            fs.writeFileSync(file, content);
            console.log('Updated via fallback', file);
          }
      }
  }
};

processFile('src/views/coverscore-personal-retirement.hbs');
processFile('src/views/coverscore-personal-retirement-calculator.hbs');
