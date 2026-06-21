const fs = require('fs');

// 1. Clean up CSS encoding corruption
let css = fs.readFileSync('src/public/css/landing.css', 'utf8');

// Strip out anything after the last known good CSS rule
const idx = css.indexOf('.exact-faq-item.open .exact-faq-chevron {');
if (idx !== -1) {
  const endIdx = css.indexOf('}', idx);
  if (endIdx !== -1) {
    // Also remove any trailing null bytes or spaces caused by UTF-16
    css = css.substring(0, endIdx + 1) + '\n\n';
  }
}

// Append new cleanly formatted CSS overrides
css += `/* Trust Icons and Text Specification */
.hero-trust-icon-item, .hiw-trust-text, .tb-text, #calculator .hero-trust-icon-item, .hero-trust-icons {
  font-size: 13px !important;
  font-weight: 500 !important;
  color: #1e293b !important;
}

.hero-trust-icon-item svg, .hiw-trust-icon svg, .tb-text svg, .inline-trust-svg {
  width: 16px !important;
  height: 16px !important;
  flex: 0 0 auto !important;
}

/* Adjust the gaps */
.hero-trust-icon-item {
  gap: 6px !important;
}
.hero-trust-icons {
  gap: 20px !important;
}

#calculator .hero-trust-icons {
  gap: 20px !important;
}
`;

fs.writeFileSync('src/public/css/landing.css', css, 'utf8');

// 2. Fix inline styles in landing.hbs
let hbs = fs.readFileSync('src/views/landing.hbs', 'utf8');

// We previously set: font-size: 0.9rem; font-weight: 800;
hbs = hbs.replace(/font-size: 0\.9rem;\s*color: #475569;\s*font-weight: 800;/g, 'font-size: 13px; color: #475569; font-weight: 500;');
hbs = hbs.replace(/font-size: 0\.9rem;\s*font-weight: 800;\s*color: #1e293b;\s*line-height: 1\.3;/g, 'font-size: 13px; font-weight: 500; color: #1e293b; line-height: 1.3;');
hbs = hbs.replace(/font-size: 0\.9rem;\s*font-weight: 800;\s*color: #0f172a;\s*line-height: 1\.3;/g, 'font-size: 13px; font-weight: 500; color: #0f172a; line-height: 1.3;');

// Replace all 24x24 icons in those sections back to 16x16
// Calculator output
hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"><\/rect><path d="M7 11V7a5 5 0 0 1 10 0v4"><\/path><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>');
hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"><\/path><polyline points="9 12 11 14 15 10"><\/polyline><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>');
hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"><\/circle><polyline points="12 6 12 12 16 14"><\/polyline><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>');

// Other variations (stroke-width 2.5)
hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2\.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"><\/rect><path d="M7 11V7a5 5 0 0 1 10 0v4"><\/path><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>');
hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2\.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"><\/path><polyline points="9 12 11 14 15 10"><\/polyline><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>');
hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2\.5"><circle cx="12" cy="12" r="10"><\/circle><polyline points="12 6 12 12 16 14"><\/polyline><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>');

// Hero section variations
hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"\/><path d="M7 11V7a5 5 0 0110 0v4"\/><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>');
hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"\/><polyline points="9 12 11 14 15 10"\/><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>');
hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"\/><polyline points="12 6 12 12 16 14"\/><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>');


hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"><\/rect><path d="M7 11V7a5 5 0 0 1 10 0v4"><\/path><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>');
hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"><\/path><polyline points="9 12 11 14 15 10"><\/polyline><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>');
hbs = hbs.replace(/<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><circle cx="12" cy="12" r="10"><\/circle><polyline points="12 6 12 12 16 14"><\/polyline><\/svg>/g, '<svg class="inline-trust-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>');

// SPEC: Gap (Icon-Text) = 6px
// For inline trust groups, they had "gap: 4px;" or "gap: 8px;".
// The calculator has `<div style="display: flex; align-items: center; gap: 4px;">` for each icon-text group.
hbs = hbs.replace(/align-items: center; gap: 4px;/g, 'align-items: center; gap: 6px;');

// For the `hiw-trust-item` and others, they use gap 8px between icon and text.
hbs = hbs.replace(/class="hiw-trust-item" style="display: flex; align-items: center; gap: 8px;/g, 'class="hiw-trust-item" style="display: flex; align-items: center; gap: 6px;');
// Also in the sample risk score badges
hbs = hbs.replace(/<div style="display: flex; align-items: center; gap: 8px; border-right/g, '<div style="display: flex; align-items: center; gap: 6px; border-right');
hbs = hbs.replace(/<div style="display: flex; align-items: center; gap: 8px;">\s*<div style="color: #16a34a/g, '<div style="display: flex; align-items: center; gap: 6px;">\n          <div style="color: #16a34a');


// SPEC: Gap (Between Groups) = 20px
// 1. Calculator bottom
hbs = hbs.replace(/justify-content: center; align-items: center; gap: 8px; margin-top: 20px; font-size: 13px;/g, 'justify-content: center; align-items: center; gap: 20px; margin-top: 20px; font-size: 13px;');
// 2. Sample risk score
hbs = hbs.replace(/class="ss-trust-badges"\s*style="display: flex; align-items: center; justify-content: center; gap: 16px;/g, 'class="ss-trust-badges" style="display: flex; align-items: center; justify-content: center; gap: 20px;');

fs.writeFileSync('src/views/landing.hbs', hbs, 'utf8');
console.log("Applied new trust icons spec carefully.");
