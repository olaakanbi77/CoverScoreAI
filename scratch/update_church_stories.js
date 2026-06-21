const fs = require('fs');

const dataFile = 'src/data/industry_content.json';
let data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

const fireIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`; // Warning triangle with exclamation
const liabilityIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`; // Shield with check
const stormIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><line x1="16" y1="20" x2="16" y2="22"/><line x1="8" y1="20" x2="8" y2="22"/><line x1="12" y1="20" x2="12" y2="22"/></svg>`; // Cloud rain

data.church.stories = [
  {
    "pill": "FIRE INCIDENT",
    "pillTheme": "red",
    "pillIcon": fireIcon,
    "image": "/images/risk-church-fire.png",
    "title": "Church Auditorium Fire",
    "location": "Ibadan, Nigeria",
    "desc": "An electrical fault in the sound system caused a fire during a youth event, damaging the auditorium and equipment.",
    "lossLabel": "TOTAL FINANCIAL IMPACT",
    "lossAmount": "₦25,000,000",
    "lossWords": "Twenty five million naira\nin property damage and loss.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Regular electrical inspections, equipment checks and fire safety measures can prevent devastating losses.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  },
  {
    "pill": "LIABILITY CLAIM",
    "pillTheme": "blue",
    "pillIcon": liabilityIcon,
    "image": "/images/risk-church-liability.png",
    "title": "Slip and Fall Lawsuit",
    "location": "Lagos, Nigeria",
    "desc": "A visitor slipped on a wet floor in the church lobby due to inadequate signage and maintenance, resulting in a lawsuit.",
    "lossLabel": "SETTLEMENT PAID",
    "lossAmount": "₦8,750,000",
    "lossWords": "Eight million, seven hundred and fifty thousand naira\npaid in settlement and legal fees.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Proper maintenance, signage and safety protocols can significantly reduce the risk of slip and fall claims.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  },
  {
    "pill": "STORM DAMAGE",
    "pillTheme": "green",
    "pillIcon": stormIcon,
    "image": "/images/risk-church-storm.png",
    "title": "Storm Roof Damage",
    "location": "Port Harcourt, Nigeria",
    "desc": "A heavy storm caused severe damage to the church roof, leading to water leakage and disruption of services for several weeks.",
    "lossLabel": "TOTAL COST",
    "lossAmount": "₦15,600,000",
    "lossWords": "Fifteen million, six hundred thousand naira\nin repair and restoration costs.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Regular roof inspections and storm preparedness help minimize damage and avoid costly disruptions.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  }
];

fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
console.log('Updated src/data/industry_content.json successfully.');
