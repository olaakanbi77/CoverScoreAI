/**
 * Seed comprehensive learning materials for all academy modules.
 * Run: node scripts/seed_academy_content.js
 *
 * This populates the academy_modules.content column with
 * rich HTML lesson content for every module in the v2 curriculum.
 */

const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'coverscore.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');
});

// ---------------------------------------------------------------------------
// Content definitions — one HTML lesson per module
// Keyed by module ID → { content_html, video_url, duration_minutes }
// ---------------------------------------------------------------------------

const CONTENT = {
  // ═════════════════════════════════════════════════════════════════════════
  // LEVEL 1: CCA™ — Foundation (modules 1-7, track=CORE)
  // ═════════════════════════════════════════════════════════════════════════

  // Module matching is by title slug (lowercase, trimmed) to avoid ID fragility
  'introduction to risk': {
    video_url: null,
    duration_minutes: 15,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Define risk in the context of insurance and personal finance</li>
      <li>Understand the difference between pure risk and speculative risk</li>
      <li>Recognise why risk awareness matters for individuals and businesses</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Risk?</h2>
    <p>Risk is the possibility of an event occurring that causes a negative outcome. In insurance, risk is the uncertainty of financial loss. Every person and every business faces risk every day — from a minor accident to a major disaster.</p>
    <p>Risk is not inherently bad. It is a natural part of life. What matters is how we <strong>identify, measure, and manage</strong> it.</p>
  </section>

  <section class="lesson-section">
    <h2>Pure Risk vs Speculative Risk</h2>
    <table class="lesson-table">
      <tr><th>Pure Risk</th><th>Speculative Risk</th></tr>
      <tr><td>Only possibility of loss (or no loss)</td><td>Possibility of gain OR loss</td></tr>
      <tr><td>Examples: fire, accident, illness, death</td><td>Examples: investing, gambling, starting a business</td></tr>
      <tr><td>Insurable</td><td>Generally not insurable</td></tr>
    </table>
    <p>Insurance exists primarily to protect against <strong>pure risk</strong>. When we advise a client, we focus on the pure risks they face that could cause financial harm.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Risk Categories</h2>
    <ul>
      <li><strong>Personal risks</strong> — health, income loss, death, disability</li>
      <li><strong>Property risks</strong> — damage to or loss of physical assets</li>
      <li><strong>Liability risks</strong> — legal responsibility for harm to others</li>
      <li><strong>Business risks</strong> — operational, strategic, financial</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Why Risk Awareness Matters</h2>
    <p>Most people do not think about risk until something happens. By then, it is often too late to avoid financial loss. As a CoverScore advisor, your role is to help clients <strong>recognise their risks before they materialise</strong> — and put protection in place.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Risk is the uncertainty of financial loss</li>
      <li>Insurance protects against pure risk, not speculative risk</li>
      <li>Risk can be personal, property, liability, or business-related</li>
      <li>Proactive risk awareness is the foundation of protection planning</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Think about a client you have worked with. What risks did they face? Could they have benefited from understanding those risks earlier?</p>
  </section>
</div>`
  },

  'introduction to insurance': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand what insurance is and how it works</li>
      <li>Learn the key principles of insurance</li>
      <li>Recognise different types of insurance products</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Insurance?</h2>
    <p>Insurance is a contract (a policy) in which an individual or entity receives financial protection against losses from an insurance company. The company pools clients' risks to make payments more affordable for the insured.</p>
    <p>In simple terms: <strong>many people pay a small amount (premium) so that a few who experience loss can receive a large payment (claim).</strong></p>
  </section>

  <section class="lesson-section">
    <h2>Core Principles of Insurance</h2>
    <ul>
      <li><strong>Utmost Good Faith</strong> — Both parties must act honestly and disclose all material facts.</li>
      <li><strong>Insurable Interest</strong> — The insured must benefit from the safety of the subject matter and suffer financially from its loss.</li>
      <li><strong>Indemnity</strong> — Insurance restores the insured to the financial position they were in before the loss (no profit from loss).</li>
      <li><strong>Subrogation</strong> — After paying a claim, the insurer can pursue the party responsible for the loss.</li>
      <li><strong>Contribution</strong> — If multiple policies cover the same loss, each contributes proportionally.</li>
      <li><strong>Proximate Cause</strong> — The nearest or immediate cause of the loss must be covered.</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Common Insurance Types</h2>
    <ul>
      <li><strong>Life Assurance</strong> — Pays a benefit on death or maturity</li>
      <li><strong>Health Insurance</strong> — Covers medical expenses</li>
      <li><strong>Motor Insurance</strong> — Covers vehicles against damage, theft, and third-party liability</li>
      <li><strong>Fire & Special Perils</strong> — Covers property against fire, storm, flood, etc.</li>
      <li><strong>Marine & Goods-in-Transit</strong> — Covers goods during transportation</li>
      <li><strong>Business Interruption</strong> — Covers loss of income when business is disrupted</li>
      <li><strong>Public Liability</strong> — Covers legal liability to third parties</li>
      <li><strong>Group Personal Accident</strong> — Covers a group of people against accidental injury or death</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Insurance spreads risk across many policyholders</li>
      <li>Six core principles govern how insurance works</li>
      <li>Different insurance products address different types of risk</li>
      <li>Insurance is a tool for financial resilience, not profit</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Which insurance principles have you encountered in your work? How do you explain them to clients?</p>
  </section>
</div>`
  },

  'risk management principles': {
    video_url: null,
    duration_minutes: 20,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the risk management process</li>
      <li>Learn the four main risk treatment strategies</li>
      <li>Apply risk management thinking to client scenarios</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>The Risk Management Process</h2>
    <p>Risk management is a structured approach to managing uncertainty. The process has five steps:</p>
    <ol>
      <li><strong>Identify</strong> — Recognise the risks that exist</li>
      <li><strong>Analyse</strong> — Understand the likelihood and potential impact</li>
      <li><strong>Evaluate</strong> — Prioritise risks that need treatment</li>
      <li><strong>Treat</strong> — Decide what to do about each risk</li>
      <li><strong>Monitor</strong> — Review and update regularly</li>
    </ol>
    <p>This is a cycle, not a one-time exercise. Risks change over time, and protection plans must evolve with them.</p>
  </section>

  <section class="lesson-section">
    <h2>Four Risk Treatment Strategies</h2>
    <table class="lesson-table">
      <tr><th>Strategy</th><th>Description</th><th>Example</th></tr>
      <tr><td><strong>Avoid</strong></td><td>Eliminate the activity that creates the risk</td><td>Not installing a swimming pool to avoid liability</td></tr>
      <tr><td><strong>Reduce</strong></td><td>Take action to lower likelihood or impact</td><td>Installing fire extinguishers and sprinklers</td></tr>
      <tr><td><strong>Transfer</strong></td><td>Shift the financial burden to another party</td><td>Buying an insurance policy</td></tr>
      <tr><td><strong>Retain</strong></td><td>Accept the risk and bear the financial consequences</td><td>Self-insuring for small losses</td></tr>
    </table>
    <p>Insurance is the most common form of <strong>risk transfer</strong>. However, good risk management uses a combination of all four strategies.</p>
  </section>

  <section class="lesson-section">
    <h2>Risk Management in Advisory</h2>
    <p>As a CoverScore advisor, you help clients think through their risks systematically. Your recommendations should not only transfer risk through insurance but also suggest practical risk-reduction measures. This holistic approach builds trust and reduces claims.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Risk management is a five-step cycle: identify, analyse, evaluate, treat, monitor</li>
      <li>Risks can be avoided, reduced, transferred, or retained</li>
      <li>Insurance is one tool — combine it with prevention for best results</li>
      <li>Good risk management reduces claims and lowers long-term costs</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Think of a risk your client faced. Which treatment strategies did you recommend? Could others have been useful?</p>
  </section>
</div>`
  },

  'coverscore philosophy™': {
    video_url: null,
    duration_minutes: 15,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the CoverScore mission and approach</li>
      <li>Learn how CoverScore differs from traditional insurance advisory</li>
      <li>Embrace the data-driven, client-first mindset</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>The CoverScore Mission</h2>
    <p>CoverScore exists to <strong>democratise risk intelligence</strong>. We believe everyone — individuals, families, and businesses — deserves to understand their risks and have access to appropriate protection.</p>
    <p>Traditional insurance is reactive: you buy a product after something happens. CoverScore is proactive: we assess, score, and recommend before risk becomes loss.</p>
  </section>

  <section class="lesson-section">
    <h2>Our Core Beliefs</h2>
    <ul>
      <li><strong>Risk is personal</strong> — Every individual and business has a unique risk profile</li>
      <li><strong>Data empowers decisions</strong> — Objective scoring removes guesswork</li>
      <li><strong>Protection is a journey</strong> — Risk changes; protection plans should evolve</li>
      <li><strong>Advisors are trusted partners</strong> — Technology enhances, not replaces, human judgment</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>How CoverScore Works</h2>
    <ol>
      <li>A client completes a risk assessment (personal or business)</li>
      <li>The CoverScore engine calculates a risk score (0-100)</li>
      <li>A detailed Risk Fingerprint identifies specific exposures and gaps</li>
      <li>The advisor reviews the report and recommends protection solutions</li>
      <li>The client implements recommendations and tracks improvement over time</li>
    </ol>
  </section>

  <section class="lesson-section">
    <h2>Why This Matters</h2>
    <p>When you use CoverScore, you move from <strong>selling insurance products</strong> to <strong>delivering risk intelligence</strong>. Clients trust you more because you understand their specific situation — and you can show measurable improvement over time.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>CoverScore is proactive, data-driven, and client-centric</li>
      <li>Risk scoring removes guesswork and builds trust</li>
      <li>Advisors are partners in an ongoing protection journey</li>
      <li>Technology empowers better advisory, not replacement of advisors</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How does the CoverScore approach change the way you interact with clients compared to traditional insurance selling?</p>
  </section>
</div>`
  },

  'professional ethics': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the ethical responsibilities of a risk advisor</li>
      <li>Learn how to handle conflicts of interest</li>
      <li>Apply ethical decision-making frameworks</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Why Ethics Matter</h2>
    <p>Clients trust you with their financial security. Ethical conduct is not optional — it is the foundation of the advisory profession. A breach of ethics damages not only your reputation but the entire industry.</p>
  </section>

  <section class="lesson-section">
    <h2>Core Ethical Principles</h2>
    <ul>
      <li><strong>Integrity</strong> — Be honest and transparent in all dealings</li>
      <li><strong>Competence</strong> — Maintain and improve your knowledge</li>
      <li><strong>Client Interest First</strong> — Recommend what serves the client, not your commission</li>
      <li><strong>Confidentiality</strong> — Protect client information</li>
      <li><strong>Fairness</strong> — Treat all clients equitably</li>
      <li><strong>Professionalism</strong> — Act in a manner that upholds the profession</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Handling Conflicts of Interest</h2>
    <p>A conflict of interest arises when your personal interest conflicts with your duty to the client. Examples include:</p>
    <ul>
      <li>Recommending a product because it pays higher commission</li>
      <li>Failing to disclose that you earn more from one provider</li>
      <li>Serving two clients with competing interests</li>
    </ul>
    <p><strong>Disclosure is the first step.</strong> When in doubt, tell the client and let them decide.</p>
  </section>

  <section class="lesson-section">
    <h2>Ethical Decision-Making Framework</h2>
    <ol>
      <li>Identify the ethical issue</li>
      <li>Consider all parties affected</li>
      <li>Evaluate options against ethical principles</li>
      <li>Choose the option that best serves the client</li>
      <li>Document your reasoning</li>
    </ol>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Ethics are the foundation of trust in advisory relationships</li>
      <li>Always put the client's interest first</li>
      <li>Disclose conflicts of interest openly</li>
      <li>Use a structured framework for ethical decisions</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Have you faced a situation where your interest conflicted with a client's? How did you handle it?</p>
  </section>
</div>`
  },



  'understanding business risks': {
    video_url: null,
    duration_minutes: 14,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section"><h2>Learning Objectives</h2><ul><li>Identify the main types of business risks</li><li>Understand how business risks differ from personal risks</li><li>Learn to spot risk indicators in business operations</li></ul></section>
  <section class="lesson-section"><h2>Business Risk Categories</h2><p>Businesses face a broader range of risks than individuals. Understanding these categories is essential for effective advisory:</p><ul><li><strong>Strategic Risk</strong> — Competition, market changes, regulatory shifts</li><li><strong>Operational Risk</strong> — Process failures, supply chain disruption, technology breakdown</li><li><strong>Financial Risk</strong> — Cash flow problems, credit defaults, interest rate changes</li><li><strong>Compliance Risk</strong> — Regulatory fines, legal penalties, license revocation</li><li><strong>Hazard Risk</strong> — Fire, flood, theft, accidents, liability claims</li></ul></section>
  <section class="lesson-section"><h2>Spotting Risk Indicators</h2><p>Help clients recognise warning signs: aging equipment, single-supplier dependence, no documented procedures, high employee turnover, overdue regulatory filings, and frequent cash flow pressure.</p></section>
  <section class="lesson-section"><h2>Your Advisory Role</h2><p>Your job is to help business owners see risks they have normalised. Ask questions that reveal hidden exposures: "What would happen if your key supplier closed tomorrow?" or "When was your last equipment safety inspection?"</p></section>
  <section class="lesson-section"><h2>Key Takeaways</h2><ul><li>Business risks span strategic, operational, financial, compliance, and hazard categories</li><li>Many risks are hidden in normalised daily operations</li><li>Ask probing questions to uncover exposures</li><li>Insurance addresses hazard risk; advice addresses broader categories</li></ul></section>
  <section class="lesson-section"><h2>Reflection</h2><p>What business risks do you see most frequently in your client work? How do you help clients recognise them?</p></section>
</div>`
  },

  'introduction to coverscore™': {
    video_url: null,
    duration_minutes: 12,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section"><h2>Learning Objectives</h2><ul><li>Understand what CoverScore is and how it works</li><li>Learn the key features of the platform</li><li>Know how to navigate the advisor dashboard</li></ul></section>
  <section class="lesson-section"><h2>Welcome to CoverScore</h2><p>CoverScore is a risk intelligence platform that helps individuals and businesses understand their risk exposure and connect with trusted advisors. The platform combines AI-powered assessments, risk scoring, and personalised recommendations.</p></section>
  <section class="lesson-section"><h2>Key Platform Features</h2><ul><li><strong>Risk Assessments</strong> — Personal, SME, School, Church, Hospital, Manufacturing</li><li><strong>CoverScore™</strong> — 0-100 risk score with detailed breakdown</li><li><strong>Risk Fingerprint™</strong> — Multi-dimensional risk profile</li><li><strong>Protection Gap Analysis</strong> — Identify missing or inadequate coverage</li><li><strong>Advisor Dashboard</strong> — Manage leads, assessments, and client relationships</li><li><strong>Proposal Builder</strong> — Generate professional proposals from assessment data</li></ul></section>
  <section class="lesson-section"><h2>Navigating the Platform</h2><p>Your advisor dashboard gives you a complete view of your clients, their assessments, and your performance metrics. Take time to explore each section: leads, assessments, opportunities, and the academy.</p></section>
  <section class="lesson-section"><h2>Key Takeaways</h2><ul><li>CoverScore combines AI, assessments, and advisory</li><li>The platform serves both personal and business clients</li><li>Your dashboard is your command centre</li><li>Explore all features to serve clients effectively</li></ul></section>
  <section class="lesson-section"><h2>Reflection</h2><p>Which CoverScore feature do you think provides the most value to your clients? Why?</p></section>
</div>`
  },

  'customer communication': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Develop effective client communication skills</li>
      <li>Learn to explain risk concepts in simple language</li>
      <li>Handle objections and build rapport</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Why Communication Matters</h2>
    <p>Insurance and risk are complex topics. Most clients do not have a background in either. Your ability to explain concepts clearly and listen actively determines whether a client trusts you and acts on your recommendations.</p>
  </section>

  <section class="lesson-section">
    <h2>The Communication Framework</h2>
    <ol>
      <li><strong>Listen first</strong> — Understand the client's situation, concerns, and goals</li>
      <li><strong>Simplify</strong> — Use analogies and everyday language</li>
      <li><strong>Confirm understanding</strong> — Ask the client to repeat back in their own words</li>
      <li><strong>Provide options</strong> — Present choices, not a single recommendation</li>
      <li><strong>Follow up</strong> — Summarise in writing and set next steps</li>
    </ol>
  </section>

  <section class="lesson-section">
    <h2>Handling Common Objections</h2>
    <ul>
      <li><strong>"Insurance is expensive"</strong> — Frame it as protection against catastrophic loss, not a recurring expense</li>
      <li><strong>"Nothing will happen to me"</strong> — Use risk data and stories to show that bad things happen to good people</li>
      <li><strong>"I need to think about it"</strong> — Offer to leave materials and schedule a follow-up</li>
      <li><strong>"I already have cover"</strong> — Offer a free risk review to find gaps</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Building Rapport</h2>
    <ul>
      <li>Use the client's name</li>
      <li>Show genuine interest in their situation</li>
      <li>Be empathetic — acknowledge their concerns</li>
      <li>Be patient — some clients need time to decide</li>
      <li>Follow through on promises</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Listen more than you talk</li>
      <li>Use simple language, not jargon</li>
      <li>Anticipate and address objections calmly</li>
      <li>Build trust through empathy and follow-through</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What is the most common objection you hear? How do you currently handle it?</p>
  </section>
</div>`
  },

  'digital advisory skills': {
    video_url: null,
    duration_minutes: 14,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Learn to use digital tools effectively in advisory</li>
      <li>Understand how to conduct virtual consultations</li>
      <li>Leverage CoverScore's digital platform</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>The Digital Shift</h2>
    <p>Modern advisory happens both in-person and digitally. Clients expect the convenience of online assessments, video consultations, and instant access to their risk reports. Advisors who embrace digital tools reach more clients and serve them more efficiently.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Digital Tools</h2>
    <ul>
      <li><strong>CoverScore Assessments</strong> — Send assessment links to clients via email or WhatsApp</li>
      <li><strong>Risk Reports</strong> — Generate and share digital risk reports instantly</li>
      <li><strong>Video Consultations</strong> — Use Zoom, Google Meet, or WhatsApp calls</li>
      <li><strong>Digital Documents</strong> — Share proposals and policies electronically</li>
      <li><strong>CRM</strong> — Track leads, nurture campaigns, and follow-ups</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Virtual Consultation Best Practices</h2>
    <ul>
      <li>Test your audio and video before the call</li>
      <li>Share your screen to walk through reports together</li>
      <li>Record the session (with permission) for reference</li>
      <li>Send a summary and action items after the call</li>
      <li>Follow up within 48 hours</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Security & Privacy</h2>
    <p>When using digital tools, always prioritise client data security. Use secure connections, avoid sharing sensitive information over unencrypted channels, and store documents in compliance with data protection regulations.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Digital tools help you reach and serve more clients</li>
      <li>Virtual consultations require preparation and follow-up</li>
      <li>CoverScore provides a full digital advisory platform</li>
      <li>Always prioritise client data security</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Which digital tools do you use most in your advisory work? Where could you improve?</p>
  </section>
</div>`
  },

  // ═════════════════════════════════════════════════════════════════════════
  // LEVEL 2: CRAS™ — Assessment (modules 8-14, track=CORE)
  // ═════════════════════════════════════════════════════════════════════════

  'assessment fundamentals™': {
    video_url: null,
    duration_minutes: 20,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the CoverScore assessment methodology</li>
      <li>Learn how to guide clients through the assessment process</li>
      <li>Interpret assessment results effectively</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is the CoverScore Assessment?</h2>
    <p>The CoverScore assessment is a structured questionnaire that evaluates a client's risk exposure across multiple dimensions. It is designed to be completed by the client independently or with advisor assistance. The assessment adapts to the client's profile — personal, business, or sector-specific.</p>
  </section>

  <section class="lesson-section">
    <h2>Assessment Types</h2>
    <ul>
      <li><strong>Family Protection Score™</strong> — Personal risk assessment for individuals and families</li>
      <li><strong>SME Risk Score™</strong> — Business risk assessment for small and medium enterprises</li>
      <li><strong>School Risk Score™</strong> — Specialised assessment for educational institutions</li>
      <li><strong>Church Risk Score™</strong> — Assessment for religious organisations</li>
      <li><strong>Hospital Risk Score™</strong> — Healthcare facility risk assessment</li>
      <li><strong>Manufacturing Risk Score™</strong> — Industrial risk assessment</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Guiding the Client</h2>
    <p>Your role during the assessment is to:</p>
    <ul>
      <li>Explain why each question matters</li>
      <li>Help the client answer honestly — not what they think you want to hear</li>
      <li>Clarify questions the client finds confusing</li>
      <li>Reassure the client that there are no "wrong" answers</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>The assessment is the foundation of the CoverScore process</li>
      <li>Different assessment types serve different client profiles</li>
      <li>Guide clients honestly and supportively</li>
      <li>Accurate inputs produce valuable outputs</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How would you explain the assessment to a client who is sceptical about sharing personal information?</p>
  </section>
</div>`
  },

  'coverscore risk score™': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand how the CoverScore is calculated</li>
      <li>Learn to interpret score ranges and what they mean</li>
      <li>Communicate the score effectively to clients</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is the CoverScore?</h2>
    <p>The CoverScore is a numerical representation of a client's risk posture, ranging from 0 to 100. A higher score means better protection and lower risk exposure. The score is calculated based on the client's answers across all assessment categories, weighted by category importance.</p>
  </section>

  <section class="lesson-section">
    <h2>Score Interpretation</h2>
    <table class="lesson-table">
      <tr><th>Score Range</th><th>Status</th><th>Meaning</th></tr>
      <tr><td>80 - 100</td><td>Protected</td><td>Good protection posture; periodic review recommended</td></tr>
      <tr><td>60 - 79</td><td>Moderate</td><td>Some gaps exist; targeted improvements needed</td></tr>
      <tr><td>40 - 59</td><td>At Risk</td><td>Significant gaps; urgent action recommended</td></tr>
      <tr><td>0 - 39</td><td>Critical</td><td>Major exposure; immediate protection plan required</td></tr>
    </table>
  </section>

  <section class="lesson-section">
    <h2>Communicating the Score</h2>
    <p>A low score can make clients feel anxious or defensive. Frame the score as a <strong>starting point for improvement</strong>, not a judgement. Show the client which specific areas contribute most to their score and what actions can improve it.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>CoverScore ranges from 0 (critical) to 100 (protected)</li>
      <li>The score is a tool for dialogue, not a final verdict</li>
      <li>Focus on specific improvement areas, not just the number</li>
      <li>Help clients see progress over time</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How would you present a score of 35 to a client without discouraging them?</p>
  </section>
