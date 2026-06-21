const fs = require('fs');
const hbsPath = 'src/views/landing.hbs';
const cssPath = 'src/public/css/landing.css';

let hbs = fs.readFileSync(hbsPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Update logo size in HBS
hbs = hbs.replace(
  '<img src="/images/logo.png" alt="CoverScore AI" style="height: 80px; width: auto; object-fit: contain;">',
  '<img src="/images/logo.png" alt="CoverScore AI" style="height: 95px; width: auto; object-fit: contain;">'
);

// 2. Add Mobile Menu HTML to HBS
const mobileMenuHTML = `
    </div>
    <!-- MOBILE MENU -->
    <div class="mobile-nav-menu" id="mobileNavMenu">
      <a href="#calculator">Exposure Calculator</a>
      <a href="#how-it-works">How It Works</a>
      <a href="#sample">Sample Report</a>
      <a href="/auth/login">Login</a>
    </div>
  </nav>`;
hbs = hbs.replace('    </div>\n  </nav>', mobileMenuHTML);

// 3. Add Mobile Menu toggle script to HBS
const mobileMenuScript = `
<script>
  (function() {
    var mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    var mobileNavMenu = document.getElementById('mobileNavMenu');
    if (mobileMenuBtn && mobileNavMenu) {
      mobileMenuBtn.addEventListener('click', function() {
        mobileNavMenu.classList.toggle('active');
      });
    }
  })();
</script>
</body>`;
hbs = hbs.replace('</body>', mobileMenuScript);

// 4. Update logo sizes in CSS
css = css.replace(
  '  .logo img {\n    height: 72px !important;\n    max-width: 250px;\n  }',
  '  .logo img {\n    height: 85px !important;\n    max-width: 280px;\n  }'
);

css = css.replace(
  '  .logo img {\n    height: 62px !important;\n    max-width: 240px;\n  }',
  '  .logo img {\n    height: 75px !important;\n    max-width: 250px;\n  }'
);

// 5. Add CSS for mobile-nav-menu
const mobileNavCss = `
.mobile-nav-menu {
  display: none;
  flex-direction: column;
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 16px 24px;
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 100;
}
.mobile-nav-menu.active {
  display: flex;
}
.mobile-nav-menu a {
  padding: 12px 0;
  color: var(--text-main);
  font-weight: 500;
  font-size: 1.05rem;
  text-decoration: none;
  border-bottom: 1px solid #f1f5f9;
}
.mobile-nav-menu a:last-child {
  border-bottom: none;
}
`;

css += mobileNavCss;

fs.writeFileSync(hbsPath, hbs);
fs.writeFileSync(cssPath, css);
console.log('Successfully patched landing.hbs and landing.css');
