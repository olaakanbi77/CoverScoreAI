const fs = require('fs');
const path = require('path');

const viewsDir = 'src/views';
const files = fs.readdirSync(viewsDir)
  .filter(f => f.startsWith('coverscore-personal-') && f.endsWith('.hbs'))
  .map(f => path.join(viewsDir, f));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // Replace newlines and spaces between buttons in the selector
  content = content.replace(/<\/button>\s+<button class="segment-btn/g, '</button><button class="segment-btn');
  // Also remove spaces before the first button
  content = content.replace(/id="selectorControl"[^>]*>\s+<button class="segment-btn/g, (match) => {
    return match.replace(/>\s+<button/, '><button');
  });
  // Also remove spaces after the last button
  content = content.replace(/<\/button>\s+<\/div>/g, '</button></div>');
  
  fs.writeFileSync(f, content);
  console.log('Fixed selector newlines for', f);
});