</div>`
  },

  'risk fingerprint™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand what a Risk Fingerprint is</li>
      <li>Learn how to read and interpret a Risk Fingerprint report</li>
      <li>Use the fingerprint to guide client conversations</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is a Risk Fingerprint?</h2>
    <p>A Risk Fingerprint is a detailed breakdown of a client's risk profile across multiple dimensions. Unlike a single score, the fingerprint shows <strong>which areas</strong> drive the client's risk and <strong>where improvement is most impactful</strong>.</p>
  </section>

  <section class="lesson-section">
    <h2>Fingerprint Dimensions</h2>
    <ul>
      <li><strong>Risk Categories</strong> — Scores by category (e.g., Fire, Liability, Health)</li>
      <li><strong>Risk Levels</strong> — Severity rating for each identified risk</li>
      <li><strong>Protection Gaps</strong> — Specific areas where coverage is missing or inadequate</li>
      <li><strong>Recommendation Priority</strong> — Actions ranked by urgency and impact</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Using the Fingerprint in Advisory</h2>
    <p>The Risk Fingerprint is your primary tool for a structured advisory conversation. Walk through each dimension with the client, starting with their strongest areas (to build confidence) and then addressing gaps. Use visual charts and simple comparisons.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>A Risk Fingerprint shows risk across multiple dimensions</li>
      <li>It reveals specific gaps, not just an overall score</li>
      <li>Use it to have structured, prioritised conversations</li>
      <li>Start with strengths, then address gaps</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How would a Risk Fingerprint change the way you discuss risk with a client compared to a traditional insurance conversation?</p>
  </section>
</div>`
  },

  'exposure index™': {
    video_url: null,
    duration_minutes: 14,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the Exposure Index and how it is calculated</li>
      <li>Learn to identify high-exposure areas for clients</li>
      <li>Use the Exposure Index to prioritise recommendations</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is the Exposure Index?</h2>
    <p>The Exposure Index measures the <strong>potential financial impact</strong> of a risk event on the client. It combines the likelihood of an event with its potential severity. A high exposure index means the client has a lot to lose in that area.</p>
  </section>

  <section class="lesson-section">
    <h2>Calculating Exposure</h2>
    <p>Exposure = Likelihood × Severity</p>
    <ul>
      <li><strong>Likelihood</strong> — How probable is the risk event? (e.g., fire in a factory vs. fire in a residential apartment)</li>
      <li><strong>Severity</strong> — How much financial damage would occur if the event happened?</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Prioritising by Exposure</h2>
    <p>Help clients focus on high-exposure risks first. A small likelihood with catastrophic severity (e.g., a factory fire) deserves more attention than a high-likelihood risk with minor severity (e.g., a broken window).</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Exposure Index = Likelihood × Severity</li>
      <li>Focus on risks with high financial impact, even if unlikely</li>
      <li>Use exposure analysis to prioritise recommendations</li>
      <li>Help clients understand the difference between probability and impact</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Think of a client with limited budget. How would you use the Exposure Index to help them choose which risks to address first?</p>
  </section>
</div>`
  },

  'protection gap™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand what a protection gap is</li>
      <li>Learn to identify and quantify gaps</li>
      <li>Present gap analysis in a compelling way</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is a Protection Gap?</h2>
    <p>A protection gap is the difference between the protection a client <strong>currently has</strong> and the protection they <strong>need</strong>. Gaps can exist in any risk area — life cover, health insurance, property insurance, business interruption, etc.</p>
  </section>

  <section class="lesson-section">
    <h2>Types of Gaps</h2>
    <ul>
      <li><strong>Coverage gap</strong> — No insurance exists for a specific risk</li>
      <li><strong>Amount gap</strong> — Existing cover is insufficient for potential loss</li>
      <li><strong>Scope gap</strong> — Policy excludes important perils or situations</li>
      <li><strong>Knowledge gap</strong> — Client does not know they are under-insured</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Presenting Gaps to Clients</h2>
    <p>Use concrete numbers. For example: "Your building is insured for ₦10 million, but the replacement cost is ₦25 million. That is a ₦15 million gap." Show the financial impact of leaving the gap unaddressed.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>A protection gap is the difference between current and needed cover</li>
      <li>Gaps can be coverage, amount, scope, or knowledge-related</li>
      <li>Quantify gaps in monetary terms for impact</li>
      <li>Gap analysis is a powerful advisory tool</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Think of a client you advised. What was their biggest protection gap? How did you help them understand it?</p>
  </section>
</div>`
  },

  'risk dna™': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the components that make up a client's Risk DNA</li>
      <li>Learn how Risk DNA differs from Risk Fingerprint</li>
      <li>Use Risk DNA for deeper client insights</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Risk DNA?</h2>
    <p>Risk DNA goes beyond surface-level risk identification to understand the <strong>root causes</strong> and <strong>systemic patterns</strong> behind a client's exposures. While the Risk Fingerprint shows <strong>what</strong> risks exist, Risk DNA explains <strong>why</strong> they exist.</p>
  </section>

  <section class="lesson-section">
    <h2>Risk DNA Components</h2>
    <ul>
      <li><strong>Behavioural factors</strong> — How the client's decisions affect their risk profile</li>
      <li><strong>Environmental factors</strong> — Location, industry, regulatory context</li>
      <li><strong>Structural factors</strong> — Organisational setup, governance, processes</li>
      <li><strong>Historical factors</strong> — Past incidents and claims patterns</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Applying Risk DNA</h2>
    <p>Risk DNA analysis helps you make recommendations that address <strong>underlying causes</strong> rather than just symptoms. For example, if a business repeatedly has fire-related near-misses, the Risk DNA analysis might reveal poor electrical maintenance culture — not just a need for more fire insurance.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Risk DNA digs deeper than surface-level risk identification</li>
      <li>It explores behavioural, environmental, structural, and historical factors</li>
      <li>Address root causes, not just symptoms</li>
      <li>Risk DNA enables more effective long-term risk advice</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Think of a recurring risk you've seen with multiple clients. What might the Risk DNA reveal about the underlying cause?</p>
  </section>
