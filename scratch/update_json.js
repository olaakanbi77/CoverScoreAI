const fs = require('fs');
const path = './src/data/industry_content.json';

let data = require('.' + path);

// Hospital
if (data.hospital) {
  data.hospital.shortName = "Hospital";
  data.hospital.shortNameLower = "hospital";
  data.hospital.shortNamePlural = "hospitals";
  data.hospital.facilityType = "Healthcare Facilities";
}

// School
if (data.school) {
  data.school.shortName = "School";
  data.school.shortNameLower = "school";
  data.school.shortNamePlural = "schools";
  data.school.facilityType = "Educational Institutions";
}

// Manufacturing
if (data.manufacturing) {
  data.manufacturing.shortName = "Manufacturing Facility";
  data.manufacturing.shortNameLower = "manufacturing facility";
  data.manufacturing.shortNamePlural = "manufacturing facilities";
  data.manufacturing.facilityType = "Manufacturing Plants";
}

// Church
if (data.church) {
  data.church.shortName = "Church";
  data.church.shortNameLower = "church";
  data.church.shortNamePlural = "churches";
  data.church.facilityType = "Religious Organizations";
}

// SME
if (data.sme) {
  data.sme.shortName = "Business";
  data.sme.shortNameLower = "business";
  data.sme.shortNamePlural = "businesses";
  data.sme.facilityType = "Small Businesses";
}

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log("Updated industry_content.json with new variables.");
