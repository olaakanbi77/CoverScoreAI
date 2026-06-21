const fs = require('fs');

const css = `
/* --- EXACT FAQ REDESIGN --- */
.section-faq-exact {
  background: white;
}

.exact-faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exact-faq-item {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.exact-faq-item.open {
  background: #f8fafc;
  border-color: #10B981;
}

.exact-faq-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.exact-faq-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f0fdf4;
  border: 1px solid #10B981;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #10B981;
}

.exact-faq-item.open .exact-faq-icon-wrapper {
  background: white;
}

.exact-faq-title-area {
  flex: 1;
  padding-top: 2px;
}

.exact-faq-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #071739;
  margin: 0 0 4px 0;
  line-height: 1.3;
  transition: color 0.3s ease;
}

.exact-faq-item.open .exact-faq-title {
  color: #10B981;
}

.exact-faq-answer {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.4s ease, opacity 0.4s ease;
}

.exact-faq-item.open .exact-faq-answer {
  max-height: 400px;
  opacity: 1;
  margin-top: 8px;
}

.exact-faq-answer p {
  margin: 0;
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
}

.exact-faq-chevron {
  padding-top: 4px;
  color: #0f172a;
  transition: transform 0.3s ease;
}

.exact-faq-item.open .exact-faq-chevron {
  transform: rotate(180deg);
}
`;

fs.appendFileSync('src/public/css/landing.css', css);
