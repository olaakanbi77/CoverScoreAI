const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/industry_content.json', 'utf8'));
console.log(JSON.stringify(data.hospital.stories, null, 2));
