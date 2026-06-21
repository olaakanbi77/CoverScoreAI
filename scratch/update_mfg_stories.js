const fs = require('fs');

const dataFile = 'src/data/industry_content.json';
let data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

const floodIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M4 22h16"/><path d="M4 18h16"/></svg>`; // Water drop / flood
const fireIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`; // Warning triangle with exclamation
const surgeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`; // Lightning bolt

data.manufacturing.stories = [
  {
    "pill": "FLOOD INCIDENT",
    "pillTheme": "blue",
    "pillIcon": floodIcon,
    "image": "/images/risk-mfg-flood.png",
    "title": "Manufacturing Warehouse Flood",
    "location": "Port Harcourt, Nigeria",
    "desc": "Heavy rainfall caused severe flooding in the warehouse, damaging raw materials, inventory and machinery and halting operations for 10 days.",
    "lossLabel": "TOTAL FINANCIAL IMPACT",
    "lossAmount": "₦28,500,000",
    "lossWords": "Twenty eight million, five hundred\nthousand naira in losses and recovery costs.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Proper drainage, flood barriers and business continuity plans can significantly reduce downtime and losses.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  },
  {
    "pill": "FIRE INCIDENT",
    "pillTheme": "red",
    "pillIcon": fireIcon,
    "image": "/images/risk-mfg-fire.png",
    "title": "Factory Fire",
    "location": "Aba, Nigeria",
    "desc": "An electrical fault in the production line triggered a fire that destroyed machinery and inventory and stopped production for 3 weeks.",
    "lossLabel": "TOTAL FINANCIAL IMPACT",
    "lossAmount": "₦42,000,000",
    "lossWords": "Forty two million naira in property\ndamage and business interruption.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Regular electrical inspections, fire detection systems and staff drills can prevent devastating fires.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  },
  {
    "pill": "EQUIPMENT FAILURE",
    "pillTheme": "purple",
    "pillIcon": surgeIcon,
    "image": "/images/risk-mfg-surge.png",
    "title": "Power Surge Equipment Failure",
    "location": "Lagos, Nigeria",
    "desc": "A power surge damaged sensitive production equipment, causing data loss, repair costs and a 5 day production downtime.",
    "lossLabel": "TOTAL FINANCIAL IMPACT",
    "lossAmount": "₦16,750,000",
    "lossWords": "Sixteen million, seven hundred and fifty\nthousand naira in repair and downtime costs.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Surge protection devices and regular equipment maintenance prevent costly electrical damage.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  }
];

fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
console.log('Updated src/data/industry_content.json successfully.');
