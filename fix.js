const fs = require('fs');
const glob = require('glob');
glob.sync('src/views/**/*.hbs').forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let nc = c.replace(/<a href="\/advisor\/profile"/g, '<a href="/admin/more"');
  if(c !== nc) {
    fs.writeFileSync(f, nc);
    console.log('Updated ' + f);
  }
});
