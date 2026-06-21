const fs = require('fs');

const dataFile = 'src/data/industry_content.json';
let data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

const fireIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`; // Warning triangle with exclamation
const liabilityIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`; // Shield with check
const busIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="11" x2="22" y2="11"/><line x1="6" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="18" y2="15"/></svg>`; // Bus/vehicle

data.school.stories = [
  {
    "pill": "FIRE INCIDENT",
    "pillTheme": "red",
    "pillIcon": fireIcon,
    "image": "/images/risk-school-fire.png",
    "title": "School Fire Accident",
    "location": "Lagos, Nigeria",
    "desc": "An electrical fault in the science laboratory caused a fire that damaged several classrooms and learning materials.",
    "lossLabel": "TOTAL FINANCIAL IMPACT",
    "lossAmount": "₦45,000,000",
    "lossWords": "Forty five million naira\nin property damage and loss.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Regular electrical inspections, fire drills and maintenance can prevent disasters and save millions.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  },
  {
    "pill": "LIABILITY CLAIM",
    "pillTheme": "blue",
    "pillIcon": liabilityIcon,
    "image": "/images/risk-school-liability.png",
    "title": "Liability Claim",
    "location": "Abuja, Nigeria",
    "desc": "A student slipped in the school corridor due to a wet floor and sustained a fracture, leading to a liability claim against the school.",
    "lossLabel": "SETTLEMENT PAID",
    "lossAmount": "₦12,500,000",
    "lossWords": "Twelve million, five hundred thousand naira\npaid in settlement and legal fees.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Clear safety procedures, supervision and timely maintenance reduce the risk of injuries and claims.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  },
  {
    "pill": "SCHOOL BUS ACCIDENT",
    "pillTheme": "green",
    "pillIcon": busIcon,
    "image": "/images/risk-school-bus.png",
    "title": "School Bus Accident",
    "location": "Ogun State, Nigeria",
    "desc": "A school bus was involved in an accident caused by a third-party driver, resulting in injuries to multiple students.",
    "lossLabel": "TOTAL COST",
    "lossAmount": "₦18,750,000",
    "lossWords": "Eighteen million, seven hundred and fifty thousand naira\nin medical and legal costs.",
    "lessonTitle": "KEY LESSON",
    "lessonDesc": "Proper driver screening, vehicle maintenance and student safety protocols are critical to prevent accidents.",
    "lessonTheme": "orange",
    "trustLine1": "Every risk has a cost.",
    "trustLine2": "Know yours before it becomes<br>your loss."
  }
];

fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
console.log('Updated src/data/industry_content.json successfully.');