</div>`
  },

  'ai assessment interpretation™': {
    video_url: null,
    duration_minutes: 15,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand how AI enhances risk assessment interpretation</li>
      <li>Learn to use AI-generated insights in client conversations</li>
      <li>Balance AI recommendations with human judgment</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>AI in Risk Assessment</h2>
    <p>CoverScore uses artificial intelligence to analyse assessment responses and generate deeper insights. AI can:</p>
    <ul>
      <li>Identify patterns across multiple risk categories</li>
      <li>Compare the client's profile against industry benchmarks</li>
      <li>Generate personalised recommendations</li>
      <li>Predict potential risk escalation if gaps remain unaddressed</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>AI + Advisor = Better Outcomes</h2>
    <p>AI provides the data and pattern recognition. The advisor provides context, empathy, and relationship. Together, they deliver insights that neither could achieve alone. Always review AI-generated recommendations and tailor them to the client's specific situation.</p>
  </section>

  <section class="lesson-section">
    <h2>Interpreting AI Output</h2>
    <ul>
      <li>Check that recommendations align with the client's actual circumstances</li>
      <li>Use AI insights as talking points, not scripts</li>
      <li>Explain to the client how AI analysis works — transparency builds trust</li>
      <li>Flag any recommendation that doesn't feel right for further review</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>AI enhances, not replaces, advisor judgment</li>
      <li>AI identifies patterns and benchmarks that humans might miss</li>
      <li>Always review and personalise AI recommendations</li>
      <li>Transparency about AI use builds client trust</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How might AI insights change the way you prepare for a client meeting?</p>
  </section>
</div>`
  },

  // ═════════════════════════════════════════════════════════════════════════
  // LEVEL 3: SPECIALIZATION — PERSONAL TRACK (modules 15-21, track=PERSONAL)
  // ═════════════════════════════════════════════════════════════════════════

  'family protection planning™': {
    video_url: null,
    duration_minutes: 20,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the key risks facing families</li>
      <li>Learn how to conduct a family protection review</li>
      <li>Recommend appropriate protection solutions for families</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Family Risks Overview</h2>
    <p>Families face a unique set of risks that can destabilise their financial security. The most critical include:</p>
    <ul>
      <li>Death of a primary income earner</li>
      <li>Disability or critical illness</li>
      <li>Medical emergencies</li>
      <li>Loss of income or employment</li>
      <li>Education funding shortfalls</li>
      <li>Property damage (home, vehicle)</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Conducting a Family Protection Review</h2>
    <ol>
      <li>Identify all dependents and their needs</li>
      <li>Assess current income, savings, and existing cover</li>
      <li>Calculate the income replacement needed for each scenario</li>
      <li>Identify gaps between current cover and required cover</li>
      <li>Present findings with clear recommendations</li>
    </ol>
  </section>

  <section class="lesson-section">
    <h2>Recommended Solutions</h2>
    <ul>
      <li><strong>Life Assurance</strong> — Income replacement, mortgage protection, education funding</li>
      <li><strong>Personal Accident Cover</strong> — Lump sum for accidental death or disability</li>
      <li><strong>Health Insurance</strong> — Medical expenses for the family</li>
      <li><strong>Home Insurance</strong> — Fire, flood, theft, and liability protection</li>
      <li><strong>Education Plan</strong> — Dedicated savings for children's education</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Family protection is about securing dependents' future</li>
      <li>A systematic review reveals critical gaps</li>
      <li>Multiple solutions work together for comprehensive protection</li>
      <li>Regular reviews ensure cover keeps pace with changing family needs</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Think of a family you have advised. Was there a protection need they had not considered? How did you help them see it?</p>
  </section>
</div>`
  },

  'health protection planning™': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand common health risks and their financial impact</li>
      <li>Learn how to advise clients on health protection</li>
      <li>Navigate different health insurance options</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Health Risk Reality</h2>
    <p>Medical emergencies are one of the most common causes of financial distress. A single hospitalisation can wipe out years of savings. Health protection is not optional — it is essential financial planning.</p>
  </section>

  <section class="lesson-section">
    <h2>Health Insurance Options</h2>
    <ul>
      <li><strong>HMO Plans</strong> — Prepaid healthcare with a network of providers</li>
      <li><strong>Health Insurance</strong> — Reimbursement-based cover for medical expenses</li>
      <li><strong>Critical Illness Cover</strong> — Lump sum payment on diagnosis of specified illnesses</li>
      <li><strong>Group Health</strong> — Employer-sponsored health cover for employees</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Advising on Health Cover</h2>
    <p>Understand the client's healthcare needs, budget, and preferences. Some clients prefer the flexibility of insurance that covers any hospital; others prefer the convenience of an HMO network. Help them weigh cost vs. access vs. coverage breadth.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Medical costs are a leading cause of financial distress</li>
      <li>Health protection comes in different forms (HMO, insurance, critical illness)</li>
      <li>Match the solution to the client's healthcare needs and budget</li>
      <li>Preventive care and wellness reduce long-term health risks</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What health protection option do your clients most commonly need? How do you help them choose?</p>
  </section>
</div>`
  },

  'income protection planning™': {
    video_url: null,
    duration_minutes: 17,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the importance of income protection</li>
      <li>Learn how to calculate income replacement needs</li>
      <li>Recommend income protection solutions</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Why Income Protection Matters</h2>
    <p>For most people, their ability to earn an income is their most valuable asset. A disability or prolonged illness that prevents work can have a more severe financial impact than property damage. Yet income protection is often overlooked.</p>
  </section>

  <section class="lesson-section">
    <h2>Calculating Income Replacement Needs</h2>
    <p>Help clients calculate how many months of expenses they could cover if income stopped today. Consider:</p>
    <ul>
      <li>Monthly household expenses</li>
      <li>Outstanding debts (mortgage, loans)</li>
      <li>Education fees</li>
      <li>Emergency medical costs</li>
      <li>Current savings and emergency fund</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Income Protection Solutions</h2>
    <ul>
      <li><strong>Personal Accident Cover</strong> — Lump sum for accidental disability</li>
      <li><strong>Critical Illness Cover</strong> — Lump sum on diagnosis</li>
      <li><strong>Emergency Fund Planning</strong> — 3-6 months of expenses in savings</li>
      <li><strong>Group Personal Accident</strong> — Cover through employer</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Income is most people's most valuable asset</li>
      <li>Calculate how long savings would last without income</li>
      <li>Income protection includes insurance and emergency savings</li>
      <li>Help clients understand the true value of their earning ability</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>If your own income stopped today, how long could you sustain your lifestyle? How does this answer shape how you advise clients?</p>
  </section>
</div>`
  },

  'retirement readiness planning™': {
    video_url: null,
    duration_minutes: 20,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the risks of inadequate retirement planning</li>
      <li>Learn how to assess retirement readiness</li>
      <li>Advise clients on retirement planning strategies</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>The Retirement Risk</h2>
    <p>Many people underestimate how much they need for retirement. Longer life expectancies, inflation, and rising healthcare costs mean that retirement savings must stretch further than previous generations needed.</p>
  </section>

  <section class="lesson-section">
    <h2>Assessing Retirement Readiness</h2>
    <ul>
      <li>Current age and planned retirement age</li>
      <li>Expected monthly expenses in retirement</li>
      <li>Current savings, investments, and pension contributions</li>
      <li>Expected income sources (pension, rental, investments)</li>
      <li>Inflation assumptions</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Retirement Planning Strategies</h2>
    <ul>
      <li><strong>Start early</strong> — Compound growth is most powerful over time</li>
      <li><strong>Diversify</strong> — Don't rely on a single income source</li>
      <li><strong>Review regularly</strong> — Adjust for life changes and inflation</li>
      <li><strong>Protect the plan</strong> — Ensure life and health cover don't derail savings</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Retirement is a long-term planning challenge, not a late-career emergency</li>
      <li>Assess readiness using concrete numbers and assumptions</li>
      <li>Diversification and regular review are critical</li>
      <li>Protection planning supports retirement planning</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What retirement risks do your clients most commonly overlook? How do you help them address these?</p>
  </section>
</div>`
  },

  'education funding planning™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the risks to education funding</li>
      <li>Learn how to advise clients on education planning</li>
      <li>Recommend appropriate education funding solutions</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Education Funding Risks</h2>
    <p>Education costs are rising faster than general inflation in many countries. A sudden income disruption — job loss, illness, or death — can derail a child's education if no dedicated plan exists.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Considerations</h2>
    <ul>
      <li>Number of children and their ages</li>
      <li>Target education level (secondary, university, postgraduate)</li>
      <li>Estimated costs (tuition, accommodation, books, living expenses)</li>
      <li>Years until each child starts their programme</li>
      <li>Current savings and existing education policies</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Education Funding Solutions</h2>
    <ul>
      <li><strong>Education Endowment Plans</strong> — Regular savings with lump sum at maturity</li>
      <li><strong>Life Assurance</strong> — Ensures funds are available even if the parent dies</li>
      <li><strong>Education Savings Accounts</strong> — Flexible savings with tax advantages</li>
      <li><strong>Scholarships & Bursaries</strong> — Awareness of available options</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Education funding needs a dedicated plan, not incidental savings</li>
      <li>Insurance ensures the plan survives the parent</li>
      <li>Start early — the longer the horizon, the more achievable the goal</li>
      <li>Review regularly as costs and circumstances change</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How would you help a young parent start an education funding plan with a limited budget?</p>
  </section>
