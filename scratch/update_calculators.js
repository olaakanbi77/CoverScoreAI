const fs = require('fs');
const path = require('path');

const configs = {
  'family': {
    badge: 'EXPOSURE CALCULATOR',
    title: `Let's estimate your <span class="text-green">family's financial exposure</span>`,
    subtitle: `If your <strong>income stopped tomorrow</strong>, how much would your family need to stay financially secure?`,
    inputLabel: `Your estimated monthly<br>household expenses`,
    inputHelp: `Include living expenses like food, rent, transport, school fees, utilities, loans, etc.`,
    inputPlaceholder: `e.g. 500,000`,
    selectorLabel: `How many months would your<br>family need support?`,
    selectorHelp: `Choose how long your family would need coverage to transition or replace income.`,
    options: [
      { text: '3 months', val: 3 },
      { text: '6 months', val: 6, active: true },
      { text: '12 months', val: 12 }
    ],
    resultTitle: `Family Financial Exposure`,
    calcCode: `
      const exposure = inputVal * selectorVal;
      resultEl.textContent = '₦' + formatNumber(exposure);
      subheadEl.innerHTML = 'This is the estimated amount your household may need to maintain essential expenses for <strong>' + selectorVal + ' months</strong>.';
    `
  },
  'retirement': {
    badge: 'RETIREMENT CALCULATOR',
    title: `Let's estimate your <span class="text-green">retirement income gap</span>`,
    subtitle: `How much will you need to live comfortably in your golden years?`,
    inputLabel: `Desired Monthly<br>Retirement Income`,
    inputHelp: `The amount you want to have available each month after you retire.`,
    inputPlaceholder: `e.g. 1,000,000`,
    selectorLabel: `At what age do you<br>plan to retire?`,
    selectorHelp: `Select your target retirement age.`,
    options: [
      { text: '55', val: 55 },
      { text: '60', val: 60, active: true },
      { text: '65', val: 65 }
    ],
    resultTitle: `Retirement Income Gap`,
    calcCode: `
      const yearsInRetirement = 85 - selectorVal;
      const exposure = inputVal * 12 * yearsInRetirement;
      resultEl.textContent = '₦' + formatNumber(exposure);
      subheadEl.innerHTML = 'Assuming a life expectancy to 85, this is the total estimated amount you\\'d need for <strong>' + yearsInRetirement + ' years</strong> in retirement.';
    `
  },
  'health': {
    badge: 'HEALTH CALCULATOR',
    title: `Let's estimate your <span class="text-green">health exposure</span>`,
    subtitle: `How much financial risk are you exposed to for healthcare costs?`,
    inputLabel: `Estimated Monthly<br>Healthcare Budget`,
    inputHelp: `What you typically spend or would need for healthcare out-of-pocket per month.`,
    inputPlaceholder: `e.g. 100,000`,
    selectorLabel: `Who are you<br>calculating for?`,
    selectorHelp: `Select the coverage profile that fits your situation.`,
    options: [
      { text: 'Individual', val: 1, active: true },
      { text: 'Couple', val: 2 },
      { text: 'Family', val: 4 }
    ],
    resultTitle: `Annual Healthcare Exposure`,
    calcCode: `
      const exposure = inputVal * 12 * selectorVal;
      resultEl.textContent = '₦' + formatNumber(exposure);
      subheadEl.innerHTML = 'This is the estimated annual healthcare exposure for your selected profile.';
    `
  },
  'income': {
    badge: 'INCOME CALCULATOR',
    title: `Let's estimate your <span class="text-green">income exposure</span>`,
    subtitle: `If your <strong>income stopped tomorrow</strong>, how much do you stand to lose?`,
    inputLabel: `Monthly Personal Income`,
    inputHelp: `Your total monthly earnings.`,
    inputPlaceholder: `e.g. 800,000`,
    selectorLabel: `Protection Period`,
    selectorHelp: `How many months of income you want to secure.`,
    options: [
      { text: '3 months', val: 3 },
      { text: '6 months', val: 6, active: true },
      { text: '12 months', val: 12 }
    ],
    resultTitle: `Estimated Income Exposure`,
    calcCode: `
      const exposure = inputVal * selectorVal;
      resultEl.textContent = '₦' + formatNumber(exposure);
      subheadEl.innerHTML = 'This is the estimated total income you would lose over a <strong>' + selectorVal + '-month</strong> period.';
    `
  },
  'young-professional': {
    badge: 'RISK CALCULATOR',
    title: `Let's estimate your <span class="text-green">future risk index</span>`,
    subtitle: `How could a disruption affect your biggest financial goals?`,
    inputLabel: `Monthly Income`,
    inputHelp: `Your total monthly earnings.`,
    inputPlaceholder: `e.g. 400,000`,
    selectorLabel: `What is your<br>biggest goal?`,
    selectorHelp: `Select your primary financial target.`,
    options: [
      { text: 'Home', val: 24, active: true },
      { text: 'Car', val: 6 },
      { text: 'Business', val: 12 },
      { text: 'Education', val: 12 },
      { text: 'Travel', val: 3 }
    ],
    resultTitle: `Future Risk Index`,
    calcCode: `
      const exposure = inputVal * selectorVal;
      resultEl.textContent = '₦' + formatNumber(exposure);
      subheadEl.innerHTML = 'This represents the estimated financial risk index toward your primary goal.';
    `
  },
  'entrepreneur': {
    badge: 'RISK CALCULATOR',
    title: `Let's estimate your <span class="text-green">business continuity exposure</span>`,
    subtitle: `If operations paused, how much would you need to keep the business alive?`,
    inputLabel: `Monthly Business<br>Operating Expenses`,
    inputHelp: `Include payroll, rent, utilities, software, inventory, etc.`,
    inputPlaceholder: `e.g. 2,000,000`,
    selectorLabel: `How many months of<br>runway do you need?`,
    selectorHelp: `Choose the buffer period you need to survive.`,
    options: [
      { text: '3 months', val: 3 },
      { text: '6 months', val: 6, active: true },
      { text: '12 months', val: 12 }
    ],
    resultTitle: `Business Continuity Exposure`,
    calcCode: `
      const exposure = inputVal * selectorVal;
      resultEl.textContent = '₦' + formatNumber(exposure);
      subheadEl.innerHTML = 'This is the estimated amount your business may need to survive for <strong>' + selectorVal + ' months</strong>.';
    `
  }
};

