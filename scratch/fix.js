const fs = require('fs');
let c = fs.readFileSync('scratch/update_other_stories.js', 'utf8');
c = c.replace(/\\\\'/g, "\\'");
fs.writeFileSync('scratch/update_other_stories.js', c);
