const fs = require('fs');

const svgShield = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>`;
const svgClock = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
const svgLock = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
const svgDoc = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
const svgDollar = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;
const svgHeadset = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`;

const genericFaq = [
  { icon: svgDollar, q: "Is it free?", a: "Your risk assessment is completely free. No hidden fees. No credit card required." },
  { icon: svgClock, q: "How long does it take?", a: "It takes <span style=\"color: #10B981; font-weight: 700;\">less than 5 minutes</span> to complete the assessment and get your risk score." },
  { icon: svgShield, q: "Will I be pressured to buy insurance?", a: "No. You are under no obligation to buy anything. CoverScore provides objective risk intelligence to help you make informed decisions." },
  { icon: svgLock, q: "Is my information confidential?", a: "Yes. Your data is <span style=\"color: #10B981; font-weight: 700;\">100% secure</span> and confidential. We use industry-standard encryption and never share your information." }
];

const exactHospitalFaq = [
  { icon: svgShield, q: "What is CoverScore?", a: "CoverScore is a hospital risk assessment platform that analyzes 25+ risk factors across 6 key categories to generate your overall risk score." },
  { icon: svgClock, q: "How long does it take?", a: "It takes <span style=\"color: #10B981; font-weight: 700;\">less than 5 minutes</span> to complete the assessment and get your risk score." },
  { icon: svgLock, q: "Is my data secure?", a: "Yes. Your data is <span style=\"color: #10B981; font-weight: 700;\">100% secure</span> and confidential. We use industry-standard encryption and never share your information." },
  { icon: svgDoc, q: "What do I get with my risk score?", a: "You'll receive a detailed risk report showing your score, risk breakdown, identified gaps, potential impact, and actionable recommendations." },
  { icon: svgDollar, q: "How much does it cost?", a: "Your risk assessment is completely free. No hidden fees. No credit card required." },
  { icon: svgHeadset, q: "Can I speak with someone?", a: "Absolutely! Our team is here to help. Contact us anytime at <span style=\"color: #10B981; font-weight: 700;\">support@coverscore.com</span>" }
];

const dataPath = 'src/data/industry_content.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

Object.keys(data).forEach(k => {
  if (k === 'hospital') {
    data[k].faq = exactHospitalFaq;
  } else if (data[k].faq) {
    data[k].faq = genericFaq;
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
