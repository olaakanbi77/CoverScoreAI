const fs = require('fs');

let js = fs.readFileSync('scratch/apply_mobile_footer.js', 'utf8');

// Unify Icon Containers to 40x40
js = js.replace(/width: 36px;\s*height: 36px;/g, 'width: 40px;\n      height: 40px;');
js = js.replace(/width: 44px;\s*height: 44px;/g, 'width: 40px;\n      height: 40px;');

// Unify Top Badges Icons to 24x24
js = js.replace(/<svg width="18" height="18"/g, '<svg width="24" height="24"');

// Unify Stats Icons to 24x24
js = js.replace(/<svg width="22" height="22"/g, '<svg width="24" height="24"');

// Unify Font Sizes
js = js.replace(/font-size: 0\.75rem;\s*font-weight: 700;/g, 'font-size: 0.9rem;\n      font-weight: 800;');
js = js.replace(/font-size: 0\.65rem;/g, 'font-size: 0.75rem;');
js = js.replace(/font-size: 1\.2rem;/g, 'font-size: 0.9rem;');

// Remove inline font weights that might conflict
js = js.replace(/style="font-weight:500;"/g, 'style="font-size:0.75rem; color:#94a3b8;"');

fs.writeFileSync('scratch/apply_mobile_footer.js', js);
console.log('Unified sizes in script!');
