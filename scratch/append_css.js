const fs = require('fs');
const css = `
/* --- Premium FAQ Redesign --- */
.premium-faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.premium-faq-item {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.premium-faq-item:hover {
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.premium-faq-item.open {
  border-color: #10B981;
  box-shadow: 0 12px 24px rgba(16, 185, 129, 0.1);
  transform: translateY(-2px);
}

.premium-faq-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  gap: 16px;
}

.premium-faq-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.premium-faq-item.open .premium-faq-title {
  color: #10B981;
}

.premium-faq-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-faq-item.open .premium-faq-icon {
  background: #10B981;
  color: white;
  transform: rotate(180deg);
}

.premium-faq-answer {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-faq-item.open .premium-faq-answer {
  max-height: 400px;
  opacity: 1;
}

.premium-faq-answer-inner {
  padding: 0 24px 24px;
  font-size: 1rem;
  color: #475569;
  line-height: 1.6;
}
`;
fs.appendFileSync('src/public/css/landing.css', css);