const getHTML = (config, funnelId) => {
  const optionsHtml = config.options.map(opt => 
    '<button class="segment-btn ' + (opt.active ? 'active' : '') + '" data-val="' + opt.val + '">' + opt.text + '</button>'
  ).join('\\n        ');

  return `<!-- 02b. Exposure Calculator Section -->
  <section class="section calculator" style="background-color: var(--bg-color); padding: 1.5rem 1.5rem;" id="calculator">
    <div class="step-badge">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
        <rect x="9" y="9" width="6" height="6"/>
        <line x1="9" y1="1" x2="9" y2="4"/>
        <line x1="15" y1="1" x2="15" y2="4"/>
        <line x1="9" y1="20" x2="9" y2="23"/>
        <line x1="15" y1="20" x2="15" y2="23"/>
        <line x1="20" y1="9" x2="23" y2="9"/>
        <line x1="20" y1="14" x2="23" y2="14"/>
        <line x1="1" y1="9" x2="4" y2="9"/>
        <line x1="1" y1="14" x2="4" y2="14"/>
      </svg>
      ${config.badge}
    </div>
    
    <h2>${config.title}</h2>
    <p class="subtitle" style="margin-bottom: 2rem;">${config.subtitle}</p>
    
    <!-- Input Card -->
    <div class="calc-card">
      <div class="card-header">
        <div class="icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div class="card-title-wrap">
          <label for="primaryInput">${config.inputLabel}</label>
          <div class="info-icon" title="${config.inputHelp}">i</div>
        </div>
      </div>
      
      <div class="input-wrapper">
        <span class="currency-prefix">₦</span>
        <input type="text" id="primaryInput" inputmode="numeric" placeholder="${config.inputPlaceholder}" autocomplete="off">
      </div>
      
      <p class="help-text">${config.inputHelp}</p>
    </div>
    
    <!-- Selector Card -->
    <div class="calc-card">
      <div class="card-header">
        <div class="icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <rect x="8" y="14" width="3" height="3" fill="currentColor"/>
          </svg>
        </div>
        <div class="card-title-wrap">
          <label>${config.selectorLabel}</label>
          <div class="info-icon" title="${config.selectorHelp}">i</div>
        </div>
      </div>
      
      <div class="segmented-control" id="selectorControl" ${config.options.length > 3 ? 'style="flex-wrap: wrap;"' : ''}>
        ${optionsHtml}
      </div>
    </div>
    
    <!-- Result Card -->
    <div class="result-card">
      <div class="result-header">
        <div class="result-icon-wrapper">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>
        <div class="result-title">${config.resultTitle}</div>
      </div>
      
      <div class="huge-number" id="exposureResult">₦0</div>
      
      <p class="result-subhead" id="exposureSubhead">
        Enter your details above to see your estimated exposure.
      </p>
      
      <div class="disclaimer-wrap">
        <svg class="disclaimer-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
        <div class="disclaimer-text">
          This is an estimate based on the figures you entered and is for awareness and planning purposes only.
        </div>
      </div>
    </div>
    
    <!-- CTA Section -->
    <div class="cta-section">
      <button class="btn-whatsapp" id="btnContinue" disabled>
        <div class="btn-whatsapp-content">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
251:           </svg>
252:           <span style="text-align: left; line-height: 1.2;">See My Full<br>Score & Report™</span>
253:         </div>
254:         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
255:           <line x1="5" y1="12" x2="19" y2="12"></line>
256:           <polyline points="12 5 19 12 12 19"></polyline>
257:         </svg>
258:       </button>
259:       
260:       <div class="trust-badges-row">
261:         <div class="trust-badge">
262:           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
263:             <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
264:             <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
265:           </svg>
266:           Private & secure
267:         </div>
268:         <div class="trust-divider"></div>
269:         <div class="trust-badge">
270:           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
271:             <circle cx="12" cy="12" r="10"/>
272:             <polyline points="12 6 12 12 16 14"/>
273:           </svg>
274:           Takes under 30 seconds
275:         </div>
276:         <div class="trust-divider"></div>
277:         <div class="trust-badge">
278:           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
279:             <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
280:             <polyline points="9 12 11 14 15 10"/>
281:           </svg>
282:           No obligation
283:         </div>
284:       </div>
285:     </div>
286:   </section>`;
};