</div>`
  },

  'estate & legacy awareness™': {
    video_url: null,
    duration_minutes: 15,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the basics of estate and legacy planning</li>
      <li>Learn how to advise clients on will and estate matters</li>
      <li>Know when to refer clients to legal professionals</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Estate Planning?</h2>
    <p>Estate planning is the process of arranging how a person's assets will be managed and distributed after their death. It includes wills, trusts, beneficiary designations, and powers of attorney.</p>
  </section>

  <section class="lesson-section">
    <h2>The Advisor's Role</h2>
    <p>As an insurance advisor, you are not a lawyer. However, you can:</p>
    <ul>
      <li>Ask clients if they have a will or estate plan</li>
      <li>Explain why estate planning matters for their family</li>
      <li>Recommend that they consult a qualified legal professional</li>
      <li>Ensure insurance policies have correct beneficiary designations</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Estate Planning Concepts</h2>
    <ul>
      <li><strong>Will</strong> — Legal document specifying asset distribution</li>
      <li><strong>Beneficiary Designation</strong> — Who receives insurance proceeds</li>
      <li><strong>Trust</strong> — Legal arrangement for managing assets</li>
      <li><strong>Power of Attorney</strong> — Authorising someone to act on your behalf</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Estate planning ensures assets go to the intended beneficiaries</li>
      <li>Advisors can raise awareness and ask the right questions</li>
      <li>Always recommend professional legal advice for estate matters</li>
      <li>Correct beneficiary designations on policies are critical</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Have you ever asked a client about their will or estate plan? If not, how could you introduce the topic?</p>
  </section>
</div>`
  },

  'personal risk reviews™': {
    video_url: null,
    duration_minutes: 14,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the importance of periodic risk reviews</li>
      <li>Learn how to structure a personal risk review</li>
      <li>Turn reviews into ongoing advisory relationships</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Why Reviews Matter</h2>
    <p>Risk is not static. A client's situation changes — new job, marriage, children, home purchase, business growth. Each life event creates new risks or changes existing ones. Periodic reviews ensure protection keeps pace.</p>
  </section>

  <section class="lesson-section">
    <h2>Review Frequency</h2>
    <ul>
      <li><strong>Annual review</strong> — Comprehensive check of all coverage</li>
      <li><strong>Life-event review</strong> — When major changes occur (marriage, birth, job change)</li>
      <li><strong>Policy renewal review</strong> — Before existing policies expire</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Review Framework</h2>
    <ol>
      <li>Update client information (income, dependents, assets, liabilities)</li>
      <li>Re-run the CoverScore assessment</li>
      <li>Compare new results with previous</li>
      <li>Identify new gaps and changes in risk profile</li>
      <li>Update recommendations and adjust cover</li>
    </ol>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Reviews are essential because risk profiles change</li>
      <li>Use life events as natural triggers for review conversations</li>
      <li>A structured review framework keeps the process professional</li>
      <li>Reviews deepen client relationships over time</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How do you currently follow up with clients for periodic reviews? What could improve your process?</p>
  </section>
</div>`
  },

  // ═════════════════════════════════════════════════════════════════════════
  // LEVEL 3: SPECIALIZATION — BUSINESS TRACK (modules 22-27, track=BUSINESS)
  // ═════════════════════════════════════════════════════════════════════════

  'sme risk advisory™': {
    video_url: null,
    duration_minutes: 22,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the unique risks facing SMEs</li>
      <li>Learn how to conduct an SME risk assessment</li>
      <li>Recommend comprehensive protection for small businesses</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>SME Risk Landscape</h2>
    <p>Small and medium enterprises are the backbone of the economy, but they are also the most vulnerable to unexpected losses. Unlike large corporations, SMEs often lack the financial reserves to absorb a major loss.</p>
  </section>

  <section class="lesson-section">
    <h2>Key SME Risks</h2>
    <ul>
      <li><strong>Property damage</strong> — Fire, flood, theft affecting premises and stock</li>
      <li><strong>Business interruption</strong> — Loss of income when operations stop</li>
      <li><strong>Liability</strong> — Claims from customers, suppliers, or the public</li>
      <li><strong>Employee risk</strong> — Workplace accidents, key person dependence</li>
      <li><strong>Cyber risk</strong> — Data breaches, ransomware, system failures</li>
      <li><strong>Asset loss</strong> — Theft or damage to equipment, vehicles, inventory</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Advisory Approach</h2>
    <p>SME owners are busy running their businesses. They appreciate advisors who:</p>
    <ul>
      <li>Speak in business terms (revenue, profit, cash flow), not just insurance jargon</li>
      <li>Provide practical risk-reduction advice alongside insurance solutions</li>
      <li>Offer bundled solutions that cover multiple risks</li>
      <li>Follow up and build a long-term relationship</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>SMEs face property, liability, people, and cyber risks</li>
      <li>They are more vulnerable than large businesses to losses</li>
      <li>Speak their language — revenue, operations, cash flow</li>
      <li>Bundled solutions and regular reviews build loyalty</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Think of an SME owner you advised. What was their biggest concern? How did you address it?</p>
  </section>
</div>`
  },

  'school risk advisory™': {
    video_url: null,
    duration_minutes: 20,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the specific risks facing educational institutions</li>
      <li>Learn how to conduct a school risk assessment</li>
      <li>Recommend comprehensive protection for schools</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>School Risk Landscape</h2>
    <p>Schools face a unique combination of risks. They are responsible for the safety of children, employ staff, maintain facilities, operate vehicles, and manage sensitive data — all while operating under regulatory oversight.</p>
  </section>

  <section class="lesson-section">
    <h2>Key School Risks</h2>
    <ul>
      <li><strong>Student safety</strong> — Accidents on playgrounds, during transport, or on premises</li>
      <li><strong>Property damage</strong> — Fire, flood, storm damage to buildings and equipment</li>
      <li><strong>Fleet risk</strong> — School buses and vehicles transporting students</li>
      <li><strong>Liability</strong> — Claims from parents, visitors, or third parties</li>
      <li><strong>Employee risk</strong> — Staff accidents, key person dependence</li>
      <li><strong>Cyber risk</strong> — Student records, financial data, exam systems</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Recommended Solutions</h2>
    <ul>
      <li><strong>Fire & Special Perils</strong> — Buildings, equipment, and contents</li>
      <li><strong>Comprehensive Motor Insurance</strong> — School fleet and buses</li>
      <li><strong>Group Personal Accident</strong> — Students and staff</li>
      <li><strong>Public Liability</strong> — Third-party claims</li>
      <li><strong>Electronic Equipment Insurance</strong> — Computers and lab equipment</li>
      <li><strong>Business Interruption</strong> — Loss of fees if operations are disrupted</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Schools have complex, multi-dimensional risk profiles</li>
      <li>Student safety is the primary concern for parents and regulators</li>
      <li>A comprehensive school protection plan covers property, people, and liability</li>
      <li>Risk-reduction measures (drills, inspections, maintenance) are equally important</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What school risks do you think are most commonly overlooked by school administrators?</p>
  </section>
</div>`
  },

  'church risk advisory™': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the risks specific to religious organisations</li>
      <li>Learn how to advise churches on protection</li>
      <li>Recommend appropriate insurance solutions</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Church Risk Landscape</h2>
    <p>Churches are places of worship, community gathering, and often education. They face property, liability, and people risks — but these are frequently overlooked because churches are seen as "low risk" environments.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Church Risks</h2>
    <ul>
      <li><strong>Fire & Property</strong> — Electrical fires, storm damage, theft</li>
      <li><strong>Liability</strong> — Slips and falls, crowd management, child protection</li>
      <li><strong>People</strong> — Volunteers, staff, congregation members</li>
      <li><strong>Events</strong> — Special gatherings, crusades, conferences</li>
      <li><strong>Assets</strong> — Sound systems, musical instruments, furniture</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Advisory Considerations</h2>
    <p>When advising churches, remember that budget constraints are real. Help prioritise essential cover (fire, liability) first, and build from there. Many church leaders have not considered insurance at all, so education is the first step.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Churches have property, liability, and people risks like any organisation</li>
      <li>Fire and liability cover should be the first priority</li>
      <li>Budget constraints mean prioritisation is critical</li>
      <li>Education is often needed before sale — church leaders may not know the risks</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How would you approach a church leader who says "God will protect us" and sees insurance as unnecessary?</p>
  </section>
</div>`
  },

  'hospital risk advisory™': {
    video_url: null,
    duration_minutes: 20,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the complex risk profile of healthcare facilities</li>
      <li>Learn how to conduct a hospital risk assessment</li>
      <li>Recommend comprehensive solutions for hospitals and clinics</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Hospital Risk Landscape</h2>
    <p>Hospitals are among the most complex risk environments — they combine property, equipment, people, patients, hazardous materials, and professional liability. A single failure can have life-threatening consequences.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Hospital Risks</h2>
    <ul>
      <li><strong>Clinical liability</strong> — Medical malpractice and professional negligence</li>
      <li><strong>Property damage</strong> — Fire, flood, storm affecting critical facilities</li>
      <li><strong>Equipment breakdown</strong> — Life-saving diagnostic and treatment equipment</li>
      <li><strong>People</strong> — Staff accidents, patient safety, visitors</li>
      <li><strong>Business interruption</strong> — Loss of revenue if operations stop</li>
      <li><strong>Data & records</strong> — Patient records, confidentiality, cyber risk</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Recommended Solutions</h2>
    <ul>
      <li><strong>Fire & Special Perils</strong> — Buildings, equipment, stock</li>
      <li><strong>Machinery Breakdown</strong> — Diagnostic and treatment equipment</li>
      <li><strong>Professional Indemnity</strong> — Medical malpractice cover</li>
      <li><strong>Public Liability</strong> — Third-party claims</li>
      <li><strong>Group Personal Accident</strong> — Staff and doctors</li>
      <li><strong>Cyber Insurance</strong> — Patient data protection</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Hospitals have some of the most complex risk profiles</li>
      <li>Clinical liability and equipment breakdown are critical concerns</li>
      <li>A comprehensive approach covers property, equipment, people, and liability</li>
      <li>Regulatory compliance adds another layer of risk</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What hospital risk do you think is most frequently under-insured?</p>
  </section>
</div>`
  },

  'manufacturing risk advisory™': {
    video_url: null,
    duration_minutes: 20,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand risks specific to manufacturing operations</li>
      <li>Learn how to advise manufacturers on protection</li>
      <li>Recommend appropriate industrial insurance solutions</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Manufacturing Risk Landscape</h2>
    <p>Manufacturing involves heavy machinery, raw materials, production processes, and supply chains. The concentration of assets and activity creates significant exposure to fire, equipment failure, and business interruption.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Manufacturing Risks</h2>
    <ul>
      <li><strong>Fire & Explosion</strong> — Combustible materials, electrical faults, chemical reactions</li>
      <li><strong>Machinery Breakdown</strong> — Critical production equipment failure</li>
      <li><strong>Business Interruption</strong> — Revenue loss when production stops</li>
      <li><strong>Property Damage</strong> — Buildings, stock, raw materials</li>
      <li><strong>Environmental Liability</strong> — Pollution, waste disposal</li>
      <li><strong>Supply Chain</strong> — Dependence on key suppliers</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Advisory Approach</h2>
    <p>Manufacturers respond to technical, data-driven conversations. Use production data, asset values, and downtime cost calculations to build your case. Highlight the financial impact of a week of lost production.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Manufacturing has high concentration of risk in one location</li>
      <li>Fire, machinery breakdown, and business interruption are top concerns</li>
      <li>Use production data and downtime cost to make the case</li>
      <li>Preventive maintenance is a critical part of risk reduction</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What would you say to a factory owner who says "We have never had a fire, so we don't need more cover"?</p>
  </section>
</div>`
  },

  'construction risk advisory™': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand risks unique to the construction industry</li>
      <li>Learn about Contractors All Risks (CAR) insurance</li>
      <li>Advise construction firms on comprehensive protection</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Construction Risk Landscape</h2>
    <p>Construction projects involve multiple parties, heavy equipment, hazardous activities, and significant financial stakes. The temporary nature of construction sites creates dynamic risk conditions that change daily.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Construction Risks</h2>
    <ul>
      <li><strong>Property damage</strong> — To the works under construction, materials, and equipment</li>
      <li><strong>Third-party liability</strong> — Injury or damage to the public and neighbouring properties</li>
      <li><strong>Employee safety</strong> — Falls, equipment accidents, site hazards</li>
      <li><strong>Delay in completion</strong> — Financial losses from project delays</li>
      <li><strong>Defects liability</strong> — Faulty workmanship or materials</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Insurance Solutions</h2>
    <ul>
      <li><strong>Contractors All Risks (CAR)</strong> — Covers the works, materials, and equipment</li>
      <li><strong>Public Liability</strong> — Third-party property damage and bodily injury</li>
      <li><strong>Group Personal Accident</strong> — Workers on site</li>
      <li><strong>Advance Loss of Profits</strong> — Delay in completion cover</li>
      <li><strong>Plant & Equipment Insurance</strong> — Construction machinery</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Construction risks change daily as projects progress</li>
      <li>CAR insurance is the primary solution for construction projects</li>
      <li>Multiple parties on site create complex liability scenarios</li>
      <li>Delay cover is often overlooked but financially critical</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What would you include in a construction risk checklist for a new building project?</p>
  </section>
