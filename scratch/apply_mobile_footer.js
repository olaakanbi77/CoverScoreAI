const fs = require('fs');
let html = fs.readFileSync('src/views/landing.hbs', 'utf8');

// The new Mobile Funnel Footer HTML block
const mobileFooterHtml = `
  <style>
    /* Exact Mobile Funnel Footer Styles */
    .mobile-funnel-footer {
      background-color: #020817;
      color: #f8fafc;
      padding: 48px 20px 40px 20px;
      font-family: var(--font-sans), 'Inter', sans-serif;
    }
    @media (min-width: 1024px) {
      .mobile-funnel-footer { display: none !important; }
    }
    @media (max-width: 1023px) {
      /* Hide the generic footer on mobile to show our new awesome one */
      footer.footer { display: none !important; }
      /* The mobile sticky CTA shouldn't show over our huge glowing CTA when we are inside the footer */
      .mobile-sticky-cta { z-index: 99; }
      /* We will hide sticky CTA when intersecting with the footer using JS if possible, but for now let's ensure footer has padding-bottom if needed */
    }

    .mff-badges-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 20px 12px;
      display: grid;
      grid-template-columns: 1fr 1px 1fr 1px 1fr;
      align-items: stretch;
      gap: 12px;
      margin-bottom: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .mff-separator {
      width: 1px;
      background: rgba(255,255,255,0.1);
    }
    .mff-badge-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
    }
    .mff-icon-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10B981;
      margin-bottom: 4px;
    }
    .mff-badge-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
    }
    .mff-badge-desc {
      font-size: 0.75rem;
      color: #94a3b8;
      line-height: 1.3;
    }

    .mff-logo-section {
      text-align: center;
      margin-bottom: 40px;
      padding-top: 32px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .mff-logo-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .mff-logo-shield {
      width: 56px;
      height: 64px;
    }
    
    .mff-stats-card {
      display: grid;
      grid-template-columns: 1fr 1px 1fr 1px 1fr;
      align-items: stretch;
      gap: 12px;
      margin-bottom: 32px;
    }
    .mff-icon-circle-outline {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(16, 185, 129, 0.5);
      background: rgba(16, 185, 129, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #F5A623;
      margin-bottom: 8px;
    }
    .mff-icon-circle-outline.green {
      color: #10B981;
    }
    .mff-stat-value {
      font-size: 0.9rem;
      font-weight: 800;
      margin-bottom: 2px;
    }

    .mff-glowing-btn {
      background: linear-gradient(180deg, #15803d 0%, #166534 100%);
      border: 2px solid #4ade80;
      box-shadow: 0 0 24px rgba(74, 222, 128, 0.4), inset 0 2px 4px rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      text-decoration: none;
      transition: all 0.3s ease;
      margin-bottom: 20px;
    }
    .mff-glowing-btn:active {
      transform: scale(0.98);
      box-shadow: 0 0 12px rgba(74, 222, 128, 0.6);
    }
    
    .mff-footer-links {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mff-footer-links a {
      color: #f8fafc;
      font-size: 0.75rem;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .mff-copyright {
      margin-top: 24px;
      background: #040d21;
      margin: 24px -20px -40px -20px;
      padding: 32px 20px 48px 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
  </style>

  <section class="mobile-funnel-footer">
    
    <!-- 1. Top Badges -->
    <div class="mff-badges-card">
      <div class="mff-badge-col">
        <div class="mff-icon-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div class="mff-badge-title">100%<br>Confidential</div>
        <div class="mff-badge-desc">Your data is secure and never shared.</div>
      </div>
      <div class="mff-separator"></div>
      <div class="mff-badge-col">
        <div class="mff-icon-circle" style="color: #F5A623; background: rgba(245, 166, 35, 0.1);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        </div>
        <div class="mff-badge-title">Takes Less Than<br>5 Minutes</div>
        <div class="mff-badge-desc">Fast, simple and easy to complete.</div>
      </div>
      <div class="mff-separator"></div>
      <div class="mff-badge-col">
        <div class="mff-icon-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="mff-badge-title">No Obligation<br>Assessment</div>
        <div class="mff-badge-desc">Get insights with zero commitment.</div>
      </div>
    </div>

    <!-- 2. Logo Section -->
    <div class="mff-logo-section">
      <div class="mff-logo-wrap">
        <!-- Exact Replica of Logo in Mockup -->
        <svg class="mff-logo-shield" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 5 L90 20 L90 60 C90 90, 50 115, 50 115 C50 115, 10 90, 10 60 L10 20 Z" fill="none" stroke="white" stroke-width="4" stroke-linejoin="round"/>
          <path d="M50 10 L84 23 L84 59 C84 86, 50 108, 50 108 C50 108, 16 86, 16 59 L16 23 Z" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>
          <!-- Chart Bars -->
          <rect x="35" y="65" width="8" height="20" fill="#3B82F6"/>
          <rect x="47" y="55" width="8" height="30" fill="#F5A623"/>
          <rect x="59" y="45" width="8" height="40" fill="#10B981"/>
          <!-- Heartbeat / Graph Line -->
          <path d="M20 60 L35 60 L42 45 L52 75 L65 35 L80 35" stroke="#F5A623" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
          <div style="font-size:30px; font-weight:800; display:flex; align-items:center; line-height:1;">
            <span style="color:white;">Cover</span><span style="color:#F5A623;">Score</span><span style="color:#10B981; margin-left:6px; font-weight:900;">AI</span>
          </div>
          <div style="font-size:10px; font-weight:800; color:white; letter-spacing:1.5px; margin-top:6px; opacity:0.9;">
            SMART RISK. STRONGER DECISIONS.
          </div>
        </div>
      </div>
      <div style="width:100%; height:1px; background:rgba(255,255,255,0.08); margin: 20px 0;"></div>
      <p style="text-align:center; color:#e2e8f0; font-size:15px; line-height:1.6; max-width:280px; margin:0 auto; font-weight:400;">
        Helping hospitals identify, quantify and reduce operational, liability and financial risks.
      </p>
    </div>

    <!-- 3. Stats Section -->
    <div class="mff-stats-card">
      <div class="mff-badge-col">
        <div class="mff-icon-circle-outline green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path><path d="M12 7v6"></path><path d="M9 10h6"></path></svg>
        </div>
        <div class="mff-stat-value" style="color:#10B981;">500+</div>
        <div class="mff-badge-title" style="font-size:0.75rem; color:#94a3b8;">Facilities<br>Assessed</div>
      </div>
      <div class="mff-separator"></div>
      <div class="mff-badge-col">
        <div class="mff-icon-circle-outline" style="border-color: rgba(245, 166, 35, 0.5); background: rgba(245, 166, 35, 0.05);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <div class="mff-stat-value" style="color:#F5A623;">10,000+</div>
        <div class="mff-badge-title" style="font-size:0.75rem; color:#94a3b8;">Risks<br>Identified</div>
      </div>
      <div class="mff-separator"></div>
      <div class="mff-badge-col">
        <div class="mff-icon-circle-outline green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        <div class="mff-stat-value" style="color:#10B981;">$250M+</div>
        <div class="mff-badge-title" style="font-size:0.75rem; color:#94a3b8;">Potential Losses<br>Prevented</div>
      </div>
    </div>

    <!-- 4. Glowing WhatsApp Button -->
    <a href="/start-whatsapp?text={{trigger}}" class="mff-glowing-btn">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="white" style="position: absolute; left: 20px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
        <span style="font-size:13px; font-weight:700; color:white; letter-spacing:0.5px; opacity: 0.95;">GET MY HOSPITAL</span>
        <span style="font-size:22px; font-weight:800; color:white; line-height:1.1;">RISK SCORE™</span>
      </div>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; right: 20px;"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </a>

    <!-- Hand-drawn arrow & Free text -->
    <div style="display:flex; align-items:flex-start; justify-content:center; gap:8px;">
      <svg width="24" height="24" viewBox="0 0 50 50" style="margin-top:2px; transform: scaleY(-1);">
        <path d="M40 10 Q20 20 15 35" stroke="#10B981" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M10 28 L15 35 L22 30" stroke="#10B981" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div style="text-align:center; color:white; font-size:15px; font-weight:500;">
        It's <span style="color:#10B981; font-weight:800;">FREE</span>. It's <span style="color:#10B981; font-weight:800;">Fast</span>. It's <span style="color:#10B981; font-weight:800;">Smart</span>.<br>
        <span style="font-size:13.5px; color:#e2e8f0; font-weight:400; margin-top:6px; display:inline-block;">Take the first step toward a safer hospital.</span>
      </div>
    </div>

    <!-- 5. Footer Links -->
    <div class="mff-footer-links">
      <a href="/privacy"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Privacy Policy</a>
      <div style="width:1px; height:12px; background:rgba(255,255,255,0.2);"></div>
      <a href="/terms"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Terms of Use</a>
      <div style="width:1px; height:12px; background:rgba(255,255,255,0.2);"></div>
      <a href="/contact"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> Contact Us</a>
    </div>

    <!-- 6. Copyright Section -->
    <div class="mff-copyright">
      <div style="width:36px; height:36px; flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div style="font-size:0.7rem; color:#94a3b8; line-height:1.5;">
        <div style="color:#e2e8f0; font-weight:600; margin-bottom:4px; font-size:0.75rem;">&copy; <script>document.write(new Date().getFullYear())</script> CoverScore AI. All rights reserved.</div>
        Your information is secure and will only be used to provide your risk assessment.
      </div>
    </div>
  </section>
`;

// Find where to insert it. We should insert it exactly right BEFORE <!-- 12. FOOTER -->
const targetIndex = html.indexOf('<!-- 12. FOOTER -->');
if (targetIndex !== -1) {
  // Wait, does it already exist?
  if (!html.includes('class="mobile-funnel-footer"')) {
    html = html.substring(0, targetIndex) + '\n  <!-- NEW MOBILE FUNNEL FOOTER -->\n' + mobileFooterHtml + '\n  ' + html.substring(targetIndex);
    fs.writeFileSync('src/views/landing.hbs', html);
    console.log('Successfully injected the mobile footer.');
  } else {
    // If it already exists, replace it
    html = html.replace(/<!-- NEW MOBILE FUNNEL FOOTER -->[\s\S]*?(?=<!-- 12\. FOOTER -->)/, '<!-- NEW MOBILE FUNNEL FOOTER -->\n' + mobileFooterHtml + '\n  ');
    fs.writeFileSync('src/views/landing.hbs', html);
    console.log('Successfully updated the existing mobile footer.');
  }
} else {
  console.log('Error: Could not find <!-- 12. FOOTER -->');
}
