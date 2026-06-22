const fs = require('fs');
let f = fs.readFileSync('src/views/admin/assessments.hbs', 'utf8');
f = f.replace(/\s*<div class="a-avatar[^>]*>[^<]*<\/div>/g, '');
fs.writeFileSync('src/views/admin/assessments.hbs', f);
console.log('Avatars removed');