</div>`
  },

  // ═════════════════════════════════════════════════════════════════════════
  // LEVEL 4: CRC™ — Consulting (modules 28-34, track=CORE)
  // ═════════════════════════════════════════════════════════════════════════

  'consultative selling™': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the consultative selling approach</li>
      <li>Learn how to shift from product-selling to solution-selling</li>
      <li>Apply consultative techniques to risk advisory</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Consultative Selling?</h2>
    <p>Consultative selling is a sales approach where the advisor acts as a trusted consultant rather than a product pusher. Instead of leading with a product, you lead with questions, listen carefully, and recommend solutions based on the client's specific needs.</p>
  </section>

  <section class="lesson-section">
    <h2>The Consultative Sales Process</h2>
    <ol>
      <li><strong>Discover</strong> — Ask questions to understand the client's situation</li>
      <li><strong>Diagnose</strong> — Analyse the risks and identify gaps</li>
      <li><strong>Design</strong> — Create a tailored protection plan</li>
      <li><strong>Deliver</strong> — Present the solution with clear rationale</li>
      <li><strong>Deepen</strong> — Follow up and build the relationship</li>
    </ol>
  </section>

  <section class="lesson-section">
    <h2>The Power of Questions</h2>
    <p>Great consultative sellers ask great questions. Open-ended questions (who, what, where, when, why, how) encourage clients to share more information. Closed questions confirm specific details.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Consultative selling is about solving problems, not pushing products</li>
      <li>The five Ds: Discover, Diagnose, Design, Deliver, Deepen</li>
      <li>Questions are your most powerful tool</li>
      <li>Clients trust advisors who listen first and sell second</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Think of a recent client interaction. How could you have used more open-ended questions?</p>
  </section>
</div>`
  },

  'risk advisory framework™': {
    video_url: null,
    duration_minutes: 17,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Learn the structured CoverScore advisory framework</li>
      <li>Apply the framework consistently across client engagements</li>
      <li>Deliver a professional, repeatable advisory experience</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>The Advisory Framework</h2>
    <p>The CoverScore Advisory Framework provides a structured approach for every client engagement:</p>
    <ol>
      <li><strong>Engage</strong> — Build rapport and set expectations</li>
      <li><strong>Assess</strong> — Run the CoverScore assessment</li>
      <li><strong>Analyse</strong> — Interpret results and identify priorities</li>
      <li><strong>Recommend</strong> — Present tailored solutions</li>
      <li><strong>Implement</strong> — Place cover and set up policies</li>
      <li><strong>Review</strong> — Schedule follow-up and periodic reviews</li>
    </ol>
  </section>

  <section class="lesson-section">
    <h2>Framework Benefits</h2>
    <ul>
      <li>Consistency across all client engagements</li>
      <li>Professionalism and credibility</li>
      <li>Clear expectations for the client</li>
      <li>Measurable outcomes and accountability</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>A structured framework ensures consistent, professional service</li>
      <li>Every client engagement follows the same six steps</li>
      <li>The framework builds trust and accountability</li>
      <li>Adapt the framework to the client's context without skipping steps</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Which step of the advisory framework do you find most challenging? Why?</p>
  </section>
</div>`
  },

  'risk improvement roadmaps™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand how to create a risk improvement roadmap</li>
      <li>Learn to prioritise improvements by impact and urgency</li>
      <li>Present roadmaps that clients can act on</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is a Risk Improvement Roadmap?</h2>
    <p>A risk improvement roadmap is a step-by-step plan that shows a client how to move from their current risk posture to their desired state. It prioritises actions by impact and urgency, and includes timelines, costs, and expected outcomes.</p>
  </section>

  <section class="lesson-section">
    <h2>Creating the Roadmap</h2>
    <ol>
      <li>Define the current state (from assessment results)</li>
      <li>Define the target state (what "protected" looks like)</li>
      <li>List all recommended actions</li>
      <li>Prioritise by: urgency, impact, cost, dependency</li>
      <li>Assign timelines and responsibilities</li>
      <li>Define success metrics</li>
    </ol>
  </section>

  <section class="lesson-section">
    <h2>Presenting the Roadmap</h2>
    <p>Use a visual timeline. Show quick wins in the first month, medium-term improvements in 3-6 months, and strategic changes in 6-12 months. Celebrate progress at each review.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>A roadmap turns assessment results into an actionable plan</li>
      <li>Prioritise improvements by urgency, impact, and cost</li>
      <li>Use a visual timeline with clear milestones</li>
      <li>Celebrate progress to keep clients engaged</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How would you create a roadmap for a client with limited budget? Which improvements would you prioritise first?</p>
  </section>
</div>`
  },

  'business continuity™': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the importance of business continuity planning</li>
      <li>Learn the components of a business continuity plan (BCP)</li>
      <li>Advise clients on continuity and recovery</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Business Continuity?</h2>
    <p>Business continuity is the capability of an organisation to continue delivering products or services at acceptable levels following a disruptive incident. It is about being prepared, not just insured.</p>
  </section>

  <section class="lesson-section">
    <h2>Key BCP Components</h2>
    <ul>
      <li><strong>Risk Assessment</strong> — Identify what could disrupt operations</li>
      <li><strong>Business Impact Analysis</strong> — Determine the financial impact of disruption</li>
      <li><strong>Recovery Strategies</strong> — How to restore operations</li>
      <li><strong>Plan Documentation</strong> — Written procedures for different scenarios</li>
      <li><strong>Testing & Review</strong> — Regular drills and updates</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Your Role</h2>
    <p>As a risk advisor, you can help clients understand the importance of business continuity. While you may not write the full BCP, you can point them to resources, ask the right questions, and ensure their insurance aligns with their continuity needs.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Business continuity is about keeping operations going after a disruption</li>
      <li>A BCP goes beyond insurance — it covers processes, people, and technology</li>
      <li>Help clients understand the financial impact of downtime</li>
      <li>Insurance and continuity planning work together</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>If one of your business clients lost their premises today, how long would it take them to resume operations?</p>
  </section>