const getJS = (config, funnelId) => `// 6. Calculator Logic
  const input = document.getElementById('primaryInput');
  const selectorBtns = document.querySelectorAll('.segment-btn');
  const resultEl = document.getElementById('exposureResult');
  const subheadEl = document.getElementById('exposureSubhead');
  const btnContinue = document.getElementById('btnContinue');
  
  let selectorVal = ${config.options.find(o => o.active).val};
  
  function formatNumber(num) {
    return num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
  }
  
  function calculate() {
    const rawValue = input.value.replace(/,/g, '').replace(/[^\\d]/g, '');
    const inputVal = parseInt(rawValue, 10);
    
    if (!isNaN(inputVal) && inputVal > 0) {
      ${config.calcCode}
      btnContinue.disabled = false;
      input.closest('.input-wrapper').classList.add('has-value');
    } else {
      resultEl.textContent = '₦0';
      subheadEl.innerHTML = 'Enter your details above to see your estimated exposure.';
      btnContinue.disabled = true;
      input.closest('.input-wrapper').classList.remove('has-value');
    }
  }
  
  if (input) {
    input.addEventListener('input', (e) => {
      let rawValue = e.target.value.replace(/,/g, '').replace(/[^\\d]/g, '');
      if (rawValue !== '') {
        e.target.value = formatNumber(rawValue);
      } else {
        e.target.value = '';
      }
      calculate();
    });
  }
  
  if (selectorBtns) {
    selectorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        selectorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectorVal = parseInt(btn.getAttribute('data-val'), 10);
        calculate();
      });
    });
  }
  
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      const rawValue = input.value.replace(/,/g, '').replace(/[^\\d]/g, '');
      const inputVal = parseInt(rawValue, 10);
      
      const botNumber = '{{whatsappNumber}}';
      const msg = 'Hi CoverScore! I calculated my estimated exposure and want to see my full ${config.resultTitle}.';
      const encodedMsg = encodeURIComponent(msg);
      
      try {
        fetch('/api/public/landing-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_name: 'exposure_calculated',
            landing_page: 'personal_calculator',
            cta_position: 'calculator_cta',
            session_key: localStorage.getItem('coverscore_session') || Date.now().toString(),
            metadata: { inputVal, selectorVal }
          })
        });
      } catch(e) {}
      
      window.location.href = 'https://wa.me/' + botNumber + '?text=' + encodedMsg;
    });
  }
</script>`;

const viewsDir = 'src/views';
const files = fs.readdirSync(viewsDir)
  .filter(f => f.startsWith('coverscore-personal-') && f.endsWith('.hbs'))
  .map(f => path.join(viewsDir, f));

files.forEach(f => {
  let funnel = '';
  if (f.includes('family')) funnel = 'family';
  else if (f.includes('retirement')) funnel = 'retirement';
  else if (f.includes('health')) funnel = 'health';
  else if (f.includes('income')) funnel = 'income';
  else if (f.includes('young-professional')) funnel = 'young-professional';
  else if (f.includes('entrepreneur')) funnel = 'entrepreneur';
  
  if (!funnel) return;
  
  const config = configs[funnel];
  let content = fs.readFileSync(f, 'utf8');
  
  // Replace HTML Section
  content = content.replace(/<!-- 02b\. Exposure Calculator Section -->[\s\S]*?<\/section>/, getHTML(config, funnel).trim());
  
  // Replace JS Section
  content = content.replace(/[ ]*\/\/ 6\. Calculator Logic[\s\S]*?<\/script>/, getJS(config, funnel).trim());
  
  fs.writeFileSync(f, content);
  console.log('Updated calculator for', f);
});
