const fs = require('fs');

const generateReplacement = (slides, ctaTitle) => {
  const getBadgeColor = (index) => ['blue', 'red', 'purple'][index];
  
  let html = `<div class="rrs-carousel-track" id="rrs-track" onscroll="handleRrsScroll()">\n`;
  
  slides.forEach((slide, i) => {
    const color = getBadgeColor(i);
    // Use an icon based on color or slide index. Just keeping them generic but distinct enough.
    let badgeIcon = '';
    if (i === 0) { // blue
      badgeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>`; // briefcase-ish
    } else if (i === 1) { // red
      badgeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>`; // activity/medical
    } else { // purple
      badgeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                  </svg>`; // clock/time
    }
    
    html += `          <!-- SLIDE ${i+1} -->
          <div class="rrs-slide">
            <div class="rrs-top-grid">
              <div class="rrs-top-left">
                <div class="rrs-badge ${color}">
                  ${badgeIcon}
                  ${slide.badgeText.toUpperCase()}
                </div>
                <div class="rrs-slide-title">${slide.title}</div>
                <div class="rrs-location">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--green-color)">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  ${slide.location}
                </div>
                <div class="rrs-slide-desc">${slide.desc}</div>
              </div>
              <div class="rrs-top-right">
                <img src="${slide.imgSrc}" alt="${slide.title}" class="rrs-image">
              </div>
            </div>
  
            <div class="rrs-box rrs-impact-box ${color}">
              <div class="rrs-impact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <div class="rrs-impact-label">${slide.impactLabel.toUpperCase()}</div>
                <div class="rrs-impact-amount">${slide.impactAmount}</div>
                <div class="rrs-impact-desc">${slide.impactDesc}</div>
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
                <div class="rrs-lesson-text">${slide.lesson}</div>
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
                <div class="rrs-risk-title">${slide.guaranteeTitle}</div>
                <div class="rrs-risk-desc">${slide.guaranteeDesc}</div>
              </div>
            </div>
  
            <div class="rrs-cta-box" onclick="startAssessment('rrs_slide${i+1}')">
              <div class="rrs-cta-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <div style="flex: 1;">
                <div class="rrs-cta-title">${ctaTitle}</div>
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
          </div>\n`;
  });
  
  html += `        </div>`;
  return html;
};

const processFile = (filePrefix, slides, ctaTitle) => {
  const replacement = generateReplacement(slides, ctaTitle);
  const files = [
    `src/views/coverscore-personal-${filePrefix}.hbs`,
    `src/views/coverscore-personal-${filePrefix}-calculator.hbs`
  ];
  
  files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    const startIndex = content.indexOf('<div class="rrs-carousel-track" id="rrs-track"');
    if (startIndex !== -1) {
      const sectionIndex = content.indexOf('</section>', startIndex);
      if (sectionIndex !== -1) {
          content = content.substring(0, startIndex) + replacement + content.substring(sectionIndex + 10);
          fs.writeFileSync(file, content);
          console.log('Updated', file);
      } else {
          console.log('Could not find section end in', file);
      }
    } else {
        console.log('Could not find start in', file);
    }
  });
};

// 1. INCOME PROTECTION
const incomeSlides = [
  {
    badgeText: 'JOB LOSS WITHOUT WARNING',
    title: 'Job Loss Without Warning',
    location: 'Lagos, Nigeria',
    desc: 'After a company restructuring, he lost his job unexpectedly. With no income for 6 months, savings were depleted and bills piled up.',
    imgSrc: '/images/risk-income-1.jpg',
    impactLabel: 'TOTAL INCOME EXPOSURE',
    impactAmount: '₦3,600,000',
    impactDesc: 'Three million, six hundred thousand naira in lost income.',
    lesson: 'Job security is never guaranteed. Income protection provides stability.',
    guaranteeTitle: 'Every income can stop.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  },
  {
    badgeText: 'ACCIDENT ENDED HIS CAREER',
    title: 'Accident Ended His Career',
    location: 'Abuja, Nigeria',
    desc: 'A road accident left him unable to work for 9 months. His family had to rely on loans and support from relatives.',
    imgSrc: '/images/risk-income-2.jpg',
    impactLabel: 'TOTAL INCOME EXPOSURE',
    impactAmount: '₦5,400,000',
    impactDesc: 'Five million, four hundred thousand naira in lost income.',
    lesson: 'Disability can happen in seconds, but the impact lasts much longer.',
    guaranteeTitle: 'Every income can stop.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  },
  {
    badgeText: 'SIX MONTHS WITHOUT INCOME',
    title: 'Six Months Without Income',
    location: 'Port Harcourt, Nigeria',
    desc: 'His contract ended, and finding a new job took longer than expected. Six months without income almost broke the family\'s finances.',
    imgSrc: '/images/risk-income-3.jpg',
    impactLabel: 'TOTAL INCOME EXPOSURE',
    impactAmount: '₦3,000,000',
    impactDesc: 'Three million naira in lost income over 6 months.',
    lesson: 'A financial cushion buys time when income stops.',
    guaranteeTitle: 'Every income can stop.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  }
];

// 2. YOUNG PROFESSIONAL
const youngProSlides = [
  {
    badgeText: 'ONE ACCIDENT CHANGED EVERYTHING',
    title: 'One Accident Changed Everything',
    location: 'Lagos, Nigeria',
    desc: 'A bike accident left him with a broken leg and 4 months off work. His savings vanished, and he had to borrow to pay rent and survive.',
    imgSrc: '/images/risk-youngpro-1.jpg',
    impactLabel: 'TOTAL FINANCIAL IMPACT',
    impactAmount: '₦2,750,000',
    impactDesc: 'Two million, seven hundred and fifty thousand naira in unexpected costs.',
    lesson: 'Accidents don\'t check your age. Protection today secures your tomorrow.',
    guaranteeTitle: 'Every future has risks.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  },
  {
    badgeText: 'DREAMS DELAYED BY DEBT',
    title: 'Dreams Delayed By Debt',
    location: 'Abuja, Nigeria',
    desc: 'He took a loan to further his education, but unexpected family expenses and no income source delayed repayment and future opportunities.',
    imgSrc: '/images/risk-youngpro-2.jpg',
    impactLabel: 'TOTAL FINANCIAL IMPACT',
    impactAmount: '₦3,450,000',
    impactDesc: 'Three million, four hundred and fifty thousand naira in debt and penalties.',
    lesson: 'Debt multiplies when life happens. Plan ahead, stay prepared.',
    guaranteeTitle: 'Every future has risks.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  },
  {
    badgeText: 'NO EMERGENCY FUND',
    title: 'No Emergency Fund',
    location: 'Port Harcourt, Nigeria',
    desc: 'His car broke down and he lost his phone the same week. With no savings, he had to borrow to cover basic needs.',
    imgSrc: '/images/risk-youngpro-3.jpg',
    impactLabel: 'TOTAL FINANCIAL IMPACT',
    impactAmount: '₦1,850,000',
    impactDesc: 'One million, eight hundred and fifty thousand naira in unexpected costs.',
    lesson: 'Life is unpredictable. An emergency fund is your first shield.',
    guaranteeTitle: 'Every future has risks.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  }
];

// 3. ENTREPRENEUR
const entrepreneurSlides = [
  {
    badgeText: 'FOUNDER HOSPITALIZED',
    title: 'Founder Hospitalized, Business at Risk',
    location: 'Lagos, Nigeria',
    desc: 'A sudden illness left the founder hospitalized for weeks. With no succession plan, operations stalled and clients went elsewhere.',
    imgSrc: '/images/risk-entrepreneur-1.jpg',
    impactLabel: 'TOTAL FINANCIAL IMPACT',
    impactAmount: '₦6,800,000',
    impactDesc: 'Six million, eight hundred thousand naira in lost revenue and extra costs.',
    lesson: 'Your business shouldn\'t depend on just one person.',
    guaranteeTitle: 'Every business faces risks.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  },
  {
    badgeText: 'BUSINESS COULDN\'T RUN WITHOUT HER',
    title: 'The Business Couldn\'t Run Without Her',
    location: 'Abuja, Nigeria',
    desc: 'She managed operations, clients, and finances. When she had to step away for medical treatment, the business lost major deals and suffered cash flow problems.',
    imgSrc: '/images/risk-entrepreneur-2.jpg',
    impactLabel: 'TOTAL FINANCIAL IMPACT',
    impactAmount: '₦5,200,000',
    impactDesc: 'Five million, two hundred thousand naira in lost contracts and disruption.',
    lesson: 'Key person risk can cripple your business when you least expect it.',
    guaranteeTitle: 'Every business faces risks.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  },
  {
    badgeText: 'PERSONAL CRISIS BECAME BUSINESS CRISIS',
    title: 'Personal Crisis Became Business Crisis',
    location: 'Port Harcourt, Nigeria',
    desc: 'A family emergency required urgent attention and funds. Diverting business money caused cash shortages and delayed payments.',
    imgSrc: '/images/risk-entrepreneur-3.jpg',
    impactLabel: 'TOTAL FINANCIAL IMPACT',
    impactAmount: '₦4,100,000',
    impactDesc: 'Four million, one hundred thousand naira in penalties and business delays.',
    lesson: 'Personal emergencies can quickly become business emergencies.',
    guaranteeTitle: 'Every business faces risks.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  }
];

// 4. HEALTH PROTECTION
const healthSlides = [
  {
    badgeText: 'EMERGENCY SURGERY',
    title: 'Emergency Surgery Came Without Warning',
    location: 'Lagos, Nigeria',
    desc: 'A simple stomach pain turned out to be something serious. Emergency surgery saved his life, but the hospital bill came with a heavy price tag.',
    imgSrc: '/images/risk-health-1.jpg',
    impactLabel: 'TOTAL HEALTHCARE EXPOSURE',
    impactAmount: '₦4,850,000',
    impactDesc: 'Four million, eight hundred and fifty thousand naira in medical costs.',
    lesson: 'Medical emergencies don\'t come with a bill estimate—be financially prepared.',
    guaranteeTitle: 'Every family faces health risks.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  },
  {
    badgeText: 'CANCER TREATMENT',
    title: 'Cancer Treatment Changed Everything',
    location: 'Abuja, Nigeria',
    desc: 'What started as a routine check-up became a long battle. Months of treatment, medications, and hospital visits drained their savings.',
    imgSrc: '/images/risk-health-2.jpg',
    impactLabel: 'TOTAL HEALTHCARE EXPOSURE',
    impactAmount: '₦7,200,000',
    impactDesc: 'Seven million, two hundred thousand naira in treatment and related expenses.',
    lesson: 'Serious illnesses can be a marathon, not a sprint—plan for the long run.',
    guaranteeTitle: 'Every family faces health risks.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  },
  {
    badgeText: 'CHILD ICU ADMISSION',
    title: 'A Child\'s ICU Admission Shook the Family',
    location: 'Port Harcourt, Nigeria',
    desc: 'A high fever led to complications and an ICU admission. The days in intensive care were emotional—and financially overwhelming.',
    imgSrc: '/images/risk-health-3.jpg',
    impactLabel: 'TOTAL HEALTHCARE EXPOSURE',
    impactAmount: '₦3,950,000',
    impactDesc: 'Three million, nine hundred and fifty thousand naira in medical costs.',
    lesson: 'Children\'s health can change in minutes, but the impact lasts for years.',
    guaranteeTitle: 'Every family faces health risks.',
    guaranteeDesc: 'Know yours before it becomes your burden.'
  }
];

// Execute processing
processFile('income', incomeSlides, 'Know My Income Risk');
processFile('young-professional', youngProSlides, 'Know My Future Risk');
processFile('entrepreneur', entrepreneurSlides, 'Know My Entrepreneur Risk');
processFile('health', healthSlides, 'Know My Health Risk');