</div>`
  },

  'enterprise risk concepts™': {
    video_url: null,
    duration_minutes: 17,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand Enterprise Risk Management (ERM) concepts</li>
      <li>Learn how ERM applies to SME and organisational clients</li>
      <li>Integrate ERM thinking into your advisory practice</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is ERM?</h2>
    <p>Enterprise Risk Management is a holistic approach to managing all of an organisation's risks — not just insurable risks. It considers strategic, operational, financial, and compliance risks alongside traditional hazard risks.</p>
  </section>

  <section class="lesson-section">
    <h2>ERM Framework</h2>
    <ul>
      <li><strong>Governance & Culture</strong> — Leadership commitment to risk management</li>
      <li><strong>Strategy & Objective Setting</strong> — Aligning risk appetite with strategy</li>
      <li><strong>Performance</strong> — Identifying and assessing risks that affect performance</li>
      <li><strong>Review & Revision</strong> — Monitoring and improving risk management</li>
      <li><strong>Information & Communication</strong> — Reporting and transparency</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Bringing ERM to Your Clients</h2>
    <p>Even small businesses benefit from ERM thinking. Help them see how different risks connect. For example, a fire (hazard risk) affects revenue (strategic risk) and may trigger loan covenants (financial risk).</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>ERM considers all risks, not just insurable ones</li>
      <li>It connects strategic, operational, financial, and compliance risks</li>
      <li>ERM thinking elevates your advisory from transactional to strategic</li>
      <li>Even small clients benefit from a holistic risk view</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How would you explain the value of ERM thinking to a business owner who only calls you when they need a policy?</p>
  </section>
</div>`
  },

  'strategic protection planning™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand strategic protection planning for organisations</li>
      <li>Learn how to align protection strategies with business goals</li>
      <li>Advise at a strategic level, not just transactional</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Strategic vs. Transactional Advisory</h2>
    <p>Transactional advisory is reactive — the client needs a policy, you provide a quote. Strategic advisory is proactive — you understand the client's business goals and design protection that supports those goals.</p>
  </section>

  <section class="lesson-section">
    <h2>Aligning Protection with Goals</h2>
    <p>Each business goal has protection implications:</p>
    <ul>
      <li><strong>Growth goal</strong> — Need for adequate property and liability cover as operations expand</li>
      <li><strong>Funding goal</strong> — Lenders require specific insurance</li>
      <li><strong>Succession goal</strong> — Key person cover, buy-sell funding</li>
      <li><strong>Compliance goal</strong> — Regulatory and contractual insurance requirements</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Strategic advisory aligns protection with business goals</li>
      <li>Understand the client's objectives before recommending solutions</li>
      <li>Protection supports growth, funding, succession, and compliance</li>
      <li>Strategic advisors earn higher trust and long-term relationships</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Think of a business client. What are their top three business goals? How does their current protection support these goals?</p>
  </section>
</div>`
  },

  'executive presentation skills™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Develop skills for presenting to executives and decision-makers</li>
      <li>Learn how to structure a compelling risk presentation</li>
      <li>Handle tough questions with confidence</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Presenting to Executives</h2>
    <p>Executives are time-poor and results-focused. They want concise, data-driven presentations that get straight to the point. Your presentation should answer: What is the problem? Why does it matter? What should we do?</p>
  </section>

  <section class="lesson-section">
    <h2>Presentation Structure</h2>
    <ol>
      <li><strong>The Hook</strong> — Start with a compelling fact or question</li>
      <li><strong>The Problem</strong> — What risk exists and what is at stake</li>
      <li><strong>The Evidence</strong> — Data from the assessment and analysis</li>
      <li><strong>The Solution</strong> — Clear recommendation with options</li>
      <li><strong>The Ask</strong> — What decision or action you need</li>
    </ol>
  </section>

  <section class="lesson-section">
    <h2>Handling Tough Questions</h2>
    <ul>
      <li>Listen fully before answering</li>
      <li>Acknowledge the question and thank the person</li>
      <li>If you don't know, say so — and offer to find out</li>
      <li>Bridge back to your core message</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Executives want concise, data-driven presentations</li>
      <li>Structure: Hook → Problem → Evidence → Solution → Ask</li>
      <li>Handling questions well builds credibility</li>
      <li>Confidence comes from preparation</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What is the most challenging question a client has asked you? How did you handle it?</p>
  </section>
</div>`
  },

  // ═════════════════════════════════════════════════════════════════════════
  // LEVEL 5: CISA™ — AI & Data (modules 35-40, track=CORE)
  // ═════════════════════════════════════════════════════════════════════════

  'ai risk intelligence™': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand how AI is transforming risk intelligence</li>
      <li>Learn to leverage AI tools in your advisory practice</li>
      <li>Stay ahead of the curve on AI-driven risk insights</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>AI in Risk Intelligence</h2>
    <p>Artificial intelligence is revolutionising how we understand and manage risk. AI can process vast amounts of data, identify patterns humans might miss, and generate insights at unprecedented speed. CoverScore integrates AI throughout the advisory process.</p>
  </section>

  <section class="lesson-section">
    <h2>Key AI Applications</h2>
    <ul>
      <li><strong>Pattern Recognition</strong> — Identifying risk patterns across industries and geographies</li>
      <li><strong>Predictive Analytics</strong> — Forecasting potential risk events</li>
      <li><strong>Natural Language Processing</strong> — Understanding client communication and sentiment</li>
      <li><strong>Recommendation Engines</strong> — Personalised risk improvement suggestions</li>
      <li><strong>Benchmarking</strong> — Comparing client profiles against similar entities</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Staying Ahead</h2>
    <p>AI is evolving rapidly. Stay current by:</p>
    <ul>
      <li>Exploring new CoverScore AI features as they launch</li>
      <li>Understanding the data that powers AI recommendations</li>
      <li>Maintaining a healthy scepticism — always validate AI outputs</li>
      <li>Thinking about ethical implications of AI in advisory</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>AI enhances risk intelligence through pattern recognition and predictive analytics</li>
      <li>AI tools make advisors more effective, not obsolete</li>
      <li>Always validate AI outputs with your professional judgment</li>
      <li>Stay current with AI developments in risk advisory</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How could AI help you serve your clients better? What concerns do you have about AI in advisory?</p>
  </section>
