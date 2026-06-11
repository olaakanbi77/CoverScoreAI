const fs = require('fs');
const path = './src/views/admin/lead-details.hbs';
let content = fs.readFileSync(path, 'utf8');

// Remove \ before ` and \ before $
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed syntax errors!');
