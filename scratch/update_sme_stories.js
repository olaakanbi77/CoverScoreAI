const fs = require('fs');

const dataFile = 'src/data/industry_content.json';
let data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

const injuryIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 7V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V7"/><path d="M14 13.5V17a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2v-3.5"/><circle cx="12" cy="10" r="3"/><path d="M8 10H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4"/><path d="M16 10h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4"/></svg>`; // User icon injured or similar
const fireIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`; // Warning triangle with exclamation
const cyberIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`; // Lock icon

data.sme.stories = [
  {
    "pill": "EMPLOYEE INJURY",
    "pillTheme": "orange",
    "pillIcon": injuryIcon,
    "image": "/images/risk-sme-injury.png",
    "title": "SME Employee Injury",
    "location": "Lagos, Nigeria",
    "desc": "A staff member sustained serious back injury while lifting heavy goods, leading to medical costs and compensation claims.",
    "lossLabel": "TOTAL FINANCIAL IMPACT",
    "lossAmount": "₦3,500,000",
    "lossWords": "Three million, five hundred\nthousand naira in costs and settlement.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Workplace safety training and personal accident coverage protect your people and your business.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  },
  {
    "pill": "OFFICE FIRE",
    "pillTheme": "red",
    "pillIcon": fireIcon,
    "image": "/images/risk-sme-fire.png",
    "title": "Office Fire",
    "location": "Abuja, Nigeria",
    "desc": "An electrical short circuit sparked a fire in an office that destroyed equipment, documents and critical business data.",
    "lossLabel": "TOTAL FINANCIAL IMPACT",
    "lossAmount": "₦12,000,000",
    "lossWords": "Twelve million naira in asset loss,\nbusiness interruption and recovery.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Fire detection, proper wiring and insurance coverage safeguard your assets and ensure continuity.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  },
  {
    "pill": "CYBER RANSOMWARE",
    "pillTheme": "blue",
    "pillIcon": cyberIcon,
    "image": "/images/risk-sme-cyber.png",
    "title": "Cyber Ransomware",
    "location": "Lagos, Nigeria",
    "desc": "Ransomware attack locked company systems and stole customer data, causing downtime and financial losses.",
    "lossLabel": "TOTAL FINANCIAL IMPACT",
    "lossAmount": "₦7,800,000",
    "lossWords": "Seven million, eight hundred thousand\nnaira in ransom, recovery and lost income.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Strong cybersecurity, backups and cyber insurance minimize digital risks and downtime.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  }
];

fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
console.log('Updated src/data/industry_content.json successfully.');