</div>`
  },

  'industry benchmarking™': {
    video_url: null,
    duration_minutes: 15,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand how industry benchmarking works</li>
      <li>Learn to use benchmark data in client conversations</li>
      <li>Help clients see where they stand relative to peers</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Benchmarking?</h2>
    <p>Benchmarking compares a client's risk profile against others in the same industry, size category, or geography. It answers the question: "How do we compare to similar organisations?"</p>
  </section>

  <section class="lesson-section">
    <h2>Using Benchmarks in Advisory</h2>
    <p>Benchmarks are powerful motivators. A school that scores 45 on fire safety might not feel urgency until they learn that the industry average is 72. Use benchmarks to:</p>
    <ul>
      <li>Create awareness of relative risk posture</li>
      <li>Justify recommendations with peer comparison data</li>
      <li>Track improvement over time against industry trends</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Benchmarking shows clients how they compare to peers</li>
      <li>Peer comparison is a powerful motivator for action</li>
      <li>Use benchmarks constructively, not to shame</li>
      <li>Track improvement against benchmarks over time</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How would you present benchmark data to a client who is below industry average without discouraging them?</p>
  </section>
</div>`
  },

  'predictive risk thinking™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Develop predictive risk thinking skills</li>
      <li>Learn to anticipate risks before they materialise</li>
      <li>Use foresight to strengthen client protection plans</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Predictive Risk Thinking?</h2>
    <p>Predictive risk thinking is the ability to anticipate what could go wrong and prepare for it before it happens. It combines data analysis, pattern recognition, scenario planning, and professional intuition.</p>
  </section>

  <section class="lesson-section">
    <h2>Techniques for Predictive Thinking</h2>
    <ul>
      <li><strong>Scenario Analysis</strong> — Walk through "what if" scenarios systematically</li>
      <li><strong>Trend Analysis</strong> — Identify emerging risks from industry data</li>
      <li><strong>Near-Miss Review</strong> — Learn from incidents that almost happened</li>
      <li><strong>Horizon Scanning</strong> — Monitor regulatory, economic, and environmental changes</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Predictive thinking anticipates risks before they occur</li>
      <li>Use scenarios, trends, near-misses, and horizon scanning</li>
      <li>Foresight is what separates great advisors from good ones</li>
      <li>Encourage clients to think ahead, not just react</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What emerging risk do you see affecting your clients in the next 2-3 years? How are you preparing them?</p>
  </section>
</div>`
  },

  'coverscore copilot™': {
    video_url: null,
    duration_minutes: 15,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the CoverScore Copilot tool</li>
      <li>Learn how to use Copilot effectively in client interactions</li>
      <li>Integrate AI-assisted conversations into your workflow</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is CoverScore Copilot?</h2>
    <p>CoverScore Copilot is an AI-powered assistant that helps you prepare for client conversations, generate proposals, answer risk questions, and provide instant insights. It is your always-on advisory partner.</p>
  </section>

  <section class="lesson-section">
    <h2>Copilot Capabilities</h2>
    <ul>
      <li><strong>Risk Explanation</strong> — Explain complex risk concepts in simple terms</li>
      <li><strong>Recommendation Drafting</strong> — Generate personalised recommendation summaries</li>
      <li><strong>Objection Handling</strong> — Get suggestions for common client objections</li>
      <li><strong>Proposal Generation</strong> — Create professional proposals quickly</li>
      <li><strong>Knowledge Base</strong> — Access CoverScore product and risk information</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Best Practices</h2>
    <ul>
      <li>Use Copilot for preparation, not during live conversation (unless appropriate)</li>
      <li>Always review and personalise Copilot-generated content</li>
      <li>Ask specific questions for better responses</li>
      <li>Provide feedback to improve Copilot over time</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Copilot is your AI advisory assistant</li>
      <li>Use it for preparation, drafts, and knowledge access</li>
      <li>Always review and personalise AI-generated output</li>
      <li>The more specific your questions, the better the responses</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How could Copilot save you time in your daily advisory work? What would you use it for most?</p>
  </section>
</div>`
  },

  'risk analytics™': {
    video_url: null,
    duration_minutes: 17,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand the role of data analytics in risk advisory</li>
      <li>Learn to interpret risk data and draw actionable insights</li>
      <li>Use analytics to strengthen client recommendations</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Data-Driven Advisory</h2>
    <p>Risk advisory is increasingly data-driven. Analytics helps you move from opinion-based to evidence-based recommendations. When you show a client that their risk of a particular loss is X% based on data, you are more credible.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Analytics Concepts</h2>
    <ul>
      <li><strong>Descriptive Analytics</strong> — What happened? (historical risk data)</li>
      <li><strong>Diagnostic Analytics</strong> — Why did it happen? (root cause analysis)</li>
      <li><strong>Predictive Analytics</strong> — What could happen? (forecasting models)</li>
      <li><strong>Prescriptive Analytics</strong> — What should we do? (recommendation engines)</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Using Analytics with Clients</h2>
    <p>Present analytics visually — charts, graphs, and dashboards. Avoid overwhelming clients with raw data. Focus on the 2-3 key insights that drive action. Explain what the data means, not just what it shows.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Data analytics makes your advisory evidence-based</li>
      <li>Understand descriptive, diagnostic, predictive, and prescriptive analytics</li>
      <li>Use visuals to communicate insights effectively</li>
      <li>Focus on actionable insights, not data overload</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What data do you currently use in your client conversations? How could you use more?</p>
  </section>
</div>`
  },

  'data-driven advisory™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Master the art of data-driven client conversations</li>
      <li>Learn how to present data without overwhelming clients</li>
      <li>Use data to build trust and drive decisions</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>The Data-Driven Advisor</h2>
    <p>A data-driven advisor uses facts, figures, and analysis to support every recommendation. This approach builds credibility, reduces objections, and helps clients make informed decisions. But data must be balanced with empathy and human judgment.</p>
  </section>

  <section class="lesson-section">
    <h2>Data Presentation Principles</h2>
    <ul>
      <li><strong>Know your audience</strong> — Some clients love data; others find it intimidating</li>
      <li><strong>Tell a story</strong> — Use data to support a narrative, not replace it</li>
      <li><strong>Use comparisons</strong> — "Your score of 45 is below the industry average of 72"</li>
      <li><strong>Show progress</strong> — "If you implement these three changes, your score could reach 68"</li>
      <li><strong>Keep it simple</strong> — One clear chart is better than five complex ones</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Data-driven advisory builds credibility and trust</li>
      <li>Adapt your data presentation to the client's comfort level</li>
      <li>Use data to tell stories and show potential improvement</li>
      <li>Balance data with empathy — clients are people, not numbers</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How do you currently use data in your conversations? Where could you improve?</p>
  </section>
</div>`
  },

  // ═════════════════════════════════════════════════════════════════════════
  // LEVEL 6: CMRA™ — Mastery (modules 41-47, track=CORE)
  // ═════════════════════════════════════════════════════════════════════════

  'strategic risk leadership™': {
    video_url: null,
    duration_minutes: 20,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Develop strategic risk leadership skills</li>
      <li>Learn to influence organisational risk culture</li>
      <li>Position yourself as a trusted strategic advisor</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Strategic Risk Leadership?</h2>
    <p>Strategic risk leadership is the ability to guide organisations in making risk-informed decisions at the highest level. It goes beyond placing insurance to influencing how the organisation thinks about and manages risk.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Leadership Competencies</h2>
    <ul>
      <li><strong>Vision</strong> — See the big picture of risk across the organisation</li>
      <li><strong>Influence</strong> — Persuade decision-makers to prioritise risk management</li>
      <li><strong>Communication</strong> — Translate risk concepts into business language</li>
      <li><strong>Collaboration</strong> — Work with other advisors (legal, finance, operations)</li>
      <li><strong>Integrity</strong> — Model ethical risk-taking and transparency</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Elevating Your Role</h2>
    <p>To move from transactional advisor to strategic leader, you must:</p>
    <ul>
      <li>Understand the client's business model and strategy</li>
      <li>Speak the language of the boardroom (ROI, risk appetite, materiality)</li>
      <li>Provide insights that go beyond insurance recommendations</li>
      <li>Build relationships with C-suite and board-level decision-makers</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Strategic risk leadership influences how organisations manage risk</li>
      <li>Build vision, influence, communication, and collaboration skills</li>
      <li>Understand business strategy to provide relevant risk insights</li>
      <li>Strategic leaders earn C-suite trust and long-term engagement</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What steps can you take to move from a transactional advisor to a strategic partner for your most important clients?</p>
  </section>
</div>`
  },

  'risk transformation™': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand what risk transformation means</li>
      <li>Learn how to guide organisations through risk maturity journeys</li>
      <li>Help clients evolve from reactive to proactive risk management</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Risk Transformation?</h2>
    <p>Risk transformation is the process of moving an organisation from a reactive, siloed approach to risk management to a proactive, integrated, and strategic approach. It is a journey, not a destination.</p>
  </section>

  <section class="lesson-section">
    <h2>Risk Maturity Model</h2>
    <ul>
      <li><strong>Level 1: Reactive</strong> — No formal risk management; responds after losses</li>
      <li><strong>Level 2: Aware</strong> — Basic risk identification; some insurance in place</li>
      <li><strong>Level 3: Structured</strong> — Formal risk framework; regular assessments</li>
      <li><strong>Level 4: Integrated</strong> — Risk management embedded in decision-making</li>
      <li><strong>Level 5: Strategic</strong> — Risk intelligence drives competitive advantage</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Your Role in Transformation</h2>
    <p>As a master advisor, you help clients move up the maturity curve. Each level of maturity requires different conversations, tools, and solutions. Your ability to assess where a client is and guide them forward is a key skill.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Risk transformation moves organisations from reactive to strategic</li>
      <li>The five-level maturity model helps assess where a client is</li>
      <li>Guide clients step by step — don't try to jump multiple levels</li>
      <li>Each level requires a different advisory approach</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Where are most of your clients on the risk maturity model? How could you help them move to the next level?</p>
  </section>
</div>`
  },

  'risk culture development™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand what risk culture is and why it matters</li>
      <li>Learn how to assess and influence organisational risk culture</li>
      <li>Help clients build a culture of risk awareness</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Risk Culture?</h2>
    <p>Risk culture is the set of shared values, beliefs, and behaviours that shape how an organisation understands and manages risk. A strong risk culture means that everyone — from the board to the frontline — thinks about risk as part of their daily work.</p>
  </section>

  <section class="lesson-section">
    <h2>Signs of Strong vs. Weak Risk Culture</h2>
    <table class="lesson-table">
      <tr><th>Strong Risk Culture</th><th>Weak Risk Culture</th></tr>
      <tr><td>Open discussion of risks and near-misses</td><td>Risks hidden; blame culture</td></tr>
      <tr><td>Risk considered in all major decisions</td><td>Risk an afterthought</td></tr>
      <tr><td>Regular training and awareness</td><td>No risk training</td></tr>
      <tr><td>Leadership models risk awareness</td><td>Leadership ignores risk</td></tr>
    </table>
  </section>

  <section class="lesson-section">
    <h2>Building Risk Culture</h2>
    <ul>
      <li>Start with leadership commitment</li>
      <li>Make risk part of regular communication</li>
      <li>Celebrate good risk decisions, not just good outcomes</li>
      <li>Learn from incidents without blame</li>
      <li>Recognise and reward risk awareness</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Risk culture is how an organisation thinks about and handles risk</li>
      <li>Strong culture reduces losses and improves decision-making</li>
      <li>Culture change starts with leadership</li>
      <li>Advisors can influence culture through conversations and examples</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>How would you assess the risk culture of a client organisation? What questions would you ask?</p>
  </section>
</div>`
  },

  'advanced advisory™': {
    video_url: null,
    duration_minutes: 18,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Master advanced advisory techniques</li>
      <li>Learn to handle complex multi-risk client situations</li>
      <li>Deliver comprehensive, integrated protection strategies</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Advanced Advisory Defined</h2>
    <p>Advanced advisory is the ability to handle complex client situations that involve multiple risk categories, stakeholders, and solution providers. It requires deep knowledge, strategic thinking, and excellent coordination skills.</p>
  </section>

  <section class="lesson-section">
    <h2>Complex Situations</h2>
    <ul>
      <li><strong>Multi-site organisations</strong> — Different locations, different risk profiles</li>
      <li><strong>Multi-line programs</strong> — Coordinating property, liability, people, and specialty cover</li>
      <li><strong>Regulatory environments</strong> — Navigating compliance requirements</li>
      <li><strong>Claims advocacy</strong> — Representing clients in complex claims</li>
      <li><strong>Cross-border exposures</strong> — Clients with international operations</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Advisory Best Practices</h2>
    <ul>
      <li>Build a team of specialists for different risk areas</li>
      <li>Document everything — risk analysis, recommendations, decisions</li>
      <li>Communicate clearly and frequently with all stakeholders</li>
      <li>Review and adjust strategies regularly</li>
      <li>Stay humble — complex situations require continuous learning</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Advanced advisory handles complex, multi-risk situations</li>
      <li>Build specialist networks for different risk areas</li>
      <li>Documentation and communication are critical</li>
      <li>Continuous learning is essential at the mastery level</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What is the most complex client situation you have handled? What did you learn from it?</p>
  </section>
</div>`
  },

  'thought leadership™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand what thought leadership means in risk advisory</li>
      <li>Learn how to build your personal brand as a risk expert</li>
      <li>Share knowledge and influence the industry</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Thought Leadership?</h2>
    <p>Thought leadership means being recognised as an authority in your field. Thought leaders shape conversations, influence practices, and are sought after for their insights. In risk advisory, thought leaders are the ones others turn to for guidance.</p>
  </section>

  <section class="lesson-section">
    <h2>Building Your Brand</h2>
    <ul>
      <li><strong>Content creation</strong> — Write articles, posts, or newsletters about risk</li>
      <li><strong>Speaking</strong> — Present at industry events and webinars</li>
      <li><strong>Networking</strong> — Connect with other professionals and share ideas</li>
      <li><strong>Social media</strong> — Share insights on LinkedIn and other platforms</li>
      <li><strong>Mentoring</strong> — Help develop the next generation of advisors</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Thought Leadership Topics</h2>
    <p>Write about what you know best: risk in specific industries, emerging risks, the value of risk intelligence, or lessons from client work. Authenticity matters more than perfection.</p>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Thought leadership builds your reputation and influence</li>
      <li>Share your knowledge through content, speaking, and mentoring</li>
      <li>Authenticity and consistency matter more than perfection</li>
      <li>Thought leaders shape the industry and attract top clients</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>What unique perspective or experience could you share to establish yourself as a thought leader in risk advisory?</p>
  </section>
</div>`
  },

  'coaching & mentorship™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Develop coaching and mentorship skills</li>
      <li>Learn how to guide junior advisors effectively</li>
      <li>Build a culture of continuous learning</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Why Coaching Matters</h2>
    <p>As a master-level advisor, your knowledge and experience are valuable assets. Coaching and mentoring help you pass on these assets to the next generation, strengthening your organisation and the profession as a whole.</p>
  </section>

  <section class="lesson-section">
    <h2>Coaching vs. Mentoring</h2>
    <ul>
      <li><strong>Coaching</strong> — Focused on specific skills and performance improvement</li>
      <li><strong>Mentoring</strong> — Broader career guidance and personal development</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Effective Coaching Techniques</h2>
    <ul>
      <li>Ask questions rather than giving answers</li>
      <li>Provide constructive feedback regularly</li>
      <li>Set clear goals and review progress</li>
      <li>Celebrate wins and learn from setbacks</li>
      <li>Lead by example</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Coaching and mentoring develop the next generation</li>
      <li>Coaching is skill-focused; mentoring is career-focused</li>
      <li>Ask questions, provide feedback, and lead by example</li>
      <li>Teaching others deepens your own understanding</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>Think of someone who mentored you. What made their mentorship valuable? How can you provide similar value to others?</p>
  </section>
</div>`
  },

  'academy facilitation™': {
    video_url: null,
    duration_minutes: 16,
    content_html: `
<div class="lesson-content">
  <section class="lesson-section">
    <h2>Learning Objectives</h2>
    <ul>
      <li>Understand how to facilitate academy training sessions</li>
      <li>Learn facilitation techniques for engaging adult learners</li>
      <li>Prepare to deliver CoverScore Academy content effectively</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>What Is Facilitation?</h2>
    <p>Facilitation is the art of guiding a group learning experience. Unlike teaching, where the instructor presents information, facilitation focuses on drawing out participants' knowledge and experience while introducing new concepts.</p>
  </section>

  <section class="lesson-section">
    <h2>Adult Learning Principles</h2>
    <ul>
      <li><strong>Relevance</strong> — Adults need to know why they are learning something</li>
      <li><strong>Experience</strong> — Connect new concepts to learners' existing experience</li>
      <li><strong>Autonomy</strong> — Allow learners to direct their own learning</li>
      <li><strong>Practicality</strong> — Focus on immediately applicable knowledge</li>
      <li><strong>Respect</strong> — Treat learners as peers, not empty vessels</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Facilitation Techniques</h2>
    <ul>
      <li>Use real-world scenarios and case studies</li>
      <li>Encourage discussion and peer learning</li>
      <li>Ask open-ended questions</li>
      <li>Use visual aids and interactive exercises</li>
      <li>Provide regular summaries and check for understanding</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Key Takeaways</h2>
    <ul>
      <li>Facilitation guides learning; it is not the same as teaching</li>
      <li>Adult learners need relevance, respect, and practical application</li>
      <li>Use scenarios, questions, and discussion to engage participants</li>
      <li>Your goal is to empower others, not to impress them</li>
    </ul>
  </section>

  <section class="lesson-section">
    <h2>Reflection</h2>
    <p>If you were to facilitate a session on risk advisory, what is one technique you would use to keep participants engaged?</p>
  </section>
</div>`
  }
};

// ---------------------------------------------------------------------------
// Run the seed
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding academy module content...\n');

  // Ensure columns exist
  const addCol = (sql) => new Promise(resolve => {
    db.run(sql, (err) => { if (err && !err.message.includes('duplicate')) console.log('Column note:', err.message); resolve(); });
  });
  await addCol("ALTER TABLE academy_modules ADD COLUMN duration_minutes INTEGER DEFAULT 15");
  await addCol("ALTER TABLE academy_modules ADD COLUMN video_url TEXT");

  // First, get all existing modules
  const modules = await new Promise((resolve, reject) => {
    db.all('SELECT id, level_id, title, order_index, track FROM academy_modules ORDER BY level_id, order_index', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  console.log(`Found ${modules.length} modules in database\n`);

  let updated = 0;
  let skipped = 0;

  // Build normalized CONTENT lookup (strip ™/® from keys)
  const contentByNormalizedKey = {};
  for (const k of Object.keys(CONTENT)) {
    const nk = k.toLowerCase().replace(/[™®]/g, '').trim();
    contentByNormalizedKey[nk] = CONTENT[k];
  }

  for (const mod of modules) {
    const lookupKey = mod.title.toLowerCase().replace(/[™®]/g, '').trim();
    const content = contentByNormalizedKey[lookupKey];

    if (content) {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE academy_modules SET content = ?, video_url = ?, duration_minutes = ? WHERE id = ?',
          [
            content.content_html,
            content.video_url,
            content.duration_minutes,
            mod.id
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log(`  ✓ [L${mod.level_id}] "${mod.title}" — ${content.duration_minutes} min`);
      updated++;
    } else {
      console.log(`  ✗ [L${mod.level_id}] "${mod.title}" — NO CONTENT FOUND`);
      skipped++;
    }
  }

  console.log(`\nDone. ${updated} modules updated, ${skipped} skipped.`);

  db.close();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
