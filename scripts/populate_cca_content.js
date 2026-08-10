/**
 * Populate full lesson content for all 60 CCA v3 lessons (modules 50-109).
 * Run: node scripts/populate_cca_content.js
 * Safe to run multiple times — UPDATE only, no INSERT.
 */

const sqlite3 = require('sqlite3');
const path = require('path');
const DB_PATH = path.join(__dirname, '..', 'data', 'coverscore.db');
const db = new sqlite3.Database(DB_PATH);
db.configure("busyTimeout", 10000);

const A = (sql) => new Promise((resolve, reject) => {
  db.all(sql, [], function(err, rows) {
    if (err) reject(err);
    else resolve(rows);
  });
});
const G = (sql) => new Promise((resolve, reject) => {
  db.get(sql, [], function(err, row) {
    if (err) reject(err);
    else resolve(row);
  });
});
const R = (sql, params) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve();
  });
});

// ── Content Builders ────────────────────────────────────────────
function hContent(title, obj, sections, ta) {
  const o = obj.map(o=>`<li>${o}</li>`).join('');
  const s = sections.map(s=>{
    if (s.t==='t') return `<section class="lesson-section"><h2>${s.h}</h2>${s.b||''}<table class="lesson-table"><tr>${s.hd.map(c=>`<th>${c}</th>`).join('')}</tr>${s.r.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>${s.a||''}</section>`;
    if (s.t==='c') return `<section class="lesson-section"><div class="callout-box" style="background:#f5f3ff;border-left:3px solid #7c3aed;padding:12px;border-radius:6px;margin:12px 0;"><p style="margin:0;font-size:12px;color:#1e293b;font-weight:600;">${s.b}</p></div></section>`;
    if (s.t==='l') return `<section class="lesson-section"><h2>${s.h}</h2>${s.i||''}<ul>${s.l.map(i=>`<li><strong>${i.l}</strong> — ${i.d}</li>`).join('')}</ul></section>`;
    if (s.t==='ol') return `<section class="lesson-section"><h2>${s.h}</h2>${s.i||''}<ol>${s.l.map(i=>`<li>${i}</li>`).join('')}</ol></section>`;
    return `<section class="lesson-section"><h2>${s.h}</h2>${s.b?`<p>${s.b}</p>`:''}${s.x||''}</section>`;
  }).join('');
  return `<div class="lesson-content"><section class="lesson-section"><h2>Learning Objectives</h2><ul>${o}</ul></section>${s}<section class="lesson-section"><h2>Key Takeaways</h2><ul>${ta.map(t=>`<li>${t}</li>`).join('')}</ul></section></div>`;
}

function hQuiz(qs) {
  return JSON.stringify(qs.map((q,i)=>({id:i+1,type:q.ty||'multiple-choice',question:q.q,options:q.o,correctIndex:q.ci,explanation:q.e})));
}

function hScript(title, ps) { return `Title: ${title}\n\n${ps.join('\n\n')}`; }

function hWorkbook(exs) {
  return `<div class="workbook-content"><h3 style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 12px 0;">Lesson Workbook</h3>${exs.map((e,i)=>`
    <div class="wb-exercise" style="margin-bottom:16px;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9;">
      <h4 style="font-size:12px;font-weight:700;color:#0f172a;margin:0 0 6px 0;">Exercise ${i+1}: ${e.t}</h4>
      <p style="font-size:11px;color:#64748b;margin:0 0 8px 0;">${e.i}</p>
      ${e.p?e.p.map(p=>`<p style="font-size:11px;color:#475569;font-weight:600;margin:0 0 3px 0;">• ${p}</p>`).join(''):''}
      <div style="margin-top:8px;border:1px dashed #cbd5e1;border-radius:4px;padding:20px;text-align:center;"><span style="font-size:10px;color:#94a3b8;">Write your notes here</span></div>
    </div>`).join('')}</div>`;
}

function hCase(title, scenario, tasks) {
  return `<div class="case-study"><h3 style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 4px 0;">${title}</h3><p style="font-size:11px;color:#64748b;line-height:1.6;margin:0 0 12px 0;">${scenario}</p><h4 style="font-size:12px;font-weight:700;color:#0f172a;margin:0 0 6px 0;">Your Tasks</h4><ol>${tasks.map(t=>`<li style="font-size:11px;color:#475569;font-weight:500;margin-bottom:4px;">${t}</li>`).join('')}</ol></div>`;
}

function hResources(arr) { return JSON.stringify(arr); }

function L(c, q, vs, wb, cs, r) {
  return { c, q, vs, wb, cs, r };
}

// ── S = section helpers ─────────────────────────────────────────
const P = (b) => ({h:'',b}); // plain paragraph section
const SE = (h,b) => ({h,b}); // section with heading
const T = (h,hd,r,a) => ({t:'t',h,hd,r,a: a||''}); // table
const C = (b) => ({t:'c',b}); // callout
const Ls = (h,l,i) => ({t:'l',h,l,i:i||''}); // list
const OL = (h,l,i) => ({t:'ol',h,l,i:i||''}); // ordered list
const Q = (q,o,ci,e,ty) => ({q,o,ci,e,ty}); // quiz question

// ═══════════════════════════════════════════════════════════════════
// COURSE 1: CCA-101 — Foundations of Risk & Insurance (8 lessons)
// ═══════════════════════════════════════════════════════════════════

const C1 = {};

C1[1] = L(null, null,
  hScript('What Is Risk? — The Foundation of Protection', [
    'Risk is the possibility that an event will occur and cause a negative financial outcome. Every individual, family, and business faces risk daily — the question is whether they are prepared.',
    'Risk differs from uncertainty. With risk, probabilities can be estimated based on data. Uncertainty involves unknown probabilities. Insurance deals with risk, not uncertainty.',
    'As a CoverScore advisor, your role is to help clients recognise their risks before they materialise. With fewer than 5% of Nigerian adults having life assurance, the protection gap is massive — and so is the opportunity to make a difference.'
  ]),
  hWorkbook([
    {t:'Risk Identification',i:'List 5 risks you personally face daily. Categorise each as pure or speculative risk.',p:['What makes each risk pure or speculative?','Which are insurable and why?']},
    {t:'Client Scenario Analysis',i:'Think of a client you worked with. What risks did they face? Which were protected and which were not?',p:['What was the financial impact of unprotected risks?','How could proactive risk awareness have changed the outcome?']}
  ]),
  hCase('Case Study: The Unprepared Business Owner','Mr. Adebayo runs a furniture workshop in Lagos with 12 employees. He has never had insurance because "nothing bad has happened." Last week, a fire from faulty wiring destroyed raw materials worth ₦4M and customer furniture worth ₦1.5M.',[
    'Identify all risks Mr. Adebayo was exposed to before the fire.',
    'Calculate the total financial loss from this incident.',
    'Explain how each risk could have been transferred through insurance.',
    'Draft a conversation opening that would help Mr. Adebayo see the value of insurance going forward.'
  ]),
  hResources([
    {url:'https://naicom.gov.ng',type:'link',title:'NAICOM — National Insurance Commission',description:'Official regulatory body for insurance in Nigeria'},
    {url:'#',type:'pdf',title:'Risk Fundamentals Reference Sheet',description:'One-page summary of key risk concepts'}
  ])
);

C1[2] = L(
  hContent('Types of Risk — Pure vs Speculative',[
    'Distinguish pure risk from speculative risk',
    'Identify which risk types are insurable',
    'Apply risk classification to real client scenarios'
  ],[
    SE('Pure Risk Defined','Pure risk involves situations with only the possibility of loss or no loss — no chance of gain. These are the risks insurance protects against: fire, accident, illness, death.'),
    SE('Speculative Risk Defined','Speculative risk involves potential gain OR loss. These are generally not insurable because they are voluntarily undertaken for profit: investing, starting a business, gambling.'),
    T('Risk vs Uncertainty',['Risk','Uncertainty'],[['Probabilities can be estimated','Probabilities cannot be estimated'],['Insurance companies use risk to set premiums','Uncertain events are generally not insurable'],['Example: probability of a house fire','Example: whether a new technology succeeds']]),
    SE('Why the Distinction Matters','Insurance is for pure risks. When a client says "I invest instead of buying insurance," they confuse speculative risk management with pure risk protection. Both are important — but different.')
  ],[
    'Pure risk: only possibility of loss — insurable',
    'Speculative risk: possibility of gain OR loss — generally not insurable',
    'Help clients see the difference between risks to insure vs risks to manage'
  ]),
  hQuiz([
    Q('Which of the following is a pure risk?',['Investing in stocks','Starting a new business','A fire damaging your home','Buying a lottery ticket'],2,'A fire damaging your home is a pure risk — it can only result in loss or no loss.'),
    Q('Why are speculative risks generally not insurable?',['They are too expensive','They involve potential gain and are voluntarily undertaken','Insurers do not understand them','They are illegal activities'],1,'Speculative risks involve potential gain and are voluntary — making them unsuitable for insurance.'),
    Q('A client runs a restaurant. Which risk is speculative?',['A kitchen fire','A customer slipping on a wet floor','A new competitor opening nearby','A food poisoning outbreak'],2,'Competition is a speculative risk — it involves potential for both gain and loss.'),
    Q('True or False: All risks that could cause financial loss are insurable.',['True','False'],1,'Only pure risks are typically insurable. Many speculative and systemic risks cannot be insured.'),
    Q('What is the best way to help a client understand the difference?',['Use technical insurance jargon','Show them policy documents','Use relatable examples from daily life','Tell them not to worry'],2,'Using relatable examples helps clients grasp abstract risk concepts more easily.')
  ]),
  hScript('Types of Risk — Pure vs Speculative',[
    'Not all risks are the same. Some offer the possibility of gain — like investing. Others only offer the possibility of loss — like a fire damaging your home.',
    'Insurance exists to protect against pure risks: events where the best outcome is "nothing happens." When clients understand this distinction, they see which risks to insure and which to manage differently.',
    'A well-protected client can take more calculated risks in business and investments because their foundation is secure.'
  ]),
  hWorkbook([
    {t:'Risk Classification',i:'For each scenario, classify as pure or speculative risk:',p:['A delivery van collides with another vehicle','A fashion designer launches a new clothing line','A factory worker injures their hand on machinery','A landlord\'s building collapses during heavy rain']},
    {t:'Client Conversation Roleplay',i:'Write a script for a 2-minute conversation explaining pure vs speculative risk to a small business owner.',p:['How would you open the conversation?','What example illustrates each type?','How does this connect to a recommendation?']}
  ]),
  hCase('Case Study: The Serial Entrepreneur','Ms. Okafor owns three businesses: a catering company (5 years), real estate investments (2 rental properties), and a tech startup (6 months). She has insurance only for catering vehicles. She says "I\'m a risk-taker — that\'s how entrepreneurs succeed."',[
    'Identify which exposures are pure vs speculative risks.',
    'Explain why protecting existing assets enables calculated business risks.',
    'Prioritise the risks she should address first with reasoning.',
    'Draft a recommendation that respects her entrepreneurial mindset.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Pure vs Speculative Risk Reference',description:'Quick-reference guide for risk classification'},
    {url:'#',type:'link',title:'Nigerian Insurance Association — Risk Types',description:'Industry classification of insurable risks'}
  ])
);

C1[3] = L(
  hContent('The Insurance Mechanism — How Risk Pooling Works',[
    'Understand how insurance pools risk across many policyholders',
    'Explain the premium-claims relationship',
    'Describe actuarial fairness and why it matters'
  ],[
    SE('The Core Idea: Risk Pooling','Many people pay a small amount (premium) so the few who suffer loss receive a large payment (claim). This transforms unpredictable individual losses into predictable collective costs.'),
    SE('How Premiums Are Calculated','Actuaries use historical data and statistical models. Components: pure premium (expected claims, 60-70%), expenses (administration, 20-30%), contingency margin (5-10%), and profit margin (0-5%).'),
    T('Premium Components',['Component','Description','Typical %'],[['Pure Premium','Expected cost of claims','60-70%'],['Expenses','Administration, commissions','20-30%'],['Contingency','Buffer for unexpected claims','5-10%'],['Profit','Return for the insurer','0-5%']]),
    SE('Actuarial Fairness','Similar risk profiles pay similar premiums. This is why insurers ask about age, health, occupation. Fair pricing ensures low-risk policyholders do not subsidise high-risk ones disproportionately.'),
    C('Risk pooling only works with sufficient participation. Nigeria\'s low penetration rate (<1%) makes pooling less efficient — and creates opportunity for advisors to grow the market.')
  ],[
    'Insurance pools risk across many policyholders',
    'Premiums = expected claims + expenses + contingency + profit',
    'Actuarial fairness means similar risks pay similar premiums',
    'Low penetration makes pooling less efficient — opportunity for advisors'
  ]),
  hQuiz([
    Q('What is risk pooling?',['Each person saves their own money','Many pay premiums so the few with losses are compensated','Government pays for claims','Insurers invest premiums in stocks'],1,'Risk pooling means many contribute so the few who suffer loss can be compensated.'),
    Q('Which component is typically the largest portion of a premium?',['Profit margin','Administrative expenses','Pure premium (expected claims)','Marketing costs'],2,'Pure premium (expected claims) is typically 60-70% of total premium.'),
    Q('Why do insurers ask about age, health, and occupation?',['To discriminate','To assess risk factors for fair pricing','To sell more products','To comply with government quotas'],1,'These help assess risk factors so similar profiles pay similar premiums — actuarial fairness.'),
    Q('Charging the same premium to a 25-year-old and a 60-year-old violates:',['Indemnity','Actuarial fairness','The law of large numbers','Utmost good faith'],1,'Different risk profiles should have different premiums — charging the same violates actuarial fairness.'),
    Q('Higher insurance penetration leads to:',['Higher premiums for all','More efficient risk pooling and lower average costs','Less consumer choice','Fewer insurance companies'],1,'More participants spread risk across more policyholders, making pooling more efficient.')
  ]),
  hScript('The Insurance Mechanism — How Risk Pooling Works',[
    'How does insurance work? Thousands of people pay premiums into a shared pool. The few who experience a loss can be compensated without facing financial ruin.',
    'Actuaries calculate premiums using historical data to predict future claims. They factor in claim likelihood, potential cost, expenses, and a safety margin.',
    'Understanding the insurance mechanism helps you explain to clients why premiums cost what they do — and why insurance is fundamentally about collective support.'
  ]),
  hWorkbook([
    {t:'Risk Pooling Demonstration',i:'Imagine 1,000 policyholders each paying ₦10,000 annual premium. Calculate:',p:['Total premium pool?','Expected claims if 5% claim ₦500,000 each?','Surplus or deficit at 5%?','What happens if 8% claim?']},
    {t:'Explaining Premiums to Clients',i:'Write a simple analogy for risk pooling using everyday Nigerian examples.',p:['Think of a village savings group or cooperative','Keep it under 30 seconds','Focus on fairness of collective contribution']}
  ]),
  hCase('Case Study: The Community Health Scheme','A community association of 500 families wants a health cost-sharing scheme. Based on data, 12% of families will have a medical event yearly, average cost ₦150,000 per event.',[
    'Calculate minimum monthly contribution per family to cover expected claims.',
    'Explain why formal insurance may be more sustainable than an informal pool.',
    'Identify what happens if claims are higher than expected.',
    'Recommend how the community could structure this with a licensed insurer.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk Pooling Visual Guide',description:'Infographic illustrating how risk pooling works'},
    {url:'#',type:'link',title:'Nigerian Actuarial Society',description:'Professional body for actuaries in Nigeria'}
  ])
);

C1[4] = L(
  hContent('Core Insurance Principles in Practice',[
    'Understand the six fundamental insurance principles',
    'Apply each principle to real advisory scenarios',
    'Explain principles to clients in simple terms'
  ],[
    Ls('The Six Principles',[
      {l:'Utmost Good Faith',d:'Both parties must act honestly and disclose all material facts.'},
      {l:'Insurable Interest',d:'The insured must benefit from the safety of the subject matter and suffer financially from its loss.'},
      {l:'Indemnity',d:'Insurance restores the insured to pre-loss financial position — no profit from claims.'},
      {l:'Subrogation',d:'After paying a claim, the insurer can pursue the responsible third party.'},
      {l:'Contribution',d:'If multiple policies cover the same loss, each contributes proportionally.'},
      {l:'Proximate Cause',d:'The nearest cause of loss must be a covered peril for the claim to be valid.'}
    ],'Insurance is built on six principles that govern every policy and claim:'),
    SE('Why Principles Matter in Advisory','These principles directly affect clients. If a client fails to disclose a pre-existing condition, their claim could be denied. If they over-insure, they cannot profit from loss. Understanding these principles helps you advise accurately and manage expectations.'),
    C('The principle most misunderstood by clients is indemnity. Many think insurance should make them "better off." Explaining that insurance restores, not enriches, prevents disappointment at claim time.')
  ],[
    'Six principles govern all insurance contracts',
    'Utmost good faith requires full disclosure',
    'Indemnity prevents profit from insurance claims',
    'Knowing these principles enables accurate client advice'
  ]),
  hQuiz([
    Q('A client fails to mention a leaking roof when taking fire insurance. Which principle is violated?',['Indemnity','Utmost Good Faith','Subrogation','Contribution'],1,'The client failed to disclose a material fact, violating utmost good faith.'),
    Q('After paying a fire claim, the insurer sues the generator manufacturer who caused the fire. This is:',['Insurable interest','Contribution','Subrogation','Proximate cause'],2,'Subrogation lets the insurer pursue the responsible third party after paying the claim.'),
    Q('Two policies cover the same building. After a fire, the insurers share the claim. This is:',['Subrogation','Insurable interest','Contribution','Utmost good faith'],2,'Contribution means insurers share claims proportionally when multiple policies cover the same loss.'),
    Q('An employee takes life insurance on their employer. Is this valid?',['Yes, because they work together','No — no insurable interest','Yes, if the employer agrees','Only if they are family'],1,'An employee typically has no insurable interest on an employer\'s life.'),
    Q('A client insures their house for double its value hoping to profit from a fire. Which principle prevents this?',['Utmost Good Faith','Subrogation','Indemnity','Contribution'],2,'Indemnity restores to pre-loss position — no profit from insurance claims.')
  ]),
  hScript('Core Insurance Principles in Practice',[
    'Six principles form the foundation of every insurance contract. They directly affect your clients every day.',
    'Utmost good faith means honesty from both sides. Withhold a material fact, and a claim can be denied. Indemnity means insurance restores — a client cannot profit from a loss.',
    'Understanding these principles helps you set accurate expectations. When a client understands why a claim was handled a certain way, they trust you more — even when the news is not what they hoped.'
  ]),
  hWorkbook([
    {t:'Principle Identification',i:'For each scenario, identify which principle applies:',p:['Client insured house for twice market value hoping to profit','Insurer denied claim for undisclosed previous fire damage','Two policies cover the same car, share the claim payment','Insurer pays claim then sues the negligent contractor']},
    {t:'Client Communication',i:'Write a simple explanation of indemnity that a non-expert client would understand.',p:['Use an everyday analogy','Keep it under 60 seconds','Avoid insurance jargon']}
  ]),
  hCase('Case Study: The Claim Denial','Mrs. Eze bought comprehensive motor insurance. After an accident, the insurer denied her claim because she did not disclose pre-existing mechanical issues and the driver (her 19-year-old son) was not listed as an authorised driver.',[
    'Identify which insurance principles were violated.',
    'Explain what Mrs. Eze should have done differently.',
    'Draft a procedure you would follow with every client to ensure full disclosure.',
    'Advise Mrs. Eze on her options going forward.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Insurance Principles Quick Reference',description:'One-page summary of the six core principles'},
    {url:'#',type:'link',title:'NAICOM — Market Conduct Guidelines',description:'Regulatory guidelines on fair treatment of policyholders'}
  ])
);

C1[5] = L(
  hContent('The Nigerian Risk Landscape',[
    'Understand the unique risk profile of Nigerian clients',
    'Identify the key factors driving the protection gap',
    'Use market data to build a compelling case for protection'
  ],[
    SE('The Protection Gap in Nigeria','Nigeria has one of the lowest insurance penetration rates globally at <1% of GDP. Fewer than 5% of adults have life assurance, and less than 30% of SMEs carry any insurance. This means millions face financial risks without a safety net.'),
    T('Nigeria Insurance Market at a Glance',['Metric','Value'],[['Insurance Penetration','< 1% of GDP'],['Life Assurance Coverage','< 5% of adults'],['SMEs with Insurance','< 30%'],['Average Premium per Capita','~₦6,000/year'],['Largest Segment','Oil & Gas / Marine']]),
    SE('Key Risk Factors','Nigerian clients face unique challenges: high inflation erodes savings and sums insured; inadequate healthcare infrastructure makes medical emergencies more expensive; frequent power fluctuations cause fire and equipment damage; road conditions contribute to high accident rates.'),
    SE('The Opportunity','Low penetration does not mean low demand. It reflects limited awareness, trust issues from past claim denials, and products that do not always meet customer needs. As a CoverScore advisor, you address all three.'),
    C('Low insurance penetration is not a sign that Nigerians do not want protection. It reflects limited awareness, trust concerns, and products not meeting customer needs. You change that — one client at a time.')
  ],[
    'Nigerian insurance penetration is < 1% of GDP — among the lowest globally',
    'Unique risk factors: inflation, infrastructure gaps, power fluctuations',
    'The protection gap represents a massive opportunity for skilled advisors',
    'Building trust and awareness is the first step to closing the gap'
  ]),
  hQuiz([
    Q('What is Nigeria\'s approximate insurance penetration rate?',['5% of GDP','Less than 1% of GDP','10% of GDP','15% of GDP'],1,'Nigeria\'s penetration rate is less than 1% of GDP, one of the lowest globally.'),
    Q('What percentage of Nigerian adults have life assurance?',['15%','25%','Fewer than 5%','50%'],2,'Fewer than 5% of Nigerian adults have any form of life assurance.'),
    Q('Which is a unique risk factor for Nigerian clients?',['High insurance penetration','Stable power supply','Frequent power fluctuations causing fire risk','Low inflation'],2,'Frequent power fluctuations are a significant risk factor in Nigeria, causing fire and equipment damage.'),
    Q('Low insurance penetration in Nigeria is primarily due to:',['Nigerians cannot afford insurance','Limited awareness, trust issues, products not meeting needs','Insurance is illegal in some states','No demand for insurance'],1,'Low penetration reflects awareness gaps, trust concerns, and products not aligned with customer needs.'),
    Q('A client says "I don\'t know anyone paid by an insurance company." Your response?',['Agree insurers rarely pay','Explain the claim process and share examples of paid claims','Tell them to search online','Say insurance is not for everyone'],1,'Acknowledge the concern and address with facts and transparency — that builds trust.')
  ]),
  hScript('The Nigerian Risk Landscape',[
    'Nigeria\'s insurance penetration rate is less than 1% of GDP — among the lowest globally. Fewer than 5% of adults have life assurance, and less than 30% of small businesses carry insurance.',
    'Yet Nigerian families and businesses face significant risks: high inflation, inadequate healthcare, power fluctuations, and challenging road conditions. Every day, people suffer financial losses that could have been prevented.',
    'This gap is not just a challenge — it is an opportunity. Every client conversation you have is a step toward closing Nigeria\'s protection gap.'
  ]),
  hWorkbook([
    {t:'Market Analysis',i:'Note 3 reasons insurance penetration is low in your specific market. For each, propose how you as an advisor can address it.',p:['Reason 1 + Your solution','Reason 2 + Your solution','Reason 3 + Your solution']},
    {t:'Client Profile Mapping',i:'Think of 3 typical clients. For each, identify top 3 risks based on the Nigerian risk landscape.',p:['Client 1: occupation, risks, products','Client 2: occupation, risks, products','Client 3: occupation, risks, products']}
  ]),
  hCase('Case Study: The Market Trader','Mrs. Bello runs a textile stall in a Lagos market. Stock worth ~₦3M. No insurance. Last year a market fire destroyed 20 stalls — none had insurance. She says "insurance is for rich people." Monthly savings: ~₦50,000.',[
    'Calculate the potential loss Mrs. Bello faces.',
    'Draft a conversation addressing her belief that insurance is for the rich.',
    'Recommend a specific solution with estimated premium.',
    'Explain how the premium compares to her savings and why it is affordable.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Nigeria Insurance Market Overview',description:'Key statistics and trends in Nigerian insurance'},
    {url:'https://nairametrics.com',type:'link',title:'Nairametrics — Insurance Reports',description:'Financial news and analysis of Nigerian insurance sector'}
  ])
);

C1[6] = L(
  hContent('Why Risk Management Matters',[
    'Understand the financial and emotional impact of unmanaged risk',
    'Build a compelling case for proactive risk management',
    'Help clients connect risk management to their life goals'
  ],[
    SE('The Cost of Doing Nothing','When risk is unmanaged, consequences can be devastating. A breadwinner\'s death can plunge a family into poverty. A fire can destroy a business built over decades. The cost is not just financial — it affects families, employees, and communities.'),
    T('Impact of Unmanaged Risk',['Scenario','Financial Impact','Recovery Time'],[['Primary earner dies without life cover','Loss of income; children may leave school','5-10 years'],['SME destroyed by fire, no insurance','Total loss of assets','May never recover'],['Medical emergency, no health cover','₦1-5M out-of-pocket','2-5 years financially'],['Car accident, no motor insurance','Repair costs + liability','1-3 years']]),
    SE('Proactive vs Reactive','Proactive risk management means addressing risks before they materialise. It is the difference between choosing your protection and having no choice when loss occurs. Clients who plan pay predictable premiums; those who wait pay the full cost of loss.'),
    C('Risk management is not about fear — it is about freedom. A well-protected client can pursue their goals with confidence, knowing they have a safety net.')
  ],[
    'Unmanaged risk can have devastating financial and emotional consequences',
    'The cost of prevention (premiums) is always less than the cost of loss',
    'Proactive risk management gives clients choice and peace of mind',
    'Help clients see protection as enabler, not expense'
  ]),
  hQuiz([
    Q('What is the primary benefit of proactive risk management?',['It eliminates all risk','Clients can choose protection before loss occurs','It guarantees profit','It removes the need for savings'],1,'Proactive management lets clients choose protection on their terms before loss occurs.'),
    Q('A primary earner dies without life insurance. The most likely long-term impact?',['The family inherits a payout','Prolonged financial hardship','Government provides full support','Employer covers all expenses'],1,'Without life insurance, the family loses the primary income source and may face years of hardship.'),
    Q('How should you frame the cost of insurance to a reluctant client?',['As an unnecessary expense','As a predictable cost vs. potentially catastrophic loss','As a luxury for the wealthy','As a government requirement'],1,'Insurance is a predictable, affordable cost compared to the catastrophic impact of uninsured loss.'),
    Q('True or False: Risk management is only for the wealthy.',['True','False'],1,'Risk management is important for everyone, especially those with fewer resources to absorb a loss.'),
    Q('The best time to buy insurance is:',['After experiencing a loss','When you can no longer avoid it','Before you need it, when you have choices','Only when required by law'],2,'The best time is before a loss occurs, when you have options and can choose standard-rate coverage.')
  ]),
  hScript('Why Risk Management Matters',[
    'Why does risk management matter? Because the alternative is devastating. A family without life cover can lose their home, their children\'s education, and their financial future in a single event.',
    'Proactive risk management gives clients control. Instead of hoping nothing bad happens, they can know they are protected. Instead of facing a financial crisis, they face a manageable situation.',
    'You are not selling insurance products. You are selling peace of mind, financial resilience, and the freedom to pursue life goals without fear.'
  ]),
  hWorkbook([
    {t:'Personal Impact Assessment',i:'Calculate the financial impact if your income stopped for 6 months.',p:['Monthly expenses?','Savings available?','Months you could survive?','What expenses would you cut first?']},
    {t:'The 5-Whys Exercise',i:'For a client who says insurance is too expensive, use the "5 Whys" to uncover the real concern.',p:['Why is it expensive?','Why do you feel that way?','Keep digging until you reach the core concern']}
  ]),
  hCase('Case Study: The Family That Waited Too Long','The Adeleke family — husband (42, primary earner), wife (38, part-time teacher), 3 children. They discussed life insurance for years but never bought it. Mr. Adeleke was recently diagnosed with a critical illness and can no longer work. Two months of savings, ₦8M outstanding mortgage.',[
    'Calculate the family\'s current financial shortfall.',
    'Identify what protection should have been in place and the cost.',
    'Draft key points for a conversation about what they can still do.',
    'Reflect: What would you say to a healthy client who keeps postponing protection?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'The Cost of Waiting — Client Guide',description:'Framework for helping clients understand urgency of protection'},
    {url:'#',type:'video',title:'Why Risk Management Matters — Client Video',description:'Short animated video to share with clients'}
  ])
);

C1[7] = L(
  hContent('Introduction to the CoverScore Approach to Risk',[
    'Understand how CoverScore transforms traditional insurance advisory',
    'Learn the CoverScore methodology: assess, score, analyse, recommend, monitor',
    'Articulate the CoverScore difference to clients'
  ],[
    SE('Beyond Traditional Insurance','Traditional advisory is product-centric: sell a policy and move on. CoverScore is client-centric: start with the client\'s unique risk profile, identify gaps, and recommend solutions — not just products.'),
    T('Traditional vs CoverScore',['Traditional','CoverScore'],[['Starts with products','Starts with client risk profile'],['One-size-fits-all recommendations','Personalised based on data'],['Transactional: sell and move on','Relational: ongoing journey'],['Focus on price','Focus on value and protection gaps'],['Advisor talks, client listens','Client engages through assessment']]),
    OL('The Five-Step Methodology',['ASSESS — Client completes a risk assessment','SCORE — Platform calculates CoverScore (0-100)','ANALYSE — Risk Fingerprint reveals gaps and exposures','RECOMMEND — Advisor presents tailored solutions','MONITOR — Regular reviews track improvement'],'The CoverScore approach follows five steps:'),
    C('The CoverScore approach transforms the advisor from a salesperson to a trusted risk consultant. Clients see you as a partner in their financial security — not someone selling them something.')
  ],[
    'CoverScore is client-centric, not product-centric',
    'Five steps: Assess, Score, Analyse, Recommend, Monitor',
    'The Risk Fingerprint provides data-driven, personalised insights',
    'Advisors become trusted risk consultants, not product sellers'
  ]),
  hQuiz([
    Q('How does CoverScore differ from traditional advisory?',['It sells more products','It starts with the client\'s risk profile','It only serves large businesses','It replaces advisors with AI'],1,'CoverScore starts with the client\'s risk profile and identifies gaps before recommending solutions.'),
    Q('What is the first step in the CoverScore methodology?',['Recommend','Analyse','Assess','Monitor'],2,'The first step is Assess — the client completes a risk assessment.'),
    Q('The Risk Fingerprint reveals:',['The cheapest products','Specific protection gaps across multiple dimensions','The client\'s credit score','Policy terms and conditions'],1,'The Risk Fingerprint provides a multi-dimensional view of risk exposures and protection gaps.'),
    Q('True or False: CoverScore positions advisors to sell as many products as possible.',['True','False'],1,'CoverScore positions advisors as trusted risk consultants, not product salespeople.'),
    Q('What makes the approach "relational" rather than "transactional"?',['Only one meeting needed','Ongoing monitoring and regular reviews','No face-to-face contact','Focus only on price'],1,'The approach includes regular reviews and ongoing engagement — a long-term relationship.')
  ]),
  hScript('Introduction to the CoverScore Approach to Risk',[
    'Traditional insurance starts with products. CoverScore starts with you — your risks, your situation, your goals.',
    'The methodology is simple: Assess, Score, Analyse, Recommend, Monitor. Your client completes an assessment. We calculate their score. We generate a Risk Fingerprint showing exactly where they need protection.',
    'You review findings with your client and recommend solutions tailored to their specific needs. Then you follow up — because risk changes. This is not selling insurance. This is delivering risk intelligence.'
  ]),
  hWorkbook([
    {t:'Elevator Pitch',i:'Create a 30-second pitch comparing traditional advisory to the CoverScore approach.',p:['What is the key difference you lead with?','How do you make it relevant to the client?','Practice your pitch aloud']},
    {t:'Five-Step Process',i:'For a current client, write what each CoverScore step would look like.',p:['Assess: What questions would you ask?','Score: What score range do you expect?','Analyse: What gaps do you suspect?','Recommend: What solutions?','Monitor: When and how follow up?']}
  ]),
  hCase('Case Study: The Skeptical Business Owner','Chief Okonkwo owns a chain of supermarkets in Enugu. He has bought insurance from various agents for 15 years but does not understand his coverage. He pays ~₦2M annually in premiums. He says "all insurance people are the same."',[
    'How would you use the CoverScore methodology to differentiate yourself?',
    'What would you say to address his "all the same" concern?',
    'Walk through Assess and Analyse for his business.',
    'Explain how the Monitor step adds value beyond his current agents.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'CoverScore Methodology Overview',description:'One-page guide to the five-step framework'},
    {url:'#',type:'link',title:'CoverScore Advisor Portal',description:'Login to access your client dashboard and assessment tools'}
  ])
);

C1[8] = L(
  hContent('Module 1 Knowledge Check & Case Study',[
    'Apply all Module 1 concepts to a comprehensive case study',
    'Synthesise risk types, insurance principles, and the CoverScore approach',
    'Demonstrate integrated advisory thinking'
  ],[
    SE('Module 1 Recap','You have learned: what risk is and how it differs from uncertainty, pure vs speculative risk, how risk pooling works, the six core insurance principles, the Nigerian risk landscape, why risk management matters, and the CoverScore approach.'),
    SE('Integrated Advisory','Now it is time to apply everything to a comprehensive client scenario. The best advisors do not think in silos — they combine knowledge of risk principles, market context, and the CoverScore methodology to deliver complete solutions.'),
    C('This lesson does not have a separate quiz — your knowledge is assessed through the case study below. Complete all tasks thoroughly before moving to Module 2.')
  ],[
    'Risk awareness is the foundation of protection planning',
    'Insurance principles govern every policy and claim',
    'The CoverScore methodology transforms advisory into a trusted partnership',
    'Integrated thinking delivers better client outcomes'
  ]),
  hQuiz([
    Q('What best describes the CoverScore approach?',['Selling as many products as possible','Starting with client risk profile and recommending tailored solutions','Focusing only on price comparison','Replacing advisors with automation'],1,'CoverScore starts with the client\'s risk profile and recommends tailored solutions based on data.'),
    Q('A client insured their building for ₦20M. After a fire, the insurer paid ₦18M due to depreciation. This demonstrates:',['Utmost good faith','Insurable interest','Indemnity','Subrogation'],2,'Indemnity restores to pre-loss position, accounting for depreciation — not full replacement cost.'),
    Q('Nigeria\'s low insurance penetration creates:',['No opportunity — low penetration means no demand','An opportunity to educate and protect underserved clients','An opportunity to focus on other industries','A reason to leave the market'],1,'Low penetration means millions need protection — a massive opportunity for advisors.'),
    Q('The difference between pure and speculative risk is:',['Pure involves gain; speculative involves loss','Pure involves loss or no loss; speculative involves gain or loss','They are the same','Pure risks are not insurable'],1,'Pure risk = loss or no loss; speculative risk = gain or loss.'),
    Q('In the CoverScore methodology, what comes after "Analyse"?',['Assess','Score','Recommend','Monitor'],2,'Order: Assess → Score → Analyse → Recommend → Monitor.')
  ]),
  hScript('Module 1 Knowledge Check & Case Study',[
    'You have completed the first module of the CCA programme. You understand risk foundations, how insurance works, the principles that govern it, and the Nigerian market context.',
    'You also understand how CoverScore transforms advisory from product-selling to client-centric risk consulting. Now it is time to put it all together.',
    'Work through the comprehensive case study below. Take your time, think deeply, and apply the principles — not just the products.'
  ]),
  hWorkbook([
    {t:'Knowledge Synthesis',i:'Write a one-page summary of Module 1 as if explaining it to a new advisor. Include: what risk is, key principles, the Nigerian landscape, and the CoverScore approach.',p:['What are the 3 most important concepts?','What mistakes do new advisors commonly make?','What one insight should a new advisor remember?']},
    {t:'Personal Action Plan',i:'Based on Module 1, identify 3 changes you will make to your advisory practice.',p:['Change 1: What will you do differently?','Change 2: What will you start doing?','Change 3: What will you stop doing?']}
  ]),
  hCase('Comprehensive Case Study: The Ogunbiyi Family Enterprise','Mr. Ogunbiyi (54) runs a printing press in Ibadan with 25 employees. Business equipment valued at ₦15M. Basic fire insurance on equipment only. Mrs. Ogunbiyi (50) runs a boutique from their personal home. Home valued at ₦35M — no insurance. Two vehicles with comprehensive cover. Mr. Ogunbiyi has ₦5M life insurance (taken out 20 years ago). No health insurance. No business interruption cover. Three children: one in UK university (₦8M/year), two in school.',[
    'Identify ALL risks — personal, property, liability, and business.',
    'Classify each as pure or speculative risk.',
    'Identify specific protection gaps using the CoverScore framework.',
    'Prioritise gaps by exposure level with justification.',
    'Recommend specific solutions for top 5 priorities with estimated cover amounts.',
    'Explain how you would present this using the CoverScore approach.',
    'What monitoring and review schedule would you recommend?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Module 1 Cheat Sheet',description:'Complete summary of all Module 1 concepts'},
    {url:'#',type:'doc',title:'Case Study Worksheet — Ogunbiyi Family',description:'Printable worksheet with space for your analysis'}
  ])
);

// ═══════════════════════════════════════════════════════════════════
// COURSE 2: CCA-102 — The Nigerian Insurance Market & Regulatory Environment
// ═══════════════════════════════════════════════════════════════════

const C2 = {};

C2[1] = L(
  hContent('Lesson 1: Overview of the Nigerian Insurance Industry',[
    'Understand Nigeria\'s position in the global and African insurance market',
    'Identify the key market indicators and their significance',
    'Articulate the protection gap and the advisor\'s opportunity'
  ],[
    P('Nigeria is the largest economy in Africa by GDP, yet its insurance penetration rate is one of the lowest on the continent. This lesson provides the market context every CoverScore advisor needs to understand before engaging clients.'),
    T('Nigerian Insurance Market at a Glance',['Indicator','Value','Context'],[['Total Premium Volume','~₦600-700 billion','Approx $1.5B USD'],['Penetration Rate','< 0.5% of GDP','vs 2-3% African average'],['Density (per capita)','~₦6,000/year','vs South Africa ~₦70,000'],['Life Insurance Share','~20% of market','Heavily dominated by general'],['Number of Insurers','~60 firms','27 Life, 32 Non-Life, 1 Composite'],['Registered Brokers','~500 firms','Concentrated in Lagos'],['Agents (registered)','~50,000+','Vast majority of distribution'],['Claims Ratio','Varies 30-60%','Trust issue due to slow payment']]),
    SE('The Protection Gap','The protection gap refers to the difference between the insurance coverage people need and what they actually have. In Nigeria: fewer than 5% of adults have life assurance, over 70% of SMEs operate without any insurance, and less than 10% of vehicles on the road are insured — yet third-party motor insurance is legally required.'),
    Ls('Drivers of Insurance Demand',[
      {l:'Economic Growth',d:'As Nigeria\'s economy grows and diversifies, more assets and liabilities need protection — driving demand for insurance services.'},
      {l:'Urbanisation',d:'Growing cities create denser risk concentrations, increasing demand for property, motor, and health insurance.'},
      {l:'Regulatory Push',d:'NAICOM is driving compulsory insurance compliance — motor, building, professional indemnity, and healthcare.'},
      {l:'Digital Adoption',d:'Insurtech and mobile channels are reaching previously underserved populations at lower cost.'},
      {l:'Rising Awareness',d:'Post-pandemic risk consciousness and industry educational efforts are slowly improving public perception.'}
    ],'Several factors are driving gradual growth in Nigerian insurance:'),
    C('Nigerian insurance penetration is less than half the African average. For every percentage point increase, approximately ₦700 billion in additional premiums would be generated. As a CoverScore advisor, you are on the front line of closing this gap.')
  ],[
    'Nigeria has Africa\'s largest economy but among the lowest insurance penetration rates globally',
    'The protection gap: <5% life assurance, >70% SMEs uninsured, <10% vehicles insured',
    'Drivers of growth: economic development, urbanisation, regulation, digital adoption, awareness',
    'Every 1% increase in penetration represents ~₦700B in new premiums'
  ]),
  hQuiz([
    Q('What is Nigeria\'s approximate insurance penetration rate?',['0.5% of GDP','2% of GDP','5% of GDP','10% of GDP'],0,'Nigeria\'s penetration rate is less than 0.5% of GDP, among the lowest globally.'),
    Q('What percentage of Nigerian SMEs operate without any insurance?',['Approximately 30%','Approximately 50%','Over 70%','Less than 10%'],2,'Over 70% of SMEs in Nigeria operate without any insurance coverage.'),
    Q('Which is the largest segment of Nigeria\'s insurance market?',['Life insurance','Oil & Gas / Marine insurance','Health insurance','Agricultural insurance'],1,'Oil & Gas and Marine insurance remain the largest segments due to Nigeria\'s petroleum industry.'),
    Q('Which factor is NOT a key driver of insurance demand in Nigeria?',['Economic growth and diversification','Urbanisation and denser risk concentrations','Declining population','Regulatory push for compulsory insurance'],2,'A declining population is not a driver of insurance demand — Nigeria\'s population is growing.'),
    Q('What is insurance density?',['Total premium collected by all insurers','Premium per capita spent on insurance','Percentage of GDP spent on insurance','Number of insurance companies per million people'],1,'Insurance density measures the average premium spent per person per year.')
  ]),
  hScript('Lesson 1: Overview of the Nigerian Insurance Industry',[
    'Welcome to CCA 102: The Nigerian Insurance Market and Regulatory Environment. In this module, we explore the market where you operate — its size, players, challenges, and opportunities.',
    'Nigeria is Africa\'s largest economy, yet fewer than 1 in 200 people spend more than pocket change on insurance annually. The protection gap is staggering: less than 5% of adults have life insurance, over 70% of small businesses carry no cover at all, and fewer than 1 in 10 vehicles on Nigerian roads are insured.',
    'But here is the opportunity. Every percentage point increase in penetration generates hundreds of billions in new premiums. Economic growth, urbanisation, regulatory push, and digital adoption are all working in your favour. As a CoverScore advisor, you are positioned to capture this growth by delivering professional, client-centric advice.'
  ]),
  hWorkbook([
    {t:'Market Size Calculation',i:'If Nigeria\'s GDP is approximately ₦200 trillion and insurance penetration is 0.5%, what is the current total premium? What would total premium be at 1.5% penetration?',p:['Current total premium = 200T × 0.005','At 1.5%: 200T × 0.015','Growth potential in naira terms','How does this change your view of the market opportunity?']},
    {t:'Local Market Analysis',i:'Research and note 3 specific factors affecting insurance demand in your state or region.',p:['Factor 1: Specific to your area','Factor 2: Cultural or economic','Factor 3: Regulatory or infrastructure','How can you as an advisor address each?']}
  ]),
  hCase('Case Study: The Ibadan Market Fire','In 2023, a major fire at Bodija Market in Ibadan destroyed over 700 shops, affecting thousands of traders and their families. Total losses were estimated at over ₦10 billion. Fewer than 5% of the affected traders had any form of insurance coverage. Many lost everything they had built over decades.',[
    'Calculate the estimated loss per affected trader based on the total figures.',
    'Why do you think so few traders had insurance despite operating in a high-risk market environment?',
    'What specific insurance products could have protected these traders?',
    'Draft the opening of a conversation you would have with a market trader about insurance — without using technical jargon.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Nigerian Insurance Market Fact Sheet',description:'Key market indicators at a glance'},
    {url:'#',type:'link',title:'Nigerian Insurance Association — Market Report',description:'Annual industry report and statistics'}
  ])
);

C2[2] = L(
  hContent('Lesson 2: Key Players in the Nigerian Insurance Market',[
    'Identify every key participant in the insurance ecosystem',
    'Understand the distinct roles of insurers, intermediaries, and regulators',
    'Explain how these players interact to serve the insured'
  ],[
    P('The Nigerian insurance market is a complex ecosystem with multiple participants. Understanding who does what — and how they depend on each other — is essential for effective advisory.'),
    T('Key Players in the Ecosystem',['Player','Role','Key Insight'],[['Insurers (Life)','Underwrite life risks, pay claims','27 licensed life companies'],['Insurers (Non-Life)','Underwrite general insurance','32 licensed non-life companies'],['Composite Insurers','Underwrite both life & general','Only 1 in Nigeria'],['Reinsurers','Insure the insurers','2 local + international'],['Insurance Brokers','Act on behalf of clients','~500 registered firms'],['Agents','Represent insurers, sell to clients','50,000+ registered'],['Bancassurance','Banks distributing insurance','Growing channel'],['NAICOM','Regulator of the industry','Sets rules, enforces compliance'],['NIA','Industry association','Promotes, educates, advocates'],['CIIN','Professional body','Sets standards, certifies']]),
    SE('Insurers: Life vs Non-Life','Life insurers handle products based on human life — term assurance, whole life, endowment, annuities, group life. Non-life (general) insurers handle property, liability, motor, marine, oil & gas, agriculture, and engineering risks. Understanding the distinction helps route client needs correctly.'),
    SE('Intermediaries: Brokers and Agents','Brokers represent the client — they assess needs, shop the market, advise on options, and assist with claims. Agents represent the insurer — they sell products on behalf of one or more companies. Both are vital: brokers provide independent advice; agents provide reach.'),
    SE('Reinsurers: The Safety Net','Reinsurers insure the insurers. When a risk is too large for one insurer — like a ₦500 billion oil platform — the primary insurer transfers part of the exposure to a reinsurer. This stabilises the market and enables insurers to underwrite large risks.'),
    C('The ecosystem only works when all players fulfil their role effectively. As an advisor, you sit at the centre — translating between the technical insurance world and your client\'s real-world needs.')
  ],[
    'Life insurers handle human life risks; non-life insurers handle property, liability, and general risks',
    'Brokers represent clients; agents represent insurers — both are essential distribution channels',
    'Reinsurers provide capacity for large risks, stabilising the primary insurance market',
    'NAICOM regulates, NIA promotes, CIIN certifies — each plays a distinct role'
  ]),
  hQuiz([
    Q('What is the key difference between an insurance broker and an agent?',['A broker is licensed, an agent is not','A broker represents the client; an agent represents the insurer','A broker only handles life insurance','An agent earns more commission than a broker'],1,'Brokers act on behalf of clients to find the best coverage; agents represent insurers to sell policies.'),
    Q('How many composite insurance companies operate in Nigeria?',['27','1','32','50'],1,'Only 1 composite insurer (underwriting both life and non-life) is licensed in Nigeria.'),
    Q('What is the primary function of a reinsurer?',['Sell policies directly to consumers','Regulate the insurance industry','Insure the primary insurers against large losses','Certify insurance professionals'],2,'Reinsurers provide capacity by insuring primary insurers against losses that are too large for them to bear alone.'),
    Q('Which organisation regulates the Nigerian insurance industry?',['CBN','NAICOM','NIA','SEC'],1,'NAICOM — the National Insurance Commission — is the statutory regulator of the Nigerian insurance industry.'),
    Q('Why is understanding the roles of different players important for an advisor?',['It is only required for the licensing exam','It helps route client needs to the right provider and explain how the system works','It allows the advisor to bypass regulators','It is not important — clients only care about price'],1,'Knowing the ecosystem helps advisors navigate the market, explain processes to clients, and find the best solutions.')
  ]),
  hScript('Lesson 2: Key Players in the Nigerian Insurance Market',[
    'The Nigerian insurance market is not just insurers and customers. There is an entire ecosystem of players, each with a distinct function.',
    'Insurance companies underwrite risks and pay claims. Brokers and agents connect products to people — but they serve different masters. Brokers work for the client, agents work for the insurer. Reinsurers provide the safety net that allows insurers to take on big risks.',
    'And then there are the institutions: NAICOM regulates, NIA promotes the industry, and the CIIN sets professional standards. As a CoverScore advisor, knowing this ecosystem helps you navigate the market with confidence and guide your clients through it.'
  ]),
  hWorkbook([
    {t:'Ecosystem Mapping',i:'Draw a diagram showing how all players in the insurance ecosystem connect. Label each relationship.',p:['Start with the client at the centre','Add insurers, brokers, agents, reinsurers','Add regulators, associations, professional bodies','Draw arrows showing the flow of premiums, claims, and information']},
    {t:'Market Structure Comparison',i:'Compare the Nigerian insurance market structure to another country (e.g., South Africa, Kenya, or the UK).',p:['Number of insurers and brokers','Role of reinsurers','Regulatory approach','What can Nigeria learn from that market?']}
  ]),
  hCase('Case Study: The Confused Client','Mr. Jacobs wants life insurance for his family. He has been approached by three different people: a direct agent from a life company, a broker who says he can compare multiple insurers, and his bank offering bancassurance. He is confused about who to trust and who offers the best deal.',[
    'Explain the difference between each approach to Mr. Jacobs in simple terms.',
    'What are the advantages of using a broker versus buying direct from an agent?',
    'What questions should Mr. Jacobs ask each representative before deciding?',
    'Recommend which route you would suggest and why.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Insurance Ecosystem Reference Guide',description:'One-page diagram of market participants and their roles'},
    {url:'#',type:'link',title:'NAICOM — List of Licensed Insurers',description:'Official register of all licensed insurance companies in Nigeria'}
  ])
);

C2[3] = L(
  hContent('Lesson 3: NAICOM & the Regulatory Framework',[
    'Understand the role, powers, and functions of NAICOM',
    'Explain the key regulations affecting insurance in Nigeria',
    'Apply regulatory knowledge to ensure compliant advisory practice'
  ],[
    P('The National Insurance Commission (NAICOM) was established by the Insurance Act 2003 to regulate, supervise, and develop the Nigerian insurance industry. Every advisor must understand NAICOM\'s role — it directly affects how you operate.'),
    T('NAICOM\'s Core Functions',['Function','What It Means for Advisors'],[['Licensing','Insurers, brokers, and agents must be licensed by NAICOM. Unlicensed activity is illegal.'],['Solvency Oversight','NAICOM ensures insurers maintain sufficient capital reserves to pay claims.'],['Market Conduct','Sets rules for fair treatment of policyholders, advertising standards, and sales practices.'],['Policy Approval','Insurance products must be approved by NAICOM before being sold to the public.'],['Consumer Protection','NAICOM handles complaints and can compel insurers to pay valid claims.'],['Development','NAICOM drives initiatives to increase penetration, including compulsory insurance enforcement.']]),
    SE('Key Legislation','The Insurance Act 2003 is the primary legislation governing insurance in Nigeria. Key provisions: minimum capital requirements, compulsory insurance classes (third-party motor, buildings under construction, professional indemnity, healthcare), and the establishment of NAICOM.'),
    SE('Market Conduct & TCF','Treating Customers Fairly (TCF) is a NAICOM framework requiring insurers and intermediaries to: ensure products meet customer needs, provide clear information, handle complaints promptly, and not mis-sell. TCF applies to every advisor-client interaction.'),
    C('Regulatory knowledge is not just about compliance — it builds client trust. When you explain that a policy is NAICOM-approved, or that TCF rules protect them, you demonstrate professionalism. Clients buy from advisors they trust.')
  ],[
    'NAICOM regulates, supervises, and develops the insurance industry — licensing, solvency, market conduct',
    'The Insurance Act 2003 is the primary legislation, establishing compulsory insurance classes',
    'Treating Customers Fairly (TCF) requires clear information, suitable products, and proper complaints handling',
    'Regulatory knowledge builds client trust and demonstrates professionalism'
  ]),
  hQuiz([
    Q('What legislation established NAICOM?',['The Companies and Allied Matters Act','The Insurance Act 2003','The NAICOM Act 1997','The Pension Reform Act'],1,'The Insurance Act 2003 established NAICOM as the statutory regulator.'),
    Q('Which of the following is a compulsory insurance class in Nigeria?',['Travel insurance','Life insurance','Third-party motor insurance','Home insurance'],2,'Third-party motor insurance is one of the compulsory classes under Nigerian law.'),
    Q('What does Treating Customers Fairly (TCF) require?',['That insurers maximise profits','That customers are treated fairly with clear information and suitable products','That only licensed brokers can sell insurance','That all policies must be reviewed annually'],1,'TCF requires fair treatment including clear information, suitable products, and proper complaint handling.'),
    Q('Why must insurance products be approved by NAICOM before sale?',['To ensure products meet regulatory standards and protect consumers','To increase the cost of insurance','To limit the number of products available','To give NAICOM a commission'],0,'Product approval ensures policies meet legal standards and provide adequate consumer protection.'),
    Q('What happens if an advisor operates without a valid NAICOM license?',['Nothing — it is common practice','They can be fined or imprisoned for illegal insurance activity','They just need to register later','Only companies need licences, not individuals'],1,'Operating without a license is illegal under the Insurance Act and can result in penalties or prosecution.')
  ]),
  hScript('Lesson 3: NAICOM & the Regulatory Framework',[
    'NAICOM is the agency that regulates every aspect of insurance in Nigeria. Licensed by NAICOM, governed by the Insurance Act 2003. If it involves insurance in Nigeria, NAICOM has a say.',
    'NAICOM sets capital requirements, approves products, monitors solvency, enforces market conduct, and protects consumers. The Treating Customers Fairly framework means you must provide clear information, recommend suitable products, and handle complaints properly.',
    'Regulatory knowledge sets professional advisors apart. When clients ask "Is this legit?" you can answer with confidence. When competitors cut corners, you operate by the book. That is the CoverScore standard.'
  ]),
  hWorkbook([
    {t:'Regulatory Compliance Checklist',i:'Create a checklist of regulatory requirements you must follow in your advisory practice.',p:['Licensing requirements for you and your organisation','Product approval verification process','TCF principles and how to apply each','Complaint handling procedure','Record-keeping requirements']},
    {t:'TCF Self-Audit',i:'Review your last 5 client interactions against TCF principles.',p:['Did you provide clear information?','Was the product suitable for the client\'s needs?','Did the client understand what they were buying?','How would you handle a complaint from these clients?']}
  ]),
  hCase('Case Study: The Unlicensed Broker','A client tells you they have been buying insurance from someone who is not a licensed broker or agent. The person collects premiums in cash, provides no policy documents, and has never issued a receipt. The client has paid over ₦500,000 over two years but has no proof of coverage.',[
    'What regulatory violations are occurring in this situation?',
    'What risks does the client face having paid premiums with no valid policy?',
    'What steps should you advise the client to take?',
    'Draft a report to NAICOM about this situation.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'NAICOM Regulatory Framework Summary',description:'Key regulations every advisor must know'},
    {url:'#',type:'link',title:'NAICOM Official Website',description:'Access circulars, guidelines, and licensed entity lists'}
  ])
);

C2[4] = L(
  hContent('Lesson 4: Insurance Products in the Nigerian Market',[
    'Understand the major categories of insurance products available in Nigeria',
    'Match client needs to appropriate product solutions',
    'Explain product features, benefits, and exclusions to clients clearly'
  ],[
    P('Nigerian insurers offer a wide range of products across life and general insurance. Understanding what exists — and what does not yet exist — enables you to match client needs to solutions accurately.'),
    T('Major Product Categories',['Category','Examples','Who Needs It'],[['Life Assurance','Term, Whole Life, Endowment, Group Life','Individuals, families, employers'],['Health Insurance','HMO, Health Cover, Critical Illness','Individuals, families, employers'],['Motor Insurance','Third Party, Comprehensive','Vehicle owners'],['Property Insurance','Fire, Burglary, All Risks, Public Liability','Homeowners, businesses, landlords'],['Marine & Aviation','Cargo, Hull, Aviation','Importers, exporters, transporters'],['Oil & Gas','Upstream, Downstream, Liability','Energy sector companies'],['Agriculture','Crop, Livestock, Aquaculture','Farmers, agribusinesses'],['Engineering','Contractors All Risks, Erection','Construction firms, project owners'],['Travel Insurance','Medical, Baggage, Trip Cancellation','Travellers'],['Bonds','Performance, Bid, Customs','Contractors, importers']]),
    SE('Life Insurance Products','Term assurance provides coverage for a specific period — pure protection, no savings component. Whole life covers the entire lifetime with a guaranteed payout. Endowment combines protection with savings, paying out at maturity or on death. Group life is employer-provided coverage for employees.'),
    SE('General Insurance Products','Motor insurance: third-party (minimum legal requirement) or comprehensive. Property: fire, burglary, all risks, and public liability. Marine: cargo in transit. Agriculture: crop and livestock protection. Engineering: construction project risks.'),
    C('Product knowledge is your toolkit. The broader your understanding, the more creative and precise your solutions. But never recommend a product you do not fully understand — client trust is built on accuracy, not volume.')
  ],[
    'Life products: term, whole life, endowment, group life — each serves a different protection need',
    'General products: motor, property, marine, agriculture, engineering, oil & gas, bonds',
    'Match products to genuine client needs — never recommend what you do not fully understand',
    'Product knowledge enables creative, precise protection solutions'
  ]),
  hQuiz([
    Q('Which life insurance product combines protection with a savings component?',['Term assurance','Whole life','Endowment','Group life'],2,'Endowment insurance pays out at maturity or on death, combining protection with a savings element.'),
    Q('What is the minimum legal motor insurance requirement in Nigeria?',['Comprehensive cover','Third-party cover','Full insurance','Premium cover'],1,'Third-party motor insurance is the minimum legal requirement under the Insurance Act.'),
    Q('A construction company needs insurance for a building project. Which product type is most appropriate?',['Motor insurance','Engineering insurance (Contractors All Risks)','Marine insurance','Life insurance'],1,'Contractors All Risks insurance covers construction projects, materials, and liability during the construction period.'),
    Q('Which product category would cover an importer\'s goods while in transit?',['Property insurance','Marine cargo insurance','Motor insurance','Bonds'],1,'Marine cargo insurance covers goods while in transit by sea, air, or land.'),
    Q('Group life insurance is typically provided by:',['The government','Employers for their employees','Insurance brokers','Banks'],1,'Group life insurance is provided by employers as a benefit for their employees.')
  ]),
  hScript('Lesson 4: Insurance Products in the Nigerian Market',[
    'To advise clients well, you need to know what products exist. Nigeria has a full range of life, health, motor, property, marine, agriculture, engineering, and specialised products.',
    'Life insurance includes term assurance, whole life, endowment, group life, and annuities. General insurance covers everything from motor and property to complex oil and gas risks and construction bonds.',
    'Your product knowledge is your professional toolkit. The more you understand, the better you can design solutions. But never recommend a product you do not fully understand. Accuracy builds trust; guesswork destroys it.'
  ]),
  hWorkbook([
    {t:'Product Matching Exercise',i:'For each client scenario below, recommend the most appropriate product(s):',p:['A 35-year-old father wants family income protection','A bakery owner in a market with fire risk','A trader importing electronics from China','A hospital needing liability cover','A farmer with 500 cattle']},
    {t:'Product Deep Dive',i:'Choose one product you frequently recommend. List 5 features, 3 benefits, and 2 exclusions.',p:['Features: what does the policy cover?','Benefits: why does the client need it?','Exclusions: what is NOT covered?','How do you explain exclusions without creating distrust?']}
  ]),
  hCase('Case Study: The Confused Product Buyer','Mrs. Duru wants to "insure everything." She has a small restaurant, a car, a house, and two children in school. She has talked to three different agents and received different recommendations: one says term life, another says endowment, a third says she should just insure the car because that is the law.',[
    'Identify the specific insurance needs for each asset and liability Mrs. Duru has.',
    'Recommend a complete protection plan with specific product types for each risk.',
    'Prioritise — what should she buy first if she has a limited budget?',
    'Explain each recommendation in simple terms she would understand.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Insurance Product Reference Guide',description:'Comprehensive overview of all product categories with features'},
    {url:'#',type:'link',title:'Nigerian Insurer Product Portfolios',description:'Links to major Nigerian insurer product pages for research'}
  ])
);

C2[5] = L(
  hContent('Lesson 5: Distribution Channels & Market Access',[
    'Understand the full range of insurance distribution channels in Nigeria',
    'Evaluate the strengths and limitations of each channel',
    'Position yourself effectively within the distribution landscape'
  ],[
    P('Insurance products reach customers through multiple distribution channels. Each channel has distinct advantages and limitations. Understanding the landscape helps you position your advisory practice for maximum impact.'),
    T('Distribution Channels Comparison',['Channel','Strengths','Limitations'],[['Direct Agents','Personal relationships, local knowledge, trust','Limited product range, dependent on one insurer'],['Insurance Brokers','Independent advice, market-wide access, claims support','Perceived as expensive, concentrated in cities'],['Bancassurance','Bank trust, customer base, convenience','Limited to partner insurer, product push focus'],['Direct (Online/Mobile)','Low cost, scalable, 24/7 access','Low trust, complex products unsuitable'],['Corporate/Tied','Stable employer relationships, group access','Narrow focus, limited to employee benefits'],['Microinsurance','Reaches low-income, affordable premiums','Low margins, distribution cost challenges']]),
    SE('The Agent Channel — Backbone of Distribution','With over 50,000 registered agents, the agent channel is the largest distribution force in Nigerian insurance. Agents build personal relationships and often serve communities that formal channels do not reach. The challenge: many agents lack adequate training and professional development.'),
    SE('The Broker Channel — Independent Expertise','Brokers hold themselves out as independent advisors. They assess client needs, shop the market, and recommend the best fit. Brokers are regulated by NAICOM, must pass exams, and carry professional indemnity insurance. The broker model aligns closely with the CoverScore approach.'),
    SE('Digital Distribution — The Future','Insurtech platforms, mobile apps, and online comparison sites are growing. Digital channels work well for simple, standardised products like travel insurance and motor insurance. Complex advisory still requires human expertise — and that is where you excel.'),
    C('Distribution is changing — but the need for trusted human advisors is not disappearing. Digital channels handle commoditised products. Complex risks, family protection, and business insurance require what only a skilled advisor can provide. The future is hybrid, not replacement.')
  ],[
    'Multiple channels serve the Nigerian market: agents, brokers, bancassurance, digital, corporate, microinsurance',
    'Agents are the largest channel by numbers; brokers provide independent, market-wide advice',
    'Digital channels handle simple products; complex advisory needs human expertise',
    'The future of distribution is hybrid — technology plus trusted advisors'
  ]),
  hQuiz([
    Q('Which distribution channel employs the largest number of insurance professionals in Nigeria?',['Bancassurance','Insurance brokers','Direct agents','Digital platforms'],2,'With over 50,000 registered agents, the agent channel is the largest distribution force.'),
    Q('What is the key advantage of using a broker rather than a direct agent?',['Brokers charge lower premiums','Brokers provide independent advice and access to multiple insurers','Brokers are not regulated','Brokers only sell life insurance'],1,'Brokers provide independent, market-wide advice and can compare products across insurers.'),
    Q('Which type of product is best suited for digital distribution?',['Complex business insurance','Family protection planning','Simple standardised products like travel insurance','Oil and gas insurance'],2,'Simple, standardised products with clear terms work best for digital distribution.'),
    Q('What is bancassurance?',['Insurance sold by brokers','Insurance distributed through banks','Insurance for bank employees','Government-provided insurance'],1,'Bancassurance is the distribution of insurance products through banking channels.'),
    Q('Microinsurance is designed for:',['High-net-worth individuals','Large corporations','Low-income individuals and informal sector workers','Government entities'],2,'Microinsurance provides affordable protection for low-income populations and informal sector workers.')
  ]),
  hScript('Lesson 5: Distribution Channels & Market Access',[
    'How does insurance reach customers in Nigeria? Through many routes: agents, brokers, banks, digital platforms, and more.',
    'Agents are the backbone — over 50,000 strong, reaching communities that formal channels miss. Brokers provide independent, expert advice across the whole market. Digital channels are growing fast, especially for simple products.',
    'Each channel has its place. Your role as an advisor is to understand where you fit — and to deliver value that technology cannot replace. Trust, judgment, and genuine care for client outcomes.'
  ]),
  hWorkbook([
    {t:'Channel Assessment',i:'For each channel, identify which client segments it serves best and what types of products it distributes effectively.',p:['Agents: best for which clients and products?','Brokers: best for which clients and products?','Bancassurance: best for which clients?','Digital: best for which products?']},
    {t:'Your Channel Strategy',i:'Define your personal distribution approach. Which channels do you use? Which will you develop?',p:['What channels do you currently use?','What channels are underutilised in your practice?','What would it take to develop a new channel?','How does the CoverScore approach improve your channel effectiveness?']}
  ]),
  hCase('Case Study: The Digital Disruptor','An insurtech startup has launched a mobile app that sells motor insurance in under 3 minutes — no paperwork, instant policy document, 15% cheaper than traditional agents. Several of your existing clients have started using it. Your agency commission is 20% on motor policies.',[
    'How do you compete with a digital product that is faster and cheaper?',
    'What additional value do you provide that the app cannot?',
    'Should you try to match the price, differentiate on service, or something else?',
    'Draft a message to a client explaining why your service adds value beyond the app.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Distribution Channels Reference Guide',description:'Comparison of all distribution channels with key metrics'},
    {url:'#',type:'link',title:'NAICOM Guidelines on Bancassurance',description:'Regulatory framework for bank distribution of insurance'}
  ])
);

C2[6] = L(
  hContent('Lesson 6: Industry Challenges & Opportunities',[
    'Identify the major challenges facing Nigerian insurance',
    'Understand how these challenges affect client perceptions',
    'Position yourself to turn industry challenges into advisory opportunities'
  ],[
    P('The Nigerian insurance industry faces significant hurdles. Understanding them honestly — without sugar-coating — helps you address client concerns credibly and position yourself as part of the solution.'),
    T('Industry Challenges',['Challenge','Impact','Advisor Opportunity'],[['Low Public Trust','Claims payment delays erode confidence','Be transparent about claims process; guide clients through it'],['Low Penetration','Limited market size, slow growth','Massive untapped market; first-mover advantage'],['Capitalisation Issues','Some insurers undercapitalised','Know insurer financial strength; recommend stable companies'],['Product Complexity','Policies hard for laypersons to understand','Translate jargon; simplify for clients'],['Distribution Gaps','Rural areas underserved','Reach underserved communities with microinsurance'],['Regulatory Compliance','Cost of compliance high for firms','Compliance is your differentiator; be the trusted professional'],['Talent Shortage','Few qualified insurance professionals','Your CCA qualification sets you apart']]),
    SE('Trust: The Biggest Challenge','Years of stories about unpaid claims, slow claim processing, and opaque practices have created deep distrust. Many Nigerians simply do not believe insurers will pay. Addressing this honestly is the first step to building your advisory practice.'),
    SE('The Opportunity in Transparency','Every time you explain a policy clearly, help file a claim properly, or follow up until payment is made, you rebuild trust — one client at a time. Transparency is not just ethical; it is your competitive advantage.'),
    C('Every challenge in this industry is an opportunity for a professional advisor. Low trust? Be transparent. Low penetration? Educate relentlessly. Complex products? Simplify them. The market rewards professionals who solve real problems.')
  ],[
    'Low public trust is the single biggest challenge — claims payment delays and opaque practices',
    'Low penetration means massive untapped demand, especially among SMEs and individuals',
    'Product complexity creates a gap for advisors who can simplify and educate',
    'Every challenge is an opportunity for transparent, professional advisors'
  ]),
  hQuiz([
    Q('What is the single biggest challenge facing the Nigerian insurance industry?',['Too many insurance companies','Low public trust due to claims payment concerns','Lack of product variety','Government interference'],1,'Low public trust, driven by claims payment delays and opaque practices, is the biggest challenge.'),
    Q('How should an advisor respond when a client says "insurance companies never pay"?',['Ignore the concern and push for a sale','Acknowledge the concern, explain the claims process, share examples of paid claims','Agree and say insurance is not for everyone','Tell them they are wrong'],1,'Acknowledge the concern honestly, then educate about how claims work — that builds credible trust.'),
    Q('What makes product complexity an advisor opportunity?',['It makes insurance hard to understand so fewer people buy it','Advisors who can simplify complex products and educate clients add real value','Complex products have higher commissions','Complexity is not an opportunity'],1,'Advisors who can translate jargon and simplify complex products for clients provide genuine value.'),
    Q('How can an advisor use regulatory compliance as a differentiator?',['Ignore compliance and focus on sales','Position yourself as the professional who follows the rules — clients trust that','Regulatory compliance makes insurance more expensive','Compliance is irrelevant to clients'],1,'Positioning yourself as a compliant, professional advisor builds trust compared to unregulated or informal providers.'),
    Q('What segment represents the biggest growth opportunity for advisors?',['Large multinational corporations','The informal sector and SMEs','Government agencies','International clients'],1,'The underserved SME and informal sector represents the largest growth opportunity given low current penetration.')
  ]),
  hScript('Lesson 6: Industry Challenges & Opportunities',[
    'Let us be honest: the Nigerian insurance industry has challenges. Low trust, low penetration, product complexity, and distribution gaps are real. But every challenge is an opportunity for a professional advisor.',
    'Trust is the biggest issue. Decades of stories about claims not being paid have created deep scepticism. The way you overcome this is not by arguing — it is by being transparent, following through, and demonstrating that you are different.',
    'Low penetration means millions need what you offer. Complex products mean clients need someone to simplify them. Distribution gaps mean whole communities are waiting to be served. The industry rewards professionals who solve real problems.'
  ]),
  hWorkbook([
    {t:'Challenge-Opportunity Mapping',i:'For each major industry challenge, write a specific action you will take to turn it into an opportunity.',p:['Low trust: what specific actions build trust?','Low penetration: who specifically needs education?','Product complexity: how will you simplify?','Distribution gaps: where can you reach?','Talent shortage: how does CCA set you apart?']},
    {t:'Trust-Building Action Plan',i:'Create a 5-step plan to build trust with a new client who is sceptical about insurance.',p:['Step 1: How do you open the conversation?','Step 2: What do you share about claims?','Step 3: How do you demonstrate transparency?','Step 4: How do you follow through?','Step 5: How do you ask for referrals?']}
  ]),
  hCase('Case Study: The Sceptical Business Association','The Apapa Business Association has 200+ member businesses. They have had negative experiences with insurance — claims taking 18+ months, unexplained deductions, and poor communication. Their chairman says "insurance is a waste of money." A member who trusts you asks you to address the association.',[
    'How do you address the chairman\'s statement without being defensive?',
    'What specific evidence or examples would you share to rebuild credibility?',
    'Design a "Transparency Pledge" you would make to the association as their advisor.',
    'What is your 90-day plan to win trust and convert members?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Nigerian Insurance Industry Challenges Report',description:'Detailed analysis of industry challenges with data sources'},
    {url:'#',type:'link',title:'NIA — Industry Development Initiatives',description:'Industry association programmes addressing challenges'}
  ])
);

C2[7] = L(
  hContent('Lesson 7: Module 2 Knowledge Check & Case Study',[
    'Synthesise all Module 2 concepts: industry structure, players, regulation, products, distribution, challenges',
    'Apply integrated market knowledge to complex client scenarios',
    'Demonstrate readiness to advise clients within the Nigerian insurance market'
  ],[
    SE('Module 2 Recap','You have covered: the Nigerian insurance market structure and protection gap, key players in the ecosystem, NAICOM and the regulatory framework, insurance products available in the market, distribution channels, and industry challenges and opportunities.'),
    SE('Integrated Market Knowledge','The best advisors do not operate in silos. When you advise a client, you draw on market context (Module 2 Lesson 1), knowledge of players (L2), regulatory requirements (L3), product options (L4), distribution access (L5), and awareness of challenges and how to overcome them (L6).'),
    C('This lesson assesses your ability to apply Module 2 knowledge to real-world scenarios. There is no separate multiple-choice quiz — your learning is assessed through the comprehensive case study below.')
  ],[
    'Nigeria has a low-penetration, high-potential insurance market with unique characteristics',
    'The ecosystem includes insurers, intermediaries, reinsurers, and regulators — each with distinct roles',
    'NAICOM regulates the industry; the Insurance Act 2003 and TCF framework govern market conduct',
    'Product knowledge, distribution awareness, and honest handling of industry challenges set professionals apart'
  ]),
  hQuiz([
    Q('What is the primary reason for Nigeria\'s low insurance penetration?',['Insurance is too expensive for everyone','Low awareness, trust issues, and products not meeting customer needs','There are not enough insurance companies','Insurance is not legally required'],1,'Low awareness, trust concerns from poor claims experiences, and products not aligned with customer needs are the primary causes.'),
    Q('A client asks if their policy is valid. Who should they verify with?',['The police','NAICOM','The insurance agent','The bank'],1,'NAICOM licences all insurers and can verify whether a company is authorised to sell insurance.'),
    Q('Which distribution channel provides independent, market-wide advice?',['Direct agent','Bancassurance','Insurance broker','Digital platform'],2,'Insurance brokers provide independent advice and can access products across multiple insurers.'),
    Q('Endowment insurance combines:',['Health and motor cover','Protection and investment/savings','Property and liability','Marine and aviation'],1,'Endowment combines life protection with a savings component.'),
    Q('How should an advisor respond to the trust challenge?',['Ignore it — focus on price','Be transparent, educate clients, follow through on claims support','Promise guaranteed claim payments','Avoid discussing claims'],1,'Transparency, education, and reliable claims support are the most effective trust-building strategies.')
  ]),
  hScript('Lesson 7: Module 2 Knowledge Check & Case Study',[
    'This lesson is your Module 2 knowledge check. You have covered the Nigerian insurance market structure, key players, regulatory framework, products, distribution channels, and industry challenges.',
    'Now it is time to apply everything to a comprehensive case study that draws on all six lessons. This is not about memorising facts — it is about integrated thinking.',
    'Take your time with the case study. Think deeply. Apply market knowledge, regulatory understanding, product awareness, and distribution insight to a real-world scenario.'
  ]),
  hWorkbook([
    {t:'Module 2 Synthesis',i:'Create a one-page summary of Module 2 as if presenting to a new advisor. Include: market structure, players, regulation, products, channels, and challenges.',p:['What are the top 3 market facts every advisor must know?','How do the different players interact?','What regulatory requirements affect daily advisory work?','How do you overcome the trust challenge?']},
    {t:'Advisor Readiness Self-Assessment',i:'Rate your confidence (1-5) on each Module 2 topic and identify areas for further study.',p:['Market structure and protection gap','Key players and their roles','Regulatory framework and NAICOM','Product categories and matching','Distribution channels','Industry challenges and trust-building']}
  ]),
  hCase('Comprehensive Case Study: The Alhaji Yusuf Group','Alhaji Yusuf is a 58-year-old business owner in Kano. He owns: a textile factory with 200 employees (annual revenue ₦350M), 3 residential properties (Lagos, Abuja, Kano — total value ₦250M), a fleet of 12 delivery trucks, and a 50% stake in an agricultural farm (cassava and rice). Current insurance: comprehensive motor on 4 of 12 trucks, fire insurance on the factory building only (₦80M sum insured), no life insurance, no health insurance, no business interruption, no keyman cover. His concerns: "insurance is too expensive," "claims take forever," and "I trust my brother who handles everything." The factory has had two fire incidents in 5 years (minor, but growing frequency). Two of his trucks were involved in accidents last year — one claim is still unpaid after 14 months.',[
    'Map ALL risks across his business empire — property, liability, life, health, business interruption, keyman.',
    'Identify which existing covers are inadequate (e.g., factory sum insured, only 4/12 trucks insured).',
    'Calculate the protection gap for each risk category with estimated sums insured.',
    'How do you address his three concerns (expensive, claims delay, trust in brother) without being dismissive?',
    'Design a prioritised protection plan — what does he buy first, second, third — with rationale.',
    'Recommend a specific distribution approach (broker, agent, or direct?) and justify why.',
    'Explain how regulatory knowledge (compulsory insurance, TCF) affects your recommendations.',
    'Draft a 60-second opening statement for your first meeting with Alhaji Yusuf.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Module 2 Market Reference Guide',description:'Complete summary of Nigerian insurance market ecosystem'},
    {url:'#',type:'doc',title:'Case Study Worksheet — Alhaji Yusuf Group',description:'Structured worksheet for comprehensive case analysis'}
  ])
);

C2[8] = L(
  hContent('Lesson 8: The CoverScore Assessment Framework',[
    'Understand the CoverScore Assessment Framework and its components',
    'Explain how the framework transforms client conversations',
    'Use the framework to structure your advisory process'
  ],[
    P('The CoverScore Assessment Framework is the proprietary methodology that powers the CoverScore platform. It transforms insurance advisory from product-pushing to data-driven risk consulting. This lesson is your introduction to the framework — CCA 103 will cover it in depth.'),
    T('The CoverScore Framework Components',['Component','What It Does','Client Benefit'],[['CoverScore (0-100)','Single numerical risk score','Clear, comparable risk rating'],['Risk Fingerprint','Multi-dimensional visual profile','See risks across all categories at a glance'],['Exposure Index','Measures severity of each exposure','Know which risks could cause the most damage'],['Protection Gap','Identifies gaps between risks and coverage','See exactly what is missing'],['Risk DNA','Root cause analysis of risk patterns','Understand why risks exist, not just what they are']]),
    OL('The Advisory Process',['ASSESS — Guide the client through a structured risk assessment covering all relevant categories. Data is collected systematically, not through casual conversation.','SCORE — The platform calculates the CoverScore (0-100), benchmarking the client against industry standards and providing an objective risk rating.','ANALYSE — Review the Risk Fingerprint with the client. Identify the top exposures, the biggest protection gaps, and the underlying Risk DNA.','RECOMMEND — Present prioritised recommendations based on data, not intuition. Each recommendation addresses a specific gap identified in the analysis.','MONITOR — Schedule regular reviews. Risk changes — new assets, new family members, business growth. The CoverScore is a living metric.'],'The CoverScore framework follows a structured five-step process:'),
    C('The CoverScore Assessment Framework is your competitive advantage. While other advisors lead with products, you lead with data. While others guess what clients need, you show them. This framework transforms you from a salesperson into a trusted risk consultant.')
  ],[
    'The CoverScore Assessment Framework: Score, Risk Fingerprint, Exposure Index, Protection Gap, Risk DNA',
    'The five-step process: Assess, Score, Analyse, Recommend, Monitor',
    'The framework transforms advisors from product sellers to data-driven risk consultants',
    'Clients see, understand, and trust recommendations backed by data'
  ]),
  hQuiz([
    Q('What does the CoverScore (0-100) represent?',['A credit rating','An overall risk rating for the client','The price of the recommended policy','The commission the advisor earns'],1,'The CoverScore is a single numerical risk rating from 0 (high risk) to 100 (low risk).'),
    Q('Which component identifies gaps between existing coverage and actual risk exposure?',['Risk Fingerprint','Exposure Index','Protection Gap','Risk DNA'],2,'The Protection Gap component specifically identifies where coverage is missing or inadequate.'),
    Q('What is the first step in the CoverScore advisory process?',['Analyse','Recommend','Assess','Monitor'],2,'The first step is ASSESS — systematically gathering data through the risk assessment.'),
    Q('How does the Risk Fingerprint differ from the CoverScore?',['They are the same thing','The Score is a single number; the Fingerprint is a multi-dimensional visual profile','The Fingerprint replaces the Score','The Fingerprint is only for businesses'],1,'The CoverScore is a single overall rating. The Risk Fingerprint shows multi-dimensional risk exposure across categories.'),
    Q('What makes the CoverScore approach different from traditional advisory?',['It is faster','It is data-driven rather than product-driven','It is only available online','It replaces human advisors with AI'],1,'The CoverScore approach is fundamentally data-driven — recommendations are based on systematic risk assessment, not product availability.')
  ]),
  hScript('Lesson 8: The CoverScore Assessment Framework',[
    'The CoverScore Assessment Framework is the heart of our methodology. Five components: CoverScore, Risk Fingerprint, Exposure Index, Protection Gap, and Risk DNA. And a five-step process: Assess, Score, Analyse, Recommend, Monitor.',
    'The CoverScore gives every client a clear, objective risk rating from 0 to 100. The Risk Fingerprint shows their risk profile across multiple dimensions. The Exposure Index measures severity. The Protection Gap shows what is missing. The Risk DNA reveals why.',
    'This framework transforms how clients see you. You are no longer selling insurance products — you are delivering risk intelligence. You start with data, not a sales pitch. You show clients what they need, then recommend solutions. That is the CoverScore difference.'
  ]),
  hWorkbook([
    {t:'Five-Step Process Walkthrough',i:'For a client you currently work with, write what each CoverScore step would look like.',p:['Assess: what categories of data would you collect?','Score: what score range do you expect and why?','Analyse: which gaps would the Fingerprint reveal?','Recommend: what would be your top 3 recommendations?','Monitor: when and how would you follow up?']},
    {t:'Client Conversation Script',i:'Write a script for explaining the CoverScore framework to a client in under 2 minutes — no jargon.',p:['How do you describe the CoverScore?','How do you explain the Risk Fingerprint?','How do you describe the process?','How do you close with a call to action?']}
  ]),
  hCase('Case Study: Pitching the Framework','A corporate client — a medium-sized logistics company with 50 vehicles, a warehouse, and 120 employees — has been buying insurance from the same broker for 10 years. They know you. They like you. But they see no reason to switch. Their current broker provides annual renewal quotes with no analysis, no review, and no claims support.',[
    'How do you differentiate the CoverScore framework from what their current broker provides?',
    'Walk through the five-step process as if presenting to their CFO.',
    'What specific data would you collect in the Assess step?',
    'What is the single most compelling reason for them to switch to a CoverScore advisor?',
    'Draft a 90-second pitch comparing the "old way" to the "CoverScore way."'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'CoverScore Assessment Framework Overview',description:'One-page summary of components and process'},
    {url:'#',type:'link',title:'CoverScore Advisor Platform Guide',description:'Guide to using the CoverScore platform with clients'}
  ])
);

// ═══════════════════════════════════════════════════════════════════
// COURSE 3: CCA-103 — The CoverScore Methodology (8 lessons)
// ═══════════════════════════════════════════════════════════════════

const C3 = {};

C3[1] = L(
  hContent('The CoverScore Philosophy: Risk Before Product',[
    'Understand why risk profiling comes before product discussion',
    'Differentiate the CoverScore approach from traditional insurance advisory',
    'Articulate the "Risk Before Product" philosophy to clients',
    'Recognise how this philosophy builds trust and improves outcomes'
  ],[
    T('The Old Way: Product-First Selling',['Dimension','Traditional Approach','CoverScore Approach'],[
      ['Starting Point','Starts with product features and price','Starts with client risk profile and needs'],
      ['Primary Driver','Price-driven — compete on cost','Value-driven — compete on insight'],
      ['Nature of Interaction','Transactional — sell policy, move on','Relational — ongoing risk partnership'],
      ['Conversation Dynamic','Advisor talks, client listens','Client engages through assessment'],
      ['Client Perception','Salesperson pushing a product','Trusted advisor solving problems'],
      ['Outcome Measurement','Policies sold and premiums collected','Gaps closed and scores improved']
    ]),
    SE('Why Risk First?','You cannot recommend the right protection without understanding what is at risk. In medicine, a doctor diagnoses before prescribing. In insurance, most advisors prescribe before diagnosing. The CoverScore approach flips this: assess risk first, then recommend solutions. When you start with risk, every recommendation is grounded in the client\'s actual exposure — not a sales target.'),
    SE('The Trust Dividend','Starting with risk assessment transforms how clients perceive you. Clients who feel understood are far more likely to act on recommendations. When you lead with questions about their family, their business, their goals — before mentioning a single product — you signal that their wellbeing matters more than your commission. Trust is the currency of advisory.'),
    SE('The Advisor as Risk Architect','Think of yourself as a risk architect. Every client has a unique risk blueprint — their family structure, income sources, assets, liabilities, health, and goals. Your job is to design a protection structure that fits that blueprint. An architect does not sell bricks; they design buildings. You do not sell policies; you design protection.'),
    C('When you lead with risk, clients feel understood. When you lead with product, clients feel sold to. The difference is trust.')
  ],[
    'Risk profiling must come before product discussion — diagnose before prescribing',
    'The CoverScore approach is relational and value-driven, not transactional and price-driven',
    'Leading with risk transforms client perception from salesperson to trusted advisor',
    'The advisor is a risk architect designing protection around the client\'s unique blueprint'
  ]),
  hQuiz([
    Q('How does the CoverScore approach differ from traditional insurance advisory?',['It focuses on finding the cheapest products','It starts with the client\'s risk profile before discussing products','It sells policies faster than traditional methods','It avoids client conversations entirely'],1,'CoverScore starts with risk assessment, not product discussion — diagnose before prescribe.'),
    Q('What is the primary driver of traditional insurance sales?',['Value and insight','Client needs and goals','Price and product features','Long-term relationships'],2,'Traditional insurance is primarily price-driven and product-focused, competing on cost rather than insight.'),
    Q('According to the lesson, how does leading with risk affect client trust?',['Clients become more sceptical','Clients feel understood and are more likely to act on recommendations','Clients prefer the traditional approach','Trust is not affected by the starting point'],1,'Clients who feel understood are significantly more likely to act on recommendations — trust is built through understanding.'),
    Q('The medicine analogy in the lesson compares risk assessment to:',['Surgery','Diagnosis before prescription','Preventive medicine','Emergency treatment'],1,'Just as a doctor diagnoses before prescribing treatment, an advisor should assess risk before recommending products.'),
    Q('What does it mean to be a "risk architect"?',['Selling building insurance for construction projects','Designing a protection structure based on the client\'s unique risk blueprint','Architecting digital insurance platforms','Managing insurance company risk departments'],1,'A risk architect designs protection around the client\'s unique circumstances — like an architect designing a building around a client\'s needs.')
  ]),
  hScript('The CoverScore Philosophy: Risk Before Product',[
    'Most insurance advisors lead with products. "Here is a policy, here is the price, let me show you why it is better than the competition." This is product-first selling. It is the norm in Nigeria and around the world. But it has a fundamental flaw: it starts with the solution before understanding the problem.',
    'The CoverScore philosophy is simple: Risk Before Product. You cannot recommend protection until you understand what is at risk. A doctor does not prescribe medication before diagnosis. A builder does not lay foundations without a blueprint. An advisor should not recommend insurance without a risk assessment.',
    'When you start with risk, everything changes. Clients feel heard. They see you as someone who genuinely cares about their situation. They trust your recommendations because those recommendations are grounded in their specific needs — not because you are trying to meet a sales target.',
    'As a CoverScore advisor, you are a risk architect. Your clients have unique risk blueprints: their family, income, assets, health, and dreams. Your job is to design protection that fits. Not to sell products. To design protection. That is the CoverScore difference.'
  ]),
  hWorkbook([
    {t:'Elevator Pitch: Risk Before Product',i:'Write a 30-second elevator pitch that explains the "Risk Before Product" philosophy to a potential client. No jargon. No insurance terms.',p:['What is the one-sentence hook that captures attention?','How do you explain the difference between traditional and CoverScore?','How do you close in a way that invites a conversation?']},
    {t:'Self-Audit: Your Last Three Client Conversations',i:'Think back to your last three client interactions. For each, answer honestly:',p:['Did you start by asking about their risks or by talking about products?','What percentage of the conversation was listening vs talking?','How would the conversation have been different if you led with risk?','What was the client\'s energy level — engaged or politely waiting?']}
  ]),
  hCase('The Over-Sold Client','Mr. Ibrahim is a 45-year-old business consultant in Abuja. Over the past 8 years, five different insurance agents have sold him policies — each without asking what he already had or what he actually needed. He now has: three separate life policies from three different companies (total sum assured NGN25M, but two are endowments with low cover), a health plan that excludes his pre-existing hypertension, a motor policy that has lapsed twice, two education savings plans for children he does not have, no business interruption cover, no disability cover, and no income protection. He is paying approximately NGN1.2M annually in premiums. His total real protection gap exceeds NGN200M. He is frustrated, confused, and convinced "insurance is a waste of money."',[
    'Analyse Mr. Ibrahim\'s current portfolio: what is redundant, what is inadequate, and what is missing entirely?',
    'How do you reset the conversation using Risk Before Product? Write your opening statement.',
    'Conduct a full risk assessment — what are his real exposures as a 45-year-old business consultant with hypertension?',
    'Design a right-sized protection plan: what should he keep, cancel, and add? Prioritise and estimate sums assured with NGN amounts.',
    'How do you rebuild his trust given his history with five previous agents? What specific actions demonstrate you are different?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk Before Product — Philosophy One-Pager',description:'One-page summary of the CoverScore philosophy for client conversations'},
    {url:'#',type:'pdf',title:'Risk Before Product — Conversation Guide',description:'Step-by-step guide to leading with risk in every client interaction'}
  ])
);

C3[2] = L(
  hContent('The Universal Risk Taxonomy',[
    'Understand the structure and purpose of the Universal Risk Taxonomy',
    'Navigate the hierarchy of domains, pillars, objects, and exposures',
    'Identify where any client risk fits within the taxonomy',
    'Use the taxonomy to ensure no risk category is overlooked'
  ],[
    SE('What Is a Risk Taxonomy?','A risk taxonomy is a classification system that organises all possible risks into a structured hierarchy. Think of it like the Dewey Decimal System for libraries — but for risk. Every risk a client faces can be placed somewhere in the taxonomy. If it does not fit, it has not been classified correctly. The Universal Risk Taxonomy covers every dimension of risk from personal to enterprise.'),
    T('The Taxonomy Hierarchy',['Level','Description','Example'],[
      ['Domain','Broad category of risk','Personal, Business, Asset, Liability, Enterprise'],
      ['Pillar','Risk grouping within a domain','Health, Property, Liability, Operations'],
      ['Object','Specific item or interest at risk','Primary earner\'s income, Residential building'],
      ['Exposure','Specific threat to the object','Death, disability, illness, fire, theft'],
      ['Event','Trigger that activates the threat','Medical diagnosis, fire outbreak, accident'],
      ['Consequence','Outcome of the event materialising','Loss of income, property damage, legal liability'],
      ['Impact','Financial quantification of the consequence','NGN5M/year lost income, NGN15M property damage'],
      ['Protection','Existing coverage in place','None, partial, or adequate'],
      ['Gap','Shortfall between impact and protection','NGN3M uncovered income risk, NGN10M property gap'],
      ['Action','Recommended remedy to close the gap','Term assurance, property insurance, liability cover']
    ]),
    Ls('The Five Domains',[
      {l:'Personal Domain',d:'Risks affecting individuals and families — health, life, income, education, retirement. Every human being has personal risks that need assessment.'},
      {l:'Business Domain',d:'Risks affecting commercial enterprises — operations, revenue, employees, supply chain, equipment. Businesses face unique risks beyond personal exposure.'},
      {l:'Asset Domain',d:'Risks to physical and digital assets — property, vehicles, equipment, intellectual property, data. Assets represent stored value that needs protection.'},
      {l:'Liability Domain',d:'Risks of legal or regulatory exposure — public liability, professional indemnity, product liability, compliance. Liabilities can destroy a lifetime of wealth in a single judgment.'},
      {l:'Enterprise Domain',d:'Strategic and systemic risks — market shifts, reputation damage, regulatory change, competitive threats. These affect the long-term viability of any organisation.'}
    ],'The taxonomy is organised into five domains:'),
    SE('Using the Taxonomy in Advisory','The Universal Risk Taxonomy is not just a theoretical model — it is your daily checklist. Before you finalise any client risk profile, walk through every domain, every pillar, and verify that each object has been considered. If a risk has not been placed somewhere in the taxonomy, you have not found it yet. This systematic approach guarantees no category is overlooked and no gap goes unidentified.'),
    C('The Universal Risk Taxonomy is your checklist. If you haven\'t placed a risk somewhere in the taxonomy, you haven\'t found it yet. Use it systematically.')
  ],[
    'The Universal Risk Taxonomy organises all risks into domains, pillars, objects, exposures, and actions',
    'Five domains: Personal, Business, Asset, Liability, Enterprise — covering every dimension of risk',
    'Each domain contains pillars, which contain objects — the specific things at risk',
    'Use the taxonomy as a systematic checklist to guarantee no risk category is overlooked'
  ]),
  hQuiz([
    Q('What is a risk taxonomy?',['A pricing model for insurance premiums','A classification system that organises risks into a structured hierarchy','A list of insurance products available in Nigeria','A regulatory requirement from NAICOM'],1,'A risk taxonomy is a structured classification system that organises all possible risks into categories and subcategories.'),
    Q('Which of the following is the correct order in the taxonomy hierarchy?',['Event, Exposure, Object, Domain, Action','Domain, Pillar, Object, Exposure, Event, Consequence, Impact, Protection, Gap, Action','Domain, Object, Pillar, Event, Action','Domain, Action, Gap, Object, Impact'],1,'The hierarchy flows from broad (Domain) to specific (Action): Domain, Pillar, Object, Exposure, Event, Consequence, Impact, Protection, Gap, Action.'),
    Q('What are the five domains of the Universal Risk Taxonomy?',['Life, Health, Property, Liability, Enterprise','Personal, Business, Asset, Liability, Enterprise','Personal, Commercial, Public, Private, Government','Health, Wealth, Property, Liability, Operations'],1,'The five domains are Personal, Business, Asset, Liability, and Enterprise.'),
    Q('What is a Risk Object?',['The insurance policy that covers a risk','The specific person, asset, or interest that is exposed to risk','The event that triggers a loss','The financial impact of a risk event'],1,'A Risk Object is the specific item at risk — the person, asset, or interest exposed to potential loss.'),
    Q('How does the taxonomy help prevent gaps in client assessments?',['It tells you which products to sell','It provides a systematic checklist so no risk category is overlooked','It calculates the premium automatically','It replaces the need for client conversations'],1,'By walking through every domain and pillar systematically, the taxonomy ensures no category is missed and no gap goes unidentified.')
  ]),
  hScript('The Universal Risk Taxonomy',[
    'Imagine a library where books are organised by a system — fiction here, non-fiction there, science here, history there. Without that system, finding anything would be impossible. Risk is the same way. Without a classification system, you are guessing.',
    'The Universal Risk Taxonomy is that system. It organises every possible risk into a structured hierarchy: five domains at the top, pillars within each domain, objects within each pillar, exposures threatening each object, and actions to address them. Everything has a place.',
    'When you use the taxonomy systematically, you never miss a category. You ask: have I checked Personal? Business? Asset? Liability? Enterprise? Within each, have I covered every pillar? Every object? This turns risk assessment from an art into a repeatable science.',
    'Your clients do not need to understand the taxonomy. But you do. It is the engine behind every thorough risk assessment. When a client says "I think I am covered," the taxonomy shows you exactly which pillars remain unprotected.'
  ]),
  hWorkbook([
    {t:'Risk Classification Exercise',i:'Classify each of the following 5 client risks into the correct Domain, Pillar, and Object:',p:['A 40-year-old primary earner diagnosed with cancer — which domain, pillar, and object?','A boutique hotel damaged by fire — which domain, pillar, and object?','A delivery driver injures a pedestrian — which domain, pillar, and object?','A company\'s customer database is hacked — which domain, pillar, and object?','A new competitor enters the market and reduces revenue — which domain, pillar, and object?']},
    {t:'Client Risk Mapping',i:'Think of a real client you have advised. Map their known risks into the taxonomy. What gaps do you discover?',p:['List every risk you know about — place each in the correct domain and pillar','What objects are exposed but have no protection?','Which domain is the most neglected?','What one action would fill the biggest gap?']}
  ]),
  hCase('The Business Owner Who Thought He Was Covered','Chief Nwachukwu owns a thriving construction company in Port Harcourt with 80 employees and annual revenue of NGN450M. When asked about his risks, he says: "Fire and theft — I have those covered." He has a fire insurance policy on his office building (NGN50M sum insured) and burglar cover for equipment. That is all. Using the Universal Risk Taxonomy, you assess his full exposure across all five domains. Personal: no life insurance, no health cover for himself or family, no income protection, no education fund for his 4 children. Business: no business interruption cover despite relying on imported materials with 12-week lead times, no keyman cover on himself, no employee benefits, no fidelity guarantee, no contract works insurance. Asset: the office building is insured but at replacement value from 2018 — rebuilding today would cost NGN85M, vehicles (8 trucks, 2 SUVs): only 3 have comprehensive insurance, plant and equipment (NGN120M): only burglary cover (no breakdown, no flood). Liability: no public liability despite operating construction sites where third parties are present, no professional indemnity, no employer\'s liability despite 80 employees. Enterprise: no cyber cover despite digital project management systems, no political risk despite major government contracts, no reputation cover.',[
    'Using the taxonomy, count how many risk categories Chief Nwachukwu has missed beyond "fire and theft."',
    'For each of the five domains, list the top 3 unaddressed risks with estimated NGN impact.',
    'Identify the single most dangerous gap — the one that could destroy his business in one event.',
    'How would you present this taxonomy-based discovery to Chief Nwachukwu without overwhelming him?',
    'Design a phased protection plan: what does he address in month 1, month 3, and month 6?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Universal Risk Taxonomy — Reference Poster',description:'Full taxonomy hierarchy diagram with all domains, pillars, and sample objects'},
    {url:'#',type:'pdf',title:'Risk Classification Worksheet',description:'Printable worksheet for classifying client risks into the taxonomy structure'}
  ])
);

C3[3] = L(
  hContent('Risk Objects, Risk Pillars & Risk Relationships',[
    'Define Risk Objects and Risk Pillars precisely',
    'Understand how objects relate to pillars and domains',
    'Analyse relationships between different risk objects',
    'Apply object-pillar thinking to build complete risk profiles'
  ],[
    SE('Risk Objects Defined','A Risk Object is the specific person, asset, or interest that is exposed to potential loss. It is the "what" of risk — the tangible or intangible thing that has value and could be harmed. Examples: primary earner, residential building, business vehicle, intellectual property, bank loan, contractual obligation, customer relationship. Every Risk Object sits within a Risk Pillar, which sits within a Domain. Identifying objects is the foundation of the entire CoverScore methodology.'),
    SE('Risk Pillars Defined','A Risk Pillar is a grouping of related Risk Objects that share a common risk characteristic. Pillars help organise objects into meaningful categories so you can assess coverage completeness. There are 10 pillars covering the full spectrum of risk. When you assess a client, you evaluate every pillar to ensure no object has been missed.'),
    T('Risk Pillars and Sample Objects',['Pillar','Sample Risk Objects'],[
      ['Health','Primary earner health, spouse health, children\'s health, dependent parent health, employee health'],
      ['Life & Income','Primary earner life, spouse life, business partner life, business income stream, rental income, investment income'],
      ['Property & Assets','Home, office building, factory, warehouse, vehicles, inventory, equipment, furniture, electronics, intellectual property'],
      ['Liability & Legal','Public liability exposure, product liability, professional indemnity, employer liability, director\'s liability, contractual liability'],
      ['Financial & Credit','Bank loans, mortgages, trade credit, accounts receivable, personal guarantees, investments, savings'],
      ['Operations & Continuity','Supply chain, key equipment, IT infrastructure, utilities, logistics, raw materials, key personnel'],
      ['Reputation & Brand','Brand name, customer trust, social media presence, market reputation, community standing'],
      ['Strategic & Market','Market position, competitive advantage, business model, product pipeline, expansion plans'],
      ['Regulatory & Compliance','Licences, permits, regulatory filings, compliance obligations, tax positions, statutory records'],
      ['Technology & Cyber','Customer data, financial records, IT systems, software, website, digital assets, cybersecurity protocols']
    ]),
    SE('Risk Relationships','Risks do not exist in isolation. A single event can trigger losses across multiple pillars. Understanding these relationships prevents fragmented advice. Example: a fire in a factory (Property pillar) causes a 6-month shutdown (Operations pillar), which reduces revenue (Life & Income pillar), which makes it impossible to service a bank loan (Financial pillar). The fire was one event, but the loss cascaded through four pillars. A traditional advisor might sell property insurance and stop. A CoverScore advisor sees the full picture.'),
    SE('Building a Complete Risk Profile','Start by listing every Risk Object the client has — every person who depends on their income, every asset they own, every liability they carry, every business interest, every contractual obligation. Group the objects into the 10 pillars. Cross-reference each pillar: do you have objects in all 10? If a pillar has no objects, verify it is truly irrelevant. Then assess the relationships: which objects are connected? What happens if one is lost? This methodical approach ensures nothing is missed.'),
    C('A Risk Object is what you protect. A Risk Pillar is why you protect it. Relationships show how risks compound. One event can trigger losses across multiple pillars.')
  ],[
    'Risk Objects are the specific persons, assets, or interests exposed to loss — the "what" of risk',
    'Risk Pillars group related objects into 10 categories for systematic assessment',
    'Risk relationships show how a single event cascades across multiple pillars',
    'Building complete risk profiles requires listing all objects, grouping into pillars, and mapping relationships'
  ]),
  hQuiz([
    Q('What is a Risk Object?',['The insurance policy purchased to cover a risk','The specific person, asset, or interest exposed to loss','The financial impact of a risk event','The regulatory requirement for coverage'],1,'A Risk Object is the specific item at risk — the person, asset, or interest exposed to potential loss.'),
    Q('Which of the following is a Risk Object?',['Property insurance','Health pillar','Primary earner\'s life','Risk assessment'],2,'The primary earner\'s life is a specific Risk Object within the Life & Income pillar.'),
    Q('How does understanding risk relationships improve advisory?',['It allows advisors to sell more policies','It reveals how one event can cause losses across multiple pillars, enabling comprehensive protection','It simplifies the risk assessment process','It replaces the need for client interviews'],1,'Understanding relationships shows how risks compound — enabling comprehensive, not fragmented, protection.'),
    Q('Why is it important to check all 10 pillars even when a client seems low-risk?',['To increase the premium value','Because every client has exposure in every pillar — you just need to find it','To ensure no risk category is overlooked','Because NAICOM requires all 10 pillars to be assessed'],2,'Checking every pillar systematically ensures no risk category is overlooked — even low-risk clients may have hidden exposures.'),
    Q('A boutique hotel has a kitchen fire that damages the restaurant and forces closure for 3 months. Which pillars are affected?',['Only Property','Property, Operations, Life & Income, Reputation, Liability','Property and Operations only','Only Liability and Reputation'],1,'The fire triggers Property (damage), Operations (closure), Life & Income (lost revenue), Reputation (bad reviews), and possible Liability (if a guest was injured).')
  ]),
  hScript('Risk Objects, Risk Pillars & Risk Relationships',[
    'Risk Objects are the nouns of risk — they are the things at stake. A primary earner. A home. A bank loan. A data server. Each of these is a Risk Object, and each sits within a broader Risk Pillar.',
    'Pillars are the categories that help us organise objects so we do not miss anything. There are 10 pillars covering Health, Life & Income, Property, Liability, Financial, Operations, Reputation, Strategic, Regulatory, and Cyber.',
    'But the real power comes from understanding relationships between objects. A fire is not just a fire. It is property damage that stops operations, which cuts income, which threatens loan repayment. One event cascading through four pillars. If you only insure the building, you miss everything else.',
    'Object-pillar thinking ensures your risk profiles are complete. Every person, asset, and interest gets identified, categorised, and connected. No gaps. No surprises. That is the CoverScore standard.'
  ]),
  hWorkbook([
    {t:'Family Risk Inventory',i:'For a typical Nigerian family of 4 where the father runs a small business, list at least 20 Risk Objects across the 10 pillars:',p:['Health: what objects?','Life & Income: what objects?','Property: what objects?','Liability: what objects?','Financial: what objects?','Operations: what objects?','Reputation: what objects?','Strategic: what objects?','Regulatory: what objects?','Cyber: what objects?']},
    {t:'The Domino Effect',i:'Choose a single event — a primary earner\'s sudden death — and map the cascade across 3 or more pillars:',p:['Pillar 1: Life & Income — what happens immediately?','Pillar 2: Financial — what loan covenants are breached?','Pillar 3: Operations — how does the business continue?','Pillar 4: Property — can the family keep the home?','Pillar 5: Reputation — what happens to the business brand?','What protection would stop the cascade at each point?']}
  ]),
  hCase('The Boutique Hotel on Victoria Island','The Azure Boutique Hotel in Lagos has 24 rooms, a restaurant, a swimming pool, and a small conference centre. The owner, Mrs. Durojaiye, built it 6 years ago for NGN280M. She has property insurance on the building (NGN200M sum insured — based on construction cost, not current replacement value) and comprehensive motor on the hotel shuttle. She believes she is "well covered." Map every Risk Object across all 10 pillars. A recent near-miss: a gas fire in the kitchen injured one chef (recovered) and caused NGN2.3M in damage. The property insurer paid after 4 months. During those 4 months, the restaurant was closed, the conference centre lost bookings, and two negative reviews appeared on travel sites about "hotel safety." Mrs. Durojaiye did not claim for lost revenue — she did not know she could.',[
    'List every Risk Object for the Azure Boutique Hotel across all 10 pillars — aim for 25+ objects.',
    'Map the "domino effect" if a major kitchen fire occurs again: which pillars are affected, in what sequence?',
    'Calculate the total financial impact of a 6-month closure (lost room revenue: 24 rooms x NGN75,000/night x 50% occupancy; lost restaurant revenue: NGN400,000/day; lost conference bookings: ~NGN600,000/month).',
    'Identify specific protection for each pillar — name the policy type and estimated sum insured needed.',
    'Present a complete risk profile to Mrs. Durojaiye: what does she have, what is missing, what is the priority order?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk Objects & Pillars — Complete Reference Sheet',description:'All 10 pillars with sample objects for quick reference during client assessments'},
    {url:'#',type:'pdf',title:'Risk Relationship Mapping Template',description:'Printable template for mapping cascading risk events across multiple pillars'}
  ])
);

C3[4] = L(
  hContent('The CoverScore Risk Scoring Framework',[
    'Understand the 0-100 CoverScore scale and what each band means',
    'Calculate a basic risk score using the framework components',
    'Interpret what a score means for advisory approach and urgency',
    'Use the score to motivate client action and track progress'
  ],[
    T('The CoverScore Scale',['Band','Score Range','Meaning','Advisory Urgency'],[
      ['Critical','0-20','Urgent intervention needed — client is dangerously exposed','Immediate: address life, health, and catastrophic risks first'],
      ['High','21-40','Significant gaps exist — major exposures unprotected','Priority: tackle the largest financial gaps with clear action plan'],
      ['Moderate','41-60','Some gaps present — partial coverage with room for improvement','Targeted: address specific weaknesses, optimise existing cover'],
      ['Resilient','61-80','Well-protected — most major risks are covered','Maintain: periodic reviews, minor adjustments, monitor changes'],
      ['Strong','81-100','Optimal protection — comprehensive coverage across all pillars','Review: annual check-ins, ensure coverage keeps pace with growth']
    ]),
    SE('How the Score Is Calculated','The CoverScore is not a black box. It is a transparent, weighted formula based on five components that together measure the completeness and quality of a client\'s protection. Each component reflects a specific dimension of risk readiness. The total score is the weighted sum of all five components, giving a clear picture of where the client stands and exactly what needs to improve.'),
    T('Score Components',['Component','What It Measures','Weight'],[
      ['Coverage Ratio','Existing cover value / total exposure value','35%'],
      ['Diversity Index','Pillars with active coverage / total pillars (10)','20%'],
      ['Severity Exposure','Size of the largest uninsured risk','25%'],
      ['Resilience Factor','Months of emergency funds available','10%'],
      ['Risk Awareness','Client\'s understanding of their own risk profile','10%']
    ]),
    SE('Interpreting the Score','A Critical score (0-20) means the client has minimal protection. Start with life and health — these are existential risks. A High score (21-40) means significant gaps exist — prioritise the largest exposures. Moderate (41-60) clients have some coverage but need targeted improvements. Resilient (61-80) clients are well-protected; focus on maintenance and monitoring. Strong (81-100) clients have optimal protection — annual reviews keep them on track.'),
    SE('The Score as Motivator','The CoverScore is not a grade — it is a diagnostic. A score of 35 today can become 75 in 6 months with the right actions. Clients can see their progress. They compete with themselves, not against benchmarks. Every policy added, every gap closed, every review completed moves the score higher. This transforms insurance from a static purchase into an ongoing journey toward financial resilience.'),
    C('The CoverScore is not a judgment — it is a compass. It tells you where the client is now and points the direction to improve. Watch the score change as protection improves.')
  ],[
    'The CoverScore uses a 0-100 scale with five bands: Critical, High, Moderate, Resilient, Strong',
    'Five weighted components: Coverage Ratio (35%), Diversity Index (20%), Severity Exposure (25%), Resilience Factor (10%), Risk Awareness (10%)',
    'The score is a transparent diagnostic tool, not a black box — each component shows exactly what to improve',
    'Use the score to motivate clients: show them their number, explain the path to improvement, track progress over time'
  ]),
  hQuiz([
    Q('What does a CoverScore of 15 indicate?',['Strong protection — the client is fully covered','Critical — urgent intervention needed, client is dangerously exposed','Moderate — some gaps but generally adequate','Resilient — well-protected with minor gaps'],1,'Critical (0-20) means the client has minimal protection and needs urgent intervention.'),
    Q('Which component has the highest weight in the CoverScore calculation?',['Diversity Index','Severity Exposure','Coverage Ratio','Resilience Factor'],2,'Coverage Ratio carries the highest weight at 35% — it measures existing cover against total exposure.'),
    Q('The Diversity Index measures:',['The total amount of premium paid','The number of pillars with active coverage divided by total pillars','How diverse the client\'s investment portfolio is','The variety of insurers used by the client'],1,'The Diversity Index measures how many of the 10 pillars have coverage — a low score means concentrated protection.'),
    Q('How should you advise a client with a CoverScore of 28 (High)?',['Tell them everything is fine','Prioritise the largest gaps and create an action plan to address them','Only recommend investment products','Focus on annual reviews only'],1,'High (21-40) means significant gaps exist — prioritise the largest exposures with a clear action plan.'),
    Q('Why is the CoverScore described as a "compass" rather than a "judgment"?',['Because it is random and has no meaning','Because it shows direction for improvement rather than labelling the client','Because only advisors can see it','Because it does not change over time'],1,'The CoverScore is a compass — it shows where the client is now and points the way to improve, without judgment.')
  ]),
  hScript('The CoverScore Risk Scoring Framework',[
    'Every client deserves to know where they stand. The CoverScore turns complex risk data into a single, clear number from 0 to 100. It is simple enough for clients to understand and robust enough for advisors to build actionable plans.',
    'But it is not an arbitrary number. The score is calculated from five weighted components: Coverage Ratio (35%) measures how much protection exists relative to total exposure. Diversity Index (20%) checks how many pillars are covered. Severity Exposure (25%) measures the largest uninsured risk. Resilience Factor (10%) looks at emergency savings. Risk Awareness (10%) assesses the client\'s understanding.',
    'The five bands tell you and your client exactly where to focus: Critical needs immediate action, High needs priority attention, Moderate needs targeted improvements, Resilient needs maintenance, and Strong needs periodic review.',
    'The real power of the score is motivation. A client at 32 today can see exactly what moves them to 55. They are not competing with anyone else — they are competing with their own score. Progress is visible, measurable, and motivating.'
  ]),
  hWorkbook([
    {t:'Score Estimation Practice',i:'Mr. and Mrs. Balogun — both 38, two children. Mr. Balogun earns NGN8M/year as an engineer. Mrs. Balogun earns NGN3.5M/year as a teacher. They have: term life insurance on Mr. Balogun (NGN10M sum assured), comprehensive motor on their car, home contents insurance (NGN5M), no health insurance, no disability cover, 4 months of emergency savings, no business interruption, no education fund. Estimate each component and calculate the approximate CoverScore:',p:['Coverage Ratio: existing cover / total exposure — what is their total life cover need (10x income)? What is their health exposure?','Diversity Index: how many of the 10 pillars have any coverage?','Severity Exposure: what is their single largest uninsured risk and its NGN impact?','Resilience Factor: 4 months of savings — what score component does this give?','Risk Awareness: on a scale of 1-10, how well do they understand their risks?','Calculate the weighted total — what band are they in?']},
    {t:'Advisory Action Plan for Score 28',i:'A client has a CoverScore of 28 (High). Based on the component breakdown, write a 6-month action plan:',p:['Month 1: what is the single most important action?','Month 2: which pillar needs immediate attention?','Month 3: what second action raises the score most?','Month 4: which components improve easily?','Month 5: how do you review and adjust?','Month 6: what is the target score and how do you present progress?']}
  ]),
  hCase('The Adekunle Family: From High to Moderate','The Adekunle family — father Kunle (42, IT consultant, NGN9.6M/year), mother Tolu (40, pharmacist, NGN4.2M/year), three children aged 8, 6, and 3. Their current protection: Kunle has a group life policy through his employer (NGN8M — 1x annual salary), Tolu has no life insurance, comprehensive motor on their Toyota SUV, fire insurance on their home (NGN25M sum insured — home valued at NGN45M), no health insurance, no disability cover, no education fund, 3 months of emergency savings (NGN1.8M). Their CoverScore is 32 (High).',[
    'Calculate each of the 5 score components for the Adekunle family with NGN figures.',
    'Show the weighted calculation: (Coverage Ratio x 35%) + (Diversity Index x 20%) + (Severity Exposure x 25%) + (Resilience Factor x 10%) + (Risk Awareness x 10%). Confirm the score of 32.',
    'Identify the specific actions that would move their score from 32 (High) to at least 55 (Moderate). What is the NGN cost of each action?',
    'What is the single most impactful action that raises the score the most? Why?',
    'Present a complete advisory plan: current state to recommended actions to projected new score to timeline. Show the family how their score improves step by step.',
    'Draft the conversation you would have with Kunle and Tolu — how do you present a score of 32 without alarming them, but motivating them to act?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'CoverScore Scoring Framework — Complete Reference',description:'Detailed guide to all five components, weights, and calculation methodology'},
    {url:'#',type:'pdf',title:'CoverScore Calculator Worksheet',description:'Printable worksheet for calculating client CoverScores step by step'},
    {url:'#',type:'pdf',title:'CoverScore Band Interpretation Guide',description:'Quick-reference guide to all five bands with advisory actions for each'}
  ])
);

C3[5] = L(
  hContent('The Risk Fingerprint & Protection Gap Analysis',[
    'Understand what the Risk Fingerprint is and how to read it',
    'Identify protection gaps across all risk pillars',
    'Quantify gaps in financial terms with Naira amounts',
    'Prioritise gaps by severity, likelihood, and impact',
    'Present gap analysis to clients clearly and persuasively'
  ],[
    T('What Is the Risk Fingerprint?',['Pillar','Exposure Level','Coverage','Gap Status'],[['Health','High','None','Critical'],['Life & Income','Medium','Partial','High'],['Property','Low','Adequate','Good'],['Liability','High','None','Critical'],['Motor','Medium','Partial','High'],['Education','Low','Adequate','Good'],['Retirement','Medium','None','High'],['Emergency Fund','High','None','Critical'],['Business','Medium','Partial','High'],['Investment','Low','Adequate','Good']],'A multi-dimensional visual profile showing risk exposure across all 10 pillars. Unlike a single score, the fingerprint reveals WHERE risk is concentrated.'),
    SE('The Protection Gap Defined','The difference between what is at risk (total exposure) and what is protected (existing coverage). Formula: Gap = Exposure - Protection. If a primary earner\'s income is NGN8M/year and life cover is NGN5M, the gap is NGN3M for year 1 alone — and over 10 years the gap is NGN80M+.'),
    T('Gap Levels & Urgency',['Gap Level','Criteria','Urgency'],[['Critical','More than 80% unprotected','Immediate action required'],['High','60-80% unprotected','Priority attention needed'],['Moderate','40-60% unprotected','Monitor and plan'],['Low','Less than 40% unprotected','Maintain current position']]),
    T('Quantifying Gaps in Naira',['Scenario','Exposure','Current Cover','Gap'],[['SME owner income protection','NGN6M/year × 10 years = NGN60M','NGN3M life cover','NGN57M income gap'],['Family home fire cover','NGN40M property value','NGN15M fire cover','NGN25M property gap'],['Medical emergency cover','NGN3M estimated cost','NGN0 health cover','NGN3M health gap'],['Total protection gap','—','—','NGN58M+ total gap']],'Nigerian market examples:'),
    T('Prioritisation Framework',['Priority Level','Criteria','Action'],[['Catastrophic','Could destroy client financially','Address immediately'],['High','Severe financial impact','Address within 3 months'],['Medium','Significant but manageable','Address within 6 months'],['Low','Minor gap, worth closing','Address at next review']]),
    SE('Presenting the Fingerprint to Clients','Show, don\'t sell. Visual presentation: "Here is your current protection landscape — green means covered, red means exposed." Let the data speak. Clients make better decisions when they SEE their gaps. Guide them through each colour and pillar without pressure.'),
    C('The Risk Fingerprint does not lie. It shows exactly where a client is exposed. Your job is not to convince them — it is to show them. When they see red, they act.')
  ],[
    'The Risk Fingerprint is a multi-dimensional visual profile showing exposure across all 10 pillars',
    'Protection gap = exposure - protection; quantify everything in Naira',
    'Prioritise gaps using catastrophic → high → medium → low framework',
    'Present visually and let the data speak — clients act when they see red'
  ]),
  hQuiz([
    Q('What is the Risk Fingerprint?',['A single credit score for the client','A multi-dimensional visual profile showing risk exposure across all pillars','A list of insurance products the client owns','A summary of claims history'],1,'The Risk Fingerprint reveals where risk is concentrated across multiple pillars — not just a single score.'),
    Q('What is the formula for calculating a protection gap?',['Gap = Premium - Deductible','Gap = Exposure - Protection','Gap = Risk - Premium','Gap = Coverage - Claim'],1,'Gap = Exposure - Protection. It measures the difference between what is at risk and what is covered.'),
    Q('A client earns NGN8M/year. Current life cover is NGN15M. What is the Naira gap over 10 years?',['NGN0M — they are fully covered','NGN80M','NGN65M','NGN15M'],2,'Income at risk = NGN8M × 10 = NGN80M. Cover = NGN15M. Gap = NGN80M - NGN15M = NGN65M.'),
    Q('According to the prioritisation framework, a gap that "could destroy the client financially" should be:',['Addressed within 6 months','Monitored at next review','Addressed immediately','Addressed within 3 months'],2,'Catastrophic gaps that could destroy the client financially must be addressed immediately.'),
    Q('What is the best way to present a gap analysis to a client?',['Read the policy documents aloud','Show them the Risk Fingerprint visually so they see green and red','Email a PDF and ask them to review','Skip the analysis and go straight to recommendations'],1,'Visual presentation using the colour-coded Risk Fingerprint lets the data speak for itself.')
  ]),
  hScript('The Risk Fingerprint & Protection Gap Analysis',[
    'Think of the Risk Fingerprint as a health screening for your client\'s finances. Instead of blood pressure and cholesterol, we measure risk exposure across 10 pillars — from health to retirement — and show each as green, amber, or red.',
    'The protection gap is simply what is at risk minus what is protected. But when you calculate it in Naira, it becomes real. A NGN6M earner with NGN3M of life cover does not just have a "gap" — they have a NGN57M shortfall over a decade.',
    'Not all gaps are equal. Some would destroy a family. Others are manageable. Use the prioritisation framework to decide what to address first. Catastrophic gaps need immediate attention; low gaps can wait.',
    'When you present the Risk Fingerprint, resist the urge to sell. Just show them — green is covered, red is exposed. Clients who SEE their situation make better decisions than those who are told what to buy.'
  ]),
  hWorkbook([
    {t:'Calculate Total Protection Gap',i:'A client profile shows the following across 5 pillars. Calculate the total protection gap in Naira.',p:['Pillar 1 — Life: Income NGN5M/year × 10 years, cover NGN8M, gap = ?','Pillar 2 — Health: Emergency cost NGN4M, cover NGN0, gap = ?','Pillar 3 — Property: Building NGN35M, cover NGN12M, gap = ?','Pillar 4 — Emergency Fund: 6 months expenses NGN3.6M, savings NGN1M, gap = ?','Pillar 5 — Motor: Vehicle NGN8M, cover NGN4M, gap = ?','Total gap: sum all pillars']},
    {t:'Rank Gaps by Severity',i:'Using the prioritisation framework, rank each identified gap from the calculation above by severity.',p:['Which gap is catastrophic and needs immediate action?','Which gaps are high priority for 3-month timeline?','Which are medium priority for 6-month timeline?','Justify each ranking with specific reasoning']}
  ]),
  hCase('Case Study: The Adebayo Family\'s Risk Fingerprint','The Adebayo family — husband (45, IT consultant, NGN9M/year), wife (41, pharmacist, NGN4.8M/year), three children (ages 12, 9, 6). Their Risk Fingerprint shows: Health — Critical (no health insurance, NGN0 cover), Life & Income — Critical (only NGN2M group life from employer, income gap NGN88M+ over 10 years), Property — Moderate (home valued at NGN45M, fire cover NGN20M, gap NGN25M), Liability — High (no liability cover despite rental property and car loans), Motor — Moderate (two cars, one with comprehensive, one with third-party only). Total protection gap: NGN47.5M.',[
    'Calculate the total protection gap breakdown across all five pillars with Naira figures.',
    'Rank which gaps to address first, second, third using the prioritisation framework.',
    'Write a conversation script showing how you would present the Risk Fingerprint to the Adebayo family.',
    'Identify which gaps can be closed immediately vs which need a phased approach.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk Fingerprint Interpretation Guide',description:'How to read and interpret the multi-dimensional Risk Fingerprint with sample scenarios'},
    {url:'#',type:'link',title:'Protection Gap Calculator Template',description:'Downloadable spreadsheet for calculating client protection gaps'}
  ])
);

C3[6] = L(
  hContent('The CoverScore Recommendation Engine',[
    'Understand how the Recommendation Engine turns gaps into actions',
    'Map gaps to specific insurance and non-insurance solutions',
    'Structure recommendations by priority and feasibility',
    'Present recommendations that clients understand and act on'
  ],[
    T('From Gap to Action',['Gap','Recommended Action','Product/Solution Type'],[['Life Income Gap','Term assurance for income replacement','Life Insurance'],['Health Gap','Comprehensive health plan','Health Insurance'],['Property Gap','Fire & special perils cover','Property Insurance'],['Liability Gap','Public liability policy','Liability Insurance'],['Emergency Fund Gap','Build 6-month reserve','Savings/Investment']],'Every identified gap maps to a recommendation. The engine connects what is exposed to what should protect it.'),
    T('Insurance vs Non-Insurance Solutions',['Gap Type','Insurance Solution','Non-Insurance Solution'],[['Income protection','Disability/income cover plan','Emergency savings fund, 6 months of expenses'],['Property loss','Property insurance policy','Security systems, fire prevention measures'],['Business interruption','Business interruption cover','Diversified suppliers, inventory buffer'],['Liability','Liability insurance policy','Safety protocols, contracts review by lawyer'],['Health','Comprehensive health insurance','Wellness programmes, preventive healthcare']],'Not every gap needs insurance. Some need savings, estate planning, business continuity planning, or risk mitigation.'),
    T('Structuring Recommendations by Priority',['Layer','Focus','Action'],[['Foundation','Life, health, catastrophic risks','MUST address immediately — no exceptions'],['Protection','Property, motor, liability risks','NEXT priority after foundation is solid'],['Enhancement','Education, retirement, investment','ONLY after foundation and protection are in place'],['Optimisation','Annual reviews, adjustments, monitoring','ONGOING — revisit at every review cycle']],'Always layer recommendations. Never recommend enhancement before foundation is solid.'),
    T('The Recommendation Framework',['Layer','Focus','Typical Products','Priority'],[['Foundation','Existential risks','Life, health, disability income','MUST address immediately'],['Protection','Asset and liability risks','Property, motor, liability','NEXT priority'],['Enhancement','Future goals','Education, retirement, investment','AFTER foundation is solid'],['Optimisation','Ongoing management','Annual reviews, adjustments','ONGOING']]),
    SE('Presenting Recommendations That Get Yes','Tie every recommendation back to something the client cares about. "This life cover means your children complete their education even if something happens to you." "This health plan means you choose which hospital, not the one closest to the nearest government facility." Connect to their family, their business, their peace of mind.'),
    C('The best recommendation in the world is worthless if the client does not act on it. Connect every recommendation to something they care about — their family, their business, their peace of mind.')
  ],[
    'Every protection gap maps to a specific recommendation — insurance or non-insurance',
    'Always layer: Foundation → Protection → Enhancement → Optimisation',
    'Not every gap needs insurance; savings, planning, and risk mitigation are also solutions',
    'Connect every recommendation to something the client personally cares about'
  ]),
  hQuiz([
    Q('What is the first step in the Recommendation Engine process?',['Sell the most profitable product','Map each identified gap to a specific action','Calculate the advisor commission','Send a generic quote'],1,'The Recommendation Engine starts by mapping every gap to a specific recommended action.'),
    Q('Which of the following is a non-insurance solution for a liability gap?',['Public liability policy','Safety protocols and contracts review','Motor insurance','Health insurance'],1,'Safety protocols and contracts review are non-insurance ways to mitigate liability risk.'),
    Q('According to the priority layering system, what should be addressed FIRST?',['Education savings plan','Motor insurance','Life and health (Foundation layer)','Retirement investment'],2,'The Foundation layer — covering life, health, and catastrophic risks — must be addressed first before anything else.'),
    Q('Which layer of the recommendation framework includes property and motor insurance?',['Foundation','Protection','Enhancement','Optimisation'],1,'The Protection layer covers property, motor, and liability risks — the second priority after Foundation.'),
    Q('What is the best way to get a client to say yes to a recommendation?',['Offer a discount','Tie the recommendation to something they personally care about','Tell them everyone buys this policy','Pressure them with urgency'],1,'The most effective approach is connecting the recommendation to what the client values most — family, business, or peace of mind.')
  ]),
  hScript('The CoverScore Recommendation Engine',[
    'Gaps identified. Now what? The Recommendation Engine turns every finding into an action. For every gap, there is a solution — sometimes insurance, sometimes not.',
    'Not all gaps need a policy. Some need better savings habits. Some need estate planning or business continuity. The best recommendation often combines insurance with non-insurance solutions for a complete approach.',
    'Always build from the foundation upward. Life, health, and catastrophic risks come first. Property, motor, and liability come next. Education, retirement, and investment come after the basics are solid. Never recommend enhancement before protection.',
    'And when you present your recommendations, make every one personal. "This means your children\'s school fees are protected. This means you choose your hospital. This means your business survives without you." Connect to what they care about.'
  ]),
  hWorkbook([
    {t:'Gap-to-Action Mapping',i:'A gap analysis reveals 8 gaps across 5 pillars. For each gap, map to a specific insurance product or non-insurance solution.',p:['Gap 1 — Life income gap of NGN45M: product/solution?','Gap 2 — Health emergency gap of NGN3.5M: product/solution?','Gap 3 — Property fire gap of NGN22M: product/solution?','Gap 4 — Liability gap of NGN15M: product/solution?','Gap 5 — Education gap of NGN12M: product/solution?','Gap 6 — Emergency fund gap of NGN2.4M: product/solution?','Gap 7 — Motor gap of NGN4M: product/solution?','Gap 8 — Retirement gap of NGN30M: product/solution?']},
    {t:'Structure by Priority Layers',i:'Take the 8 gaps above and organise them into the four layers: Foundation, Protection, Enhancement, Optimisation.',p:['Foundation layer: which gaps go here?','Protection layer: which gaps go here?','Enhancement layer: which gaps go here?','Optimisation layer: which actions go here?','Justify the placement of each gap']}
  ]),
  hCase('Case Study: The Chukwuma Family Recommendation Plan','The Chukwuma family — husband (48, lawyer, NGN12M/year), wife (44, architect, NGN8.4M/year), four children (university, secondary, primary). Their assessment identified 12 gaps across 6 pillars with a total coverage gap of NGN86M. Current annual insurance budget: NGN420,000. They have asked: "What do we do first? We cannot afford everything at once." Their current cover: employer group life NGN5M total, motor comprehensive on one car, building fire cover NGN25M on a NGN60M home, no health, no disability, no education plan, no liability.',[
    'Layer all 12 gaps into the Foundation → Protection → Enhancement → Optimisation framework.',
    'Fit the recommendations within their NGN420,000/year budget — show which gaps to close now and which to phase.',
    'Estimate the projected CoverScore improvement after implementing each phase.',
    'Write a recommendation presentation script that ties each priority to something the Chukwuma family cares about.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Recommendation Engine Reference Guide',description:'Complete reference for mapping gaps to insurance and non-insurance solutions'},
    {url:'#',type:'doc',title:'Gap-to-Action Mapping Template',description:'Structured template for recording gap analysis and corresponding recommendations'}
  ])
);

C3[7] = L(
  hContent('The CoverScore AI Advisor Copilot',[
    'Understand the role of AI in the CoverScore advisory process',
    'Use the Copilot to generate risk narratives and recommendation summaries',
    'Maintain the Human-in-the-Loop principle at all times',
    'Explain AI\'s role to clients with confidence and transparency'
  ],[
    SE('What Is the CoverScore AI Advisor Copilot?','An AI-powered assistant that helps advisors generate risk narratives, recommendation summaries, and client communication. It does NOT replace the advisor — it augments them. The Copilot processes CoverScore data and generates natural-language outputs that advisors can review, personalise, and deliver.'),
    T('What the Copilot Can Do',['Capability','What It Produces','Advisor Benefit'],[['Risk Narrative','Natural-language summary of client\'s risk profile','Saves 15-20 minutes per client'],['Recommendation Letter','Professional summary of gaps and recommended actions','Ensures consistency and completeness'],['Follow-Up Email','Personalised engagement message','Maintains client connection between reviews'],['Policy Comparison','Side-by-side comparison of product options','Helps client decision-making'],['Renewal Review','Summary of changes since last assessment','Enables efficient quarterly reviews']]),
    OL('Human-in-the-Loop: Three-Step Process',['GENERATE — Use the Copilot to produce the first draft of a risk narrative, recommendation summary, or client communication.','REVIEW — Read every output carefully. Check facts, figures, tone, and context. The AI can miss critical details.','PERSONALISE — Add your judgment, local knowledge, and understanding of the client\'s unique situation. Make it yours.'],'AI generates, advisor validates. Always review AI output before sharing with clients.'),
    SE('AI Ethics & Best Practices','Never share client data with public AI tools. The Copilot operates within the CoverScore platform with data protection. Always verify facts and figures before sending to clients. Use AI for drafts, not final versions without review. Disclose AI assistance transparently if asked.'),
    SE('Talking to Clients About AI','Script: "We use AI to help analyse your risk data faster and more accurately. But every recommendation is reviewed by me personally. The technology supports my judgment — it does not replace it." This builds confidence in both the technology and your professional oversight.'),
    C('The Copilot makes you faster and more consistent. But your judgment, empathy, and local knowledge are what clients trust. AI assists. You advise. That is the Human-in-the-Loop principle.')
  ],[
    'The AI Advisor Copilot generates risk narratives, recommendation letters, follow-up emails, and more',
    'Human-in-the-Loop: Generate → Review → Personalise — never send AI output without review',
    'Protect client data; verify facts; disclose AI use transparently when asked',
    'AI makes you faster and more consistent; your judgment and empathy are irreplaceable'
  ]),
  hQuiz([
    Q('What is the primary purpose of the CoverScore AI Advisor Copilot?',['Replace human advisors with automation','Augment advisors by generating drafts and saving time','Sell more products automatically','Eliminate the need for client meetings'],1,'The Copilot augments advisors — it generates drafts so advisors can focus on review, personalisation, and client relationships.'),
    Q('Which Copilot capability saves 15-20 minutes per client?',['Policy comparison','Follow-up email drafting','Risk narrative generation','Renewal review'],2,'The Risk Narrative capability produces a natural-language summary of the client\'s risk profile, saving significant time.'),
    Q('What is the correct Human-in-the-Loop workflow?',['Review → Personalise → Generate','Generate → Review → Personalise','Personalise → Generate → Review','Generate → Send → Forget'],1,'Always: Generate the draft, Review every detail, then Personalise before sharing with the client.'),
    Q('What should an advisor NEVER do when using AI tools?',['Use AI for first drafts','Review AI-generated facts and figures','Send AI-generated content directly to clients without review','Disclose AI use to clients if asked'],2,'Never send AI-generated content directly to clients without reviewing facts, figures, tone, and context first.'),
    Q('How should you explain AI use to a concerned client?',['Say it is none of their business','Explain AI supports your analysis but your judgment reviews everything','Tell them AI replaces human advisors','Avoid the question entirely'],1,'The honest approach: AI helps analyse data faster, but your professional judgment reviews and personalises every recommendation.')
  ]),
  hScript('The CoverScore AI Advisor Copilot',[
    'The CoverScore AI Advisor Copilot is your intelligent assistant. It takes the data from the risk assessment and CoverScore analysis and generates natural-language narratives, recommendation letters, follow-up emails, and policy comparisons.',
    'It can save you 15 to 20 minutes per client on drafting alone. But it never replaces you. The Copilot drafts — you decide. That is the Human-in-the-Loop principle: Generate, Review, Personalise.',
    'The AI might produce technically accurate content, but it does not know that your client just had a baby, started a new business, or lost a parent. Only you know that. Your judgment, empathy, and local context are what clients trust.',
    'Be transparent about AI use. When clients ask, tell them: "AI helps me analyse faster. But every recommendation passes through my review. The technology supports my judgment — it does not replace it."'
  ]),
  hWorkbook([
    {t:'AI vs Advisor Comparison',i:'Read an AI-generated recommendation summary for a client. Identify what the AI missed that you would add.',p:['What factual details does the AI get right?','What personal or contextual details are missing?','How would the tone differ if you wrote it yourself?','Rewrite the recommendation adding your personal touch']},
    {t:'Generate → Review → Personalise Practice',i:'Write a short risk narrative for a sample client profile. Then compare it to what the Copilot might generate. Identify what each version does better.',p:['Your version: what personal details did you include?','AI version: what structure or completeness did it have?','Merge: write a combined version using the best of both','Reflect: how does this workflow improve your output?']}
  ]),
  hCase('Case Study: The Missing Context','A client — Mr. Okafor (39, IT business owner, recently married with a new baby) — receives an AI-generated risk narrative that is technically accurate: it correctly identifies his income exposure, life cover gap, and property risks. But the narrative is generic. It misses that he just started his own IT consulting firm 6 months ago, that his wife is on maternity leave with reduced income, and that they moved into a new home last month with a larger mortgage. The narrative reads like it could be for anyone.',[
    'Identify what critical information the AI-generated narrative is missing.',
    'Rewrite the risk narrative incorporating the missing personal context.',
    'Explain how the Human-in-the-Loop process would catch and correct this.',
    'Draft a short message to Mr. Okafor that includes both the AI efficiency and your personal touch.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Copilot User Guide',description:'Complete guide to using the CoverScore AI Advisor Copilot features'},
    {url:'#',type:'pdf',title:'AI-Human Advisory Workflow',description:'Best practices for the Generate → Review → Personalise workflow'}
  ])
);

C3[8] = L(
  hContent('Methodology Mastery — Practical Case Lab & Knowledge Check',[
    'Apply the entire CCA 103 methodology to a comprehensive multi-entity case study',
    'Demonstrate integrated use of taxonomy, scoring, fingerprinting, and recommendations',
    'Present a complete risk analysis with prioritised action plan',
    'Reflect on the methodology and its impact on advisory practice'
  ],[
    OL('Methodology Recap',['Universal Risk Taxonomy — Organises all risks into a structured classification system','Risk Objects & Pillars — Identifies specific exposures across 10 pillars','Risk Scoring Framework — Scores each exposure from 0-100 with clear bands','Risk Fingerprint — Visual gap analysis showing protection status across all pillars','Protection Gap Quantification — Calculates every gap in Naira amounts','Recommendation Engine — Maps gaps to prioritised insurance and non-insurance actions','AI Copilot — Augments delivery with AI-generated narratives and summaries'],'The complete CCA 103 methodology arc:'),
    SE('Integrated Advisory','The methodology is designed to work as a complete system. You do not pick and choose steps — you follow the entire arc from taxonomy to recommendation. Each step feeds the next. A thorough taxonomy ensures accurate scoring. Accurate scoring produces a meaningful fingerprint. A clear fingerprint drives precise recommendations. Skipping steps creates blind spots.'),
    T('The CoverScore Difference',['Without Methodology','With Methodology'],[['Advisor guesses at client needs','Every gap is systematically identified'],['Recommendations based on products available','Recommendations based on actual risk data'],['Client sees a salesperson','Client sees a trusted advisor'],['No measurable baseline','CoverScore tracks improvement over time'],['Fragmented coverage across different policies','Holistic protection aligned with risk profile']]),
    SE('Continuous Improvement','The methodology is not a one-time exercise. Risk changes. Clients change. Markets change. A client who was single last year is married this year. A business that had 10 employees now has 50. Regular reassessment keeps the fingerprint current and scores improving. Schedule reviews every 6-12 months as standard practice.'),
    C('You now have the complete CoverScore methodology. Taxonomy, objects, pillars, scoring, fingerprinting, gap analysis, recommendations, and AI-powered delivery. Use them together. That is the power of the CoverScore system.')
  ],[
    'CCA 103 covers the full methodology: Taxonomy → Pillars → Scoring → Fingerprint → Gap Analysis → Recommendations → AI Copilot',
    'Each step feeds the next — the methodology must be used as a complete system, not piecemeal',
    'CoverScore replaces guesswork with data, sales with advice, fragmentation with holistic protection',
    'Regular reassessment keeps scores current and client protection aligned with changing risk profiles'
  ]),
  hQuiz([
    Q('What is the first step in the CCA 103 methodology arc?',['Risk Scoring Framework','Universal Risk Taxonomy','Risk Fingerprint','Recommendation Engine'],1,'The Universal Risk Taxonomy comes first — it organises all risks into a structured classification before any other step.'),
    Q('Why must the methodology be used as a complete system?',['Each step feeds the next — skipping steps creates blind spots','It is faster to skip steps','Some steps are optional','The system only works for certain clients'],0,'The methodology is designed so each step builds on the previous one. Skipping steps means missing critical information.'),
    Q('What is the primary benefit of the CoverScore approach over traditional advisory?',['Lower premiums for clients','Systematic identification of every gap based on data rather than guessing','Faster sales cycle','More commission for the advisor'],1,'CoverScore replaces guesswork with systematic data-driven gap identification — clients get complete, accurate protection plans.'),
    Q('Why does the methodology require regular reassessment?',['To generate more commission','Risk changes — clients change jobs, have children, buy property, start businesses','The system only works with annual updates','Regulations require it'],1,'Risk is dynamic. Regular reassessment (every 6-12 months) ensures the fingerprint stays current and scores keep improving.'),
    Q('How does a client\'s perception differ between a CoverScore advisor and a traditional advisor?',['No difference — both are the same','A CoverScore advisor is seen as a trusted advisor; a traditional advisor is seen as a salesperson','Traditional advisors are more trusted','Clients prefer traditional methods'],1,'CoverScore advisors are seen as trusted risk consultants; traditional advisors are often seen as product salespeople.')
  ]),
  hScript('Methodology Mastery — Practical Case Lab & Knowledge Check',[
    'This is where everything comes together. You have learned the Universal Risk Taxonomy, Risk Objects and Pillars, the Risk Scoring Framework, the Risk Fingerprint, Protection Gap Analysis, the Recommendation Engine, and the AI Advisor Copilot.',
    'These are not separate tools. They are one complete system. Taxonomy feeds pillars. Pillars feed scoring. Scoring produces the fingerprint. The fingerprint reveals gaps. Gaps drive recommendations. And the AI Copilot helps you deliver it all efficiently.',
    'Apply the methodology systematically, step by step. Do not skip. Do not shortcut. When you follow the entire arc — from taxonomy through to recommendation — you deliver a level of service that traditional advisors cannot match.',
    'You now have the complete CCA 103 toolkit. Use it with every client. Transform your advisory practice.'
  ]),
  hWorkbook([
    {t:'Personal Reflection',i:'Answer honestly: how will the CCA 103 methodology change your approach to advisory?',p:['What were you doing before that this methodology improves?','Which step of the arc will have the biggest impact on your clients?','What is one change you will make starting with your next client?']},
    {t:'Implementation Action Plan',i:'Create a specific plan for implementing the full methodology with your next 3 clients.',p:['Client 1: name or type, which steps will you apply, expected outcome','Client 2: name or type, which steps will you apply, expected outcome','Client 3: name or type, which steps will you apply, expected outcome','Timeline: when will you complete each assessment?']}
  ]),
  hCase('Comprehensive Case Study: The Four-Entity Portfolio Assessment','Apply the full CCA 103 methodology to assess and recommend for four distinct entities. Entity A — SME Owner: Mr. Daniels runs a printing press with 25 employees, equipment valued at NGN45M, annual revenue NGN120M. Current covers: NGN20M fire on equipment only, third-party motor on 2 of 4 vans, no life, no health, no business interruption. Entity B — Hospital: A 24-bed private hospital with 60 staff, annual revenue NGN85M. Current covers: professional indemnity NGN10M (inadequate), building NGN30M (replacement cost NGN75M), no health insurance for staff, no equipment breakdown cover. Entity C — Manufacturing: A fabric production factory with 80 employees, equipment valued at NGN120M, annual revenue NGN250M. Current covers: fire on building NGN50M, comprehensive motor on 6 of 8 trucks, group life NGN3M per employee, no business interruption, no liability, no keyman cover on the founder (58, no succession plan). Entity D — Church: A 500-member congregation with a building valued at NGN80M, school with 200 students, 8 vehicles. Current covers: building fire NGN25M, third-party motor on 4 of 8 vehicles, no public liability, no school liability, no trustee cover.',[
    'For each entity, use the Universal Risk Taxonomy to identify all relevant risk categories and pillars.',
    'Calculate the Risk Score for each entity based on current coverage vs exposure levels.',
    'Generate a Risk Fingerprint summary for each entity identifying critical gaps.',
    'Quantify all protection gaps in Naira amounts across every pillar for each entity.',
    'Use the Recommendation Engine to produce prioritised recommendations for each entity.',
    'Identify which recommendations should be combined across entities (e.g., group schemes for related parties).',
    'Estimate projected CoverScore improvement for each entity after implementing phase 1 recommendations.',
    'Write a 2-minute executive summary script presenting findings across all four entities.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'CCA 103 Methodology Quick Reference',description:'Complete one-page summary of the entire CCA 103 methodology arc'},
    {url:'#',type:'doc',title:'CCA 103 Completion Checklist',description:'Step-by-step checklist for completing the methodology with any client'},
    {url:'#',type:'doc',title:'Next Steps — CCA 104 Preview',description:'What to expect in the next module: advanced advisory techniques'}
  ])
);

// ═══════════════════════════════════════════════════════════════════
// COURSE 4: CCA 104 — The Risk Advisor Mindset (8 lessons)
// ═══════════════════════════════════════════════════════════════════

const C4 = {};

const C5 = {};

C4[1] = L(
  hContent('From Insurance Seller to Risk Advisor',[
    'Understand the product-first trap and how it limits advisory effectiveness',
    'Differentiate between stated needs and actual needs in client conversations',
    'Apply the Five Transformative Questions to uncover real client risk',
    'Redefine success from policies sold to gaps closed and scores improved'
  ],[
    T('The Identity Shift',['Dimension','Insurance Seller','Risk Advisor'],[
      ['Starting Point','"What can I sell you?"','"What are you protecting?"'],
      ['Primary Goal','Hit sales target','Close client\'s protection gap'],
      ['Conversation','Monologue/features','Dialogue/discovery'],
      ['Metric of Success','Policies sold','Scores improved and gaps closed'],
      ['Client Perception','Salesperson','Trusted partner'],
      ['Relationship','Transactional','Lifelong'],
      ['Approach to Objections','Overcome/persuade','Understand/address'],
      ['After the Sale','Move to next lead','Ongoing risk management']
    ]),
    SE('The Product-First Trap','Most advisors are trained to sell products, incentivised by commissions, and rewarded for volume. This creates the "product-first trap" — where the advisor leads with what they have to sell, not what the client needs to protect. Breaking out requires redefining success: from "policies sold" to "gaps closed and scores improved".'),
    SE('The Five Transformative Questions','These five questions uncover the real risk beneath the surface and transform every client conversation:\n\n1. "If you couldn\'t work tomorrow, how long would your family be okay?" — exposes the income protection gap.\n2. "What keeps you awake at night?" — uncovers emotional risk drivers.\n3. "What would happen to your family if you weren\'t here?" — reveals dependency and legacy concerns.\n4. "If you could fix ONE thing about your current protection, what would it be?" — identifies the priority gap.\n5. "What does financial peace of mind look like for you?" — defines the outcome, not the product.'),
    SE('Stated vs Actual Need','Stated needs are surface-level ("I need life insurance"). Actual needs are deeper ("I need my children\'s education to be secure if something happens to me"). The advisor\'s job is to bridge this gap. When a client says "I want the cheapest cover," the actual need is "I want value for money without sacrificing quality."'),
    C('The difference between selling and advising is simple: selling starts with what you have. Advising starts with what they need.')
  ],[
    'The product-first trap limits advisors by leading with products instead of client needs',
    'Stated needs are surface-level; actual needs reveal the deeper protection requirement',
    'The Five Transformative Questions unlock genuine client risk understanding',
    'Success as a risk advisor is measured by gaps closed and scores improved, not policies sold'
  ]),
  hQuiz([
    Q('What is the primary characteristic of the product-first trap?',['Advisors focus on understanding client needs before recommending','Advisors are trained to sell products and incentivised by commission','Advisors conduct risk assessments before product discussions','Advisors build long-term client relationships first'],1,'The product-first trap means advisors lead with products due to training and commission structures — not because it serves the client.'),
    Q('What is the difference between stated and actual need?',['They are the same thing','Stated needs are surface-level; actual needs go deeper','Actual needs are what the client says aloud','Stated needs are more important than actual needs'],1,'Stated needs are what the client says; actual needs are the underlying protection requirement behind those words.'),
    Q('Which of the Five Transformative Questions exposes the income protection gap?',['What keeps you awake at night?','If you couldn\'t work tomorrow, how long would your family be okay?','What does financial peace of mind look like?','What would happen to your family if you weren\'t here?'],1,'This question directly reveals how prepared the client is for income disruption.'),
    Q('How is success redefined in the shift from seller to advisor?',['More policies sold per month','Higher premium values','Gaps closed and scores improved','More client referrals'],2,'The advisor measures success by protection outcomes, not sales volume.'),
    Q('Which approach does the Risk Advisor use for objections?',['Overcome through persuasion','Ignore and move on','Understand and address the underlying concern','Discount the price'],2,'The advisor sees objections as information about client concerns, not barriers to overcome.')
  ]),
  hScript('From Insurance Seller to Risk Advisor',[
    'Every insurance advisor starts somewhere. Most start the same way: with a product catalogue, a price list, and a target. Sell this policy. Hit this number. Move to the next lead. This is the product-first trap, and it is the default setting for our industry. But here is the problem: when you lead with product, you become a salesperson. And clients can smell a sales pitch from a mile away.',
    'The shift from insurance seller to risk advisor is not about changing what you know. It is about changing who you are in the conversation. A seller walks in thinking: "What can I sell this person today?" An advisor walks in thinking: "What is this person protecting, and how can I help?" That single shift changes everything.',
    'The five transformative questions are your tools for making this shift real. Question one: If you could not work tomorrow, how long would your family be okay? Question two: What keeps you awake at night? Question three: What would happen to your family if you were not here? Question four: If you could fix one thing about your current protection, what would it be? Question five: What does financial peace of mind look like for you? These five questions are worth more than any product catalogue.',
    'Your clients will tell you what they think they need. It is your job to discover what they actually need. The stated need might be "I want life insurance." The actual need might be "I need my children\'s education to be secure." Between those two statements lies the entire value of professional advice. That is where you operate as a risk advisor.'
  ]),
  hWorkbook([
    {t:'Your Identity Audit',i:'Answer honestly: In your last five client meetings, did you lead with risk questions or product features? What percentage of the conversation was listening?',p:['Think of your last five client meetings','For each one, note how you opened the conversation','Calculate: what percentage of the conversation was you listening?','Identify one specific change you will make in your next meeting']},
    {t:'The Five Questions Practice',i:'Write down your version of each of the five transformative questions. Adapt the wording to your natural speaking style and your typical client profile. Then practise saying them aloud.',p:['Write your adapted version of each question','Practise saying each one aloud until it feels natural','Role-play with a colleague — ask the questions and listen to their response','Reflect: which question felt most powerful? Why?']}
  ]),
  hCase('The Commission-Focused Agent','Tunde is a 34-year-old insurance agent who has been selling policies for 3 years. He is good at selling — consistently hitting 120% of target. But his persistency rate is dropping. Clients buy from him once, then cancel or don\'t renew. His pipeline feels like a treadmill: constantly finding new leads because existing clients don\'t stay. He knows the product features inside out. He can compare any two policies on price and benefits. But when clients ask "Do I really need this?" or "Is this right for me?" he deflects to features and pricing. After a recent policy lapsed and the client\'s claim was declined due to non-disclosure, Tunde is questioning his approach. He wants to become a trusted advisor — but doesn\'t know where to start.',[
    'Analyse Tunde\'s situation: what behaviours are driving his low persistency?',
    'Using the Five Transformative Questions framework, write exactly how Tunde should open his next client conversation — word for word.',
    'Create a 30-day transition plan for Tunde to shift from seller to advisor: what specific actions should he take?',
    'Identify one metric Tunde should track instead of sales volume to measure his new advisory approach.',
    'How would Tunde handle a client who says "I just want the cheapest life insurance" using the stated vs actual need framework?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'The Five Transformative Questions — Reference Card',description:'Printable card with the five questions for your wallet or desk'},
    {url:'#',type:'doc',title:'Identity Shift Self-Assessment',description:'Worksheet to evaluate your current advisory identity across 10 dimensions'}
  ])
);

C4[2] = L(
  hContent('The Trusted Advisor Mindset',[
    'Understand and apply the TRUST framework (Truthfulness, Reliability, Understanding, Simplicity, Transparency)',
    'Use the Credibility Equation to evaluate your advisory relationships',
    'Identify trust destroyers and replace them with trust-building behaviours',
    'Apply the Claims Test before every recommendation'
  ],[
    SE('The TRUST Framework','Trust is built on five pillars: Truthfulness — always tell the truth, even when it costs you a sale. Reliability — do what you say, when you say you will. Understanding — demonstrate deep knowledge of your client\'s situation. Simplicity — make complex insurance concepts simple. Transparency — be open about costs, commissions, and limitations. Add Confidentiality — protect client information fiercely.'),
    SE('The Credibility Equation','Credibility = Competence \u00d7 Character + Connection. Competence is your technical knowledge. Character is your integrity. Connection is your ability to relate. If Character = 0, then Credibility = 0 — no matter how competent you are. Integrity is the multiplier that makes everything else count.'),
    T('Trust Destroyers vs Trust Builders',['Dimension','Destroyer','Builder'],[
      ['Conversation','Monologue about products','Dialogue about needs'],
      ['Language','Industry jargon','Plain, clear language'],
      ['Recommendations','One-size-fits-all','Tailored to client situation'],
      ['Follow-through','Inconsistent','Reliable and accountable'],
      ['Transparency','Hidden fees and commissions','Open about costs'],
      ['Urgency','False scarcity','Patient, client-paced'],
      ['Mistakes','Blames others or hides','Owns it and fixes it']
    ]),
    SE('The Claims Test','Before making any recommendation, ask yourself: "Would I recommend this to my own mother? To my brother? Would I buy this for myself if I were in my client\'s shoes?" If the answer is no, do not recommend it. This is not just ethics — it is good business. Clients who trust you stay with you, refer you, and listen to your advice.'),
    C('Trust is built in drops and lost in buckets. Every interaction is a deposit or a withdrawal.')
  ],[
    'The TRUST framework provides five pillars: Truthfulness, Reliability, Understanding, Simplicity, and Transparency',
    'The Credibility Equation shows that character is a multiplier — zero character means zero credibility',
    'Trust destroyers include overselling, jargon, pressure, inconsistency, and broken promises',
    'The Claims Test ensures every recommendation passes the "would I recommend this to my family?" standard'
  ]),
  hQuiz([
    Q('According to the Credibility Equation, what happens if Character equals zero?',['Credibility is unaffected','Competence compensates','Credibility becomes zero regardless of competence','Connection becomes the most important factor'],2,'If Character = 0, Credibility = 0. No matter how competent you are, without integrity you have no credibility.'),
    Q('What is the Claims Test?',['Testing whether a claim will be approved','Asking if you would recommend this to your own family','Checking the client\'s claim history','Testing insurance policy wordings'],1,'Before recommending, ask: would I recommend this to my own mother or brother?'),
    Q('Which of the following is a trust builder?',['Using industry jargon to demonstrate expertise','Creating urgency to close the sale','Open dialogue about client needs in plain language','Overselling additional products'],2,'Plain language dialogue about client needs builds trust; jargon and pressure destroy it.'),
    Q('In the TRUST framework, what does \'S\' stand for?',['Speed','Simplicity','Sales','Strategy'],1,'Simplicity — making complex insurance concepts simple for clients.'),
    Q('Why is follow-through important for trust?',['It is not important if you close the sale','It demonstrates reliability and accountability','Clients do not notice follow-through','It only matters for large policies'],1,'Consistent follow-through builds reliability, one of the five TRUST pillars.')
  ]),
  hScript('The Trusted Advisor Mindset',[
    'Trust is the currency of advisory. Without it, you are just another salesperson. With it, you become indispensable. But trust does not come from a business card that says "advisor" or a fancy office. It comes from consistent behaviour over time. Every interaction with a client is either a deposit into the trust account or a withdrawal.',
    'The TRUST framework gives you five pillars to build on. Truthfulness means telling the truth even when it costs you a sale. Reliability means doing what you said you would do, when you said you would do it. Understanding means demonstrating genuine knowledge of your client\'s situation. Simplicity means making the complex simple. Transparency means being open about costs, commissions, and limitations. Add Confidentiality, and you have the foundation of every great advisory relationship.',
    'Here is a hard truth: you can be the most technically competent advisor in the world. But if your character is questionable, your credibility is zero. The Credibility Equation is simple: Credibility equals Competence multiplied by Character, plus Connection. If Character is zero, the whole equation goes to zero. That is how important integrity is.',
    'Before you recommend anything to a client, apply the Claims Test. Would you recommend this to your own mother? Would you buy this for yourself if you were in their shoes? If the answer is no, do not recommend it. This is not just ethics — it is good business. Clients who trust you stay with you. They refer you. They listen to you. Trust is not just nice to have. It is everything.'
  ]),
  hWorkbook([
    {t:'Trust Account Audit',i:'For each of your current clients, assess the state of your trust account with them. Is it positive or negative? What specific deposits have you made? Any withdrawals?',p:['List your 5 most important client relationships','Rate each trust account as positive, neutral, or negative','Note 3 specific deposits you have made for each','If negative, identify what withdrawal caused it','Create a plan to rebuild trust where needed']},
    {t:'The Claims Test in Practice',i:'Think of a recent recommendation you made to a client. Run it through the Claims Test honestly.',p:['Describe the recommendation you made','Would you recommend this to your own family? Why or why not?','If yes, what makes it stand up to the test?','If no, what would you change?','Commit to applying the Claims Test before every future recommendation']}
  ]),
  hCase('The Trust Deficit','Mrs. Eze is a 52-year-old widow with three grown children. She has been approached by insurance agents three times in the past two years. Each agent promised her "comprehensive coverage" but when she tried to claim on her hospital bill last year, she discovered her policy excluded the very condition she was hospitalised for. The agent who sold it to her has since left the industry and is unreachable. She now has three policies from three different companies, pays over NGN800,000 annually in premiums, and has no clear idea what any of them actually cover. Her son, a banker, has urged her to stop wasting money on insurance. When you meet her, she is polite but guarded. Her opening words: "I don\'t trust insurance people."',[
    'Without mentioning a single product, how do you open this conversation? Write your exact opening words.',
    'What specific behaviours would demonstrate trustworthiness in this first meeting?',
    'Use the TRUST framework to identify what the previous agents failed at. Which pillars were broken?',
    'Mrs. Eze says "Insurance is a waste of money." How do you respond without being defensive?',
    'Design a 90-day trust-building plan: what do you do in the first, second, and third meetings, and why?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'TRUST Framework Quick Reference',description:'One-page guide to the five TRUST pillars with example behaviours'},
    {url:'#',type:'doc',title:'Trust Account Tracker',description:'Template to track trust deposits/withdrawals for each client relationship'}
  ])
);

C4[3] = L(
  hContent('Asking Better Questions & Listening for Risk',[
    'Apply the Question Ladder to progress from surface facts to deep understanding',
    'Navigate the 5 Levels of Discovery in client conversations',
    'Identify risk signals in everyday client language',
    'Ask sensitive questions using hypothetical framing and normalising language'
  ],[
    T('The Question Ladder with Examples',['Level','Type','Example'],[
      ['1','Open','"Tell me about your family\'s situation"'],
      ['2','Probing','"You mentioned your son wants to study abroad. What does that look like financially?"'],
      ['3','Consequence','"If something happened to your health, what would happen to the business?"'],
      ['4','Reflective','"You seem concerned about retirement. What specifically worries you?"']
    ]),
    T('The 5 Levels of Discovery',['Level','Focus','Question Example'],[
      ['1 — Factual','Data and facts','"What cover do you currently have?"'],
      ['2 — Emotional','Feelings and fears','"How does that make you feel?"'],
      ['3 — Consequence','Impact and ripple effects','"What would happen if you couldn\'t work for 6 months?"'],
      ['4 — Aspirational','Goals and dreams','"What are you working toward financially?"'],
      ['5 — Hidden','Undisclosed information','"Is there anything else I should know?"']
    ]),
    SE('The Risk Signal Method','Train your ear to hear risk signals in everyday client language. When a client says "I hope my health insurance covers that" — that is a risk signal. When they say "My business partner handles all that" — that is a risk signal. When they say "I haven\'t updated my will since..." — that is a risk signal. Capture these signals and explore them with follow-up questions.'),
    SE('Asking Sensitive Questions','Death, disability, illness, and finances are uncomfortable topics — but your clients need you to ask. Use hypothetical framing: "Let\'s imagine a scenario where..." Use normalising: "Many of my clients feel uncertain about this." Use permission: "Would it be okay if I asked you something personal?" When you ask with care, clients feel safe enough to tell you the truth.'),
    C('You have two ears and one mouth for a reason. Listen twice as much as you speak. Every word a client says contains a risk signal — if you are listening for it.')
  ],[
    'The Question Ladder progresses from open to probing to consequence to reflective questions',
    'The 5 Levels of Discovery move from factual through emotional, consequence, aspirational, to hidden',
    'Risk signals are client statements that reveal unaddressed exposures — listen for them',
    'Sensitive questions require hypothetical framing, normalising, and permission asking'
  ]),
  hQuiz([
    Q('What is the purpose of the Question Ladder?',['To sell more products faster','To progress from surface-level facts to deeper client understanding','To confuse clients with complex questions','To demonstrate the advisor\'s expertise'],1,'The Question Ladder moves from open to reflective, progressively deepening the discovery conversation.'),
    Q('At which level of discovery do you ask "What would happen if you could not work for 6 months?"',['Level 1 — Factual','Level 2 — Emotional','Level 3 — Consequence','Level 4 — Aspirational'],2,'Consequence questions explore the ripple effect of events on the client\'s life.'),
    Q('What is a risk signal in client language?',['When a client asks about premium costs','Words or phrases that indicate an unaddressed exposure','When a client mentions their favourite insurance company','Technical insurance terminology used by the client'],1,'Risk signals are client statements that reveal potential exposures, like "I hope my insurance covers that."'),
    Q('How should you ask sensitive questions about death or disability?',['Avoid them entirely — too uncomfortable','Ask directly with no preamble','Use hypothetical framing and normalising language','Wait for the client to bring it up'],2,'Hypothetical framing and normalising make sensitive topics approachable.'),
    Q('Why are reflective questions important in discovery?',['They show the client you are listening','They close the sale faster','They replace the need for product knowledge','They confuse the client into agreeing'],0,'Reflective questions demonstrate active listening and encourage deeper sharing.')
  ]),
  hScript('Asking Better Questions & Listening for Risk',[
    'The quality of your advice is directly limited by the quality of your questions. If you ask shallow questions, you get shallow answers. And shallow answers lead to inadequate protection. The single most important skill you can develop as a risk advisor is not product knowledge — it is the ability to ask powerful questions and listen actively to the answers.',
    'The Question Ladder is your framework for ever-deeper discovery. Start with open questions: "Tell me about your family." Then probe: "You mentioned your daughter wants to study medicine — what does that mean financially?" Then consequence: "If something happened to your health, what would happen to her education?" Then reflect: "You seem passionate about her future. Tell me more about what you want for her." Each rung of the ladder takes you deeper into the client\'s risk reality.',
    'Train yourself to hear risk signals. When a client says "I hope my insurance covers that," circle back. When they say "My business partner handles all that," explore. When they say "I haven\'t updated my will since the kids were born," that is a flashing red light. These signals are everywhere — but only if you are truly listening.',
    'Asking sensitive questions is part of the job. Death, disability, illness, money — these are uncomfortable topics. But your clients need you to ask. Use hypothetical framing: "Let\'s imagine a scenario where..." Use normalising: "Many of my clients feel uncertain about this." Use permission: "Would it be okay if I asked something personal?" When you ask with care, clients feel safe enough to tell you the truth.'
  ]),
  hWorkbook([
    {t:'The Question Ladder Practice',i:'For a typical client scenario, write questions at each level of the Question Ladder.',p:['Pick a client type you work with','Write 2 open questions','Write 2 probing questions','Write 2 consequence questions','Write 2 reflective questions','Test them with a colleague — which ones got the best responses?']},
    {t:'Risk Signal Hunt',i:'Over your next 3 client conversations, consciously listen for risk signals. Write down every signal you hear.',p:['Before each conversation, set an intention to listen for signals','Write down any phrase that suggests an exposure','After the conversation, review your list','For each signal, write a follow-up question for your next meeting','Reflect: how many signals would you have missed if you weren\'t specifically listening?']}
  ]),
  hCase('The Silent Business Owner','Mr. Okonkwo is a 58-year-old business owner who runs a successful manufacturing company employing 120 people. He has been in business for 25 years. His wife helps with administration but is not involved in operations. His son recently joined the business as operations manager. In your first meeting, Mr. Okonkwo tells you: "I have insurance. My broker handles everything. I am too busy to think about it. Just send me the renewal and I will pay it." He is clearly impatient and sees this meeting as a waste of time. He has not looked at his policies in 5 years. His broker has never met him in person.',[
    'What risk signals do you hear in Mr. Okonkwo\'s opening statements? Identify at least 3.',
    'Using the Question Ladder, write the first open question you would ask.',
    'What probing question would you ask about his son joining the business? This is a consequence area.',
    'How do you handle his "I\'m too busy" objection without being pushy?',
    'What sensitive question must you ask about his wife\'s situation and business succession? Write it using a hypothetical frame.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'The Question Ladder Reference Card',description:'Printable card with example questions at each level'},
    {url:'#',type:'doc',title:'Risk Signal Log Template',description:'Template to capture client risk signals during and after conversations'}
  ])
);

C4[4] = L(
  hContent('Consultative Risk Conversations',[
    'Apply the 8-Stage Consultative Conversation Framework from Connect to Commit',
    'Use the "So What?" Test to trace every recommendation to real client impact',
    'Handle objections as information, not obstacles',
    'Apply the No-Pressure Principle in every client interaction'
  ],[
    T('The 8-Stage Conversation Framework',['Stage','Name','What You Do','Example Language'],[
      ['1','Connect','Build rapport, set the tone','"Thank you for trusting me with this conversation"'],
      ['2','Discover','Ask questions, listen, capture signals','"Tell me about your situation"'],
      ['3','Reflect','Summarise what you heard','"If I understand correctly, your main concerns are..."'],
      ['4','Reframe','Connect concerns to risk categories','"What you described is actually a business continuity risk"'],
      ['5','Prioritise','Help the client decide what matters','"If we could only address one of these today, which would it be?"'],
      ['6','Recommend','Present grounded options','"Based on what you have told me, here is what I suggest"'],
      ['7','Confirm','Check understanding and agreement','"Does that make sense? Does this feel right for you?"'],
      ['8','Commit','Agree on next steps and timeline','"Let\'s agree on the next three steps"']
    ]),
    SE('The "So What?" Test','For every recommendation, ask "So what?" until you reach the client impact. Example: "This policy has a 30-day waiting period." So what? "It means claims in the first month won\'t be paid." So what? "If you have an accident in week 2, you would need to cover costs yourself." So what? "You need an emergency fund for the first month." Now the client understands the real implication.'),
    SE('Objection Handling','Objections are not obstacles — they are information. When a client objects, they are telling you something important. Explore it. "Tell me more about that concern." "What specifically worries you about the cost?" "Have you had a bad experience before?" Most objections dissolve when properly understood. Your job is to understand, not to persuade.'),
    SE('The No-Pressure Principle','Never create false urgency. If a solution is genuinely right for the client, the timing will present itself. Your job is to present the picture clearly enough that the client wants to act — not to pressure them into acting. True advisory means creating clarity, not urgency.'),
    C('A consultative conversation is not a transaction. It is a partnership. You are not selling a product. You are building a protection strategy together.')
  ],[
    'The 8-Stage Framework guides every client conversation from Connect through Commit',
    'The "So What?" Test traces every recommendation to its real human impact',
    'Objections are information — explore them rather than fight them',
    'The No-Pressure Principle means creating clarity, not urgency'
  ]),
  hQuiz([
    Q('What is the purpose of the Reflect stage in the 8-stage framework?',['To present product options','To summarise what you have heard and validate the client\'s concerns','To ask for the sale','To discuss premium payments'],1,'Reflect is about feeding back what you heard so the client feels understood.'),
    Q('What does the "So What?" test do?',['Tests whether a product is affordable','Traces any recommendation to its real client impact','Asks the client for their opinion','Checks if the advisor understands the product'],1,'The "So What?" test pushes every recommendation to its human impact.'),
    Q('How should an advisor view client objections?',['As obstacles to overcome','As information about the client\'s concerns','As reasons to lower the price','As signs the client is not interested'],1,'Objections are data — explore them rather than fight them.'),
    Q('What is the No-Pressure Principle?',['Always offer discounts to close the deal','Present the picture clearly enough that the client wants to act — never force urgency','Avoid difficult topics with clients','Let the client make decisions without any guidance'],1,'The No-Pressure Principle means creating clarity, not urgency.'),
    Q('In which stage do you say "Based on what you have told me, here is what I suggest"?',['Discover','Reflect','Recommend','Confirm'],2,'Recommend is where you present grounded options based on discovery.')
  ]),
  hScript('Consultative Risk Conversations',[
    'A consultative risk conversation is a structured dialogue, not a sales pitch. It has eight stages, each building on the last. Together they create a complete advisory experience that leaves the client feeling heard, understood, and empowered to act.',
    'Stage one: Connect. Do not start with insurance. Start with gratitude. "Thank you for trusting me with this conversation." Stage two: Discover. Ask the questions from Lesson 3. Listen for signals. Take notes. Stage three: Reflect. Feed back what you heard. "If I understand correctly, your main concerns are your children\'s education and your business continuity." This is where the client thinks: "This person actually listens."',
    'Stage four: Reframe. Connect their concerns to risk categories. "What you described is a key-person risk that could affect business continuity." Stage five: Prioritise. "If we could only address one of these today, which would it be?" Stage six: Recommend. Ground your recommendations in what they shared. Stage seven: Confirm. "Does this make sense? Does it feel right?" Stage eight: Commit. Agree on next steps. Not your next steps — our next steps.',
    'Remember: objections are not obstacles. They are information. When a client says "That is too expensive," do not defend the price. Explore: "Tell me what you are comparing it to." When they say "I need to think about it," ask: "What specifically would you like to think through?" Most objections dissolve when properly understood. And the No-Pressure Principle: present the picture clearly, and let the client want to act. That is true advisory.'
  ]),
  hWorkbook([
    {t:'Map the 8 Stages',i:'Think of your last client meeting. Map it against the 8-stage framework. Which stages did you do well? Which did you skip?',p:['Write down the 8 stages','For each stage, note what you actually did or said','Rate your effectiveness 1-5','Identify 2 stages to focus on improving','Write specific language for those stages']},
    {t:'The "So What?" Drill',i:'Take 3 common recommendations you make. Run each through the "So What?" test until you reach client impact.',p:['Write down recommendation 1','Ask "So what?" and write the answer','Ask "So what?" again — repeat until you reach human impact','Do the same for recommendations 2 and 3','Reflect: how often do you communicate at this depth with clients?']}
  ]),
  hCase('The Price Shopper','Mr. Adeleke is a 41-year-old IT consultant who has been approached by three different insurance agents in the past month. He has called you specifically because he wants the "lowest possible premium" for life insurance. He is a classic price shopper: comparing quotes, focused on monthly costs, and dismissive of anything "extra." He opens the conversation with: "Just give me your best price for 10-year term, NGN20 million cover. If it is competitive, I will buy. If not, I will go with the other guy." He has a wife who stays home with their two young children (ages 3 and 5), a mortgage of NGN35M, and he is the sole income earner. He is in good health but works 60-hour weeks and has high stress.',[
    'Do you give him the price he asked for? Why or why not?',
    'How do you move from "price shopper" to "risk discovery" without losing him? Write your exact words for transitioning the conversation.',
    'Using the 8-stage framework, map exactly how this conversation should flow. Write what you say at each stage.',
    'Apply the "So What?" test to the term life quote. What is the real client impact if this is all he buys?',
    'Mr. Adeleke says "I don\'t need all that extra stuff." Which stage of the framework do you use, and what do you say?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'8-Stage Conversation Framework Card',description:'Printable wallet card with all 8 stages and example phrases'},
    {url:'#',type:'doc',title:'Consultative Conversation Planner',description:'Template to plan your next advisory conversation using the 8 stages'}
  ])
);

C4[5] = L(
  hContent('Communicating Risk & Making the Invisible Visible',[
    'Understand the Risk Visibility Gap and why risk is invisible to clients',
    'Apply the 5-Step Visibility Framework to make risk feel real',
    'Use the Risk Cascade to show downstream effects of a single risk event',
    'Master the Cost of Nothing conversation to overcome price objections'
  ],[
    SE('The Risk Visibility Gap','Risk is invisible. Clients cannot see, touch, or feel it. Insurance is abstract — a promise to pay in the future if something bad happens. The Risk Visibility Gap is the distance between what the advisor sees (clear risk exposure) and what the client perceives (vague concern or nothing at all). The wider this gap, the harder it is for the client to act. Closing this gap is the core skill of risk communication.'),
    T('The Risk Visibility Gap',['Element','Advisor Sees','Client Sees'],[
      ['Risk Exposure','Clear, quantified danger','Vague concern or nothing'],
      ['Probability','Statistical likelihood','"It won\'t happen to me"'],
      ['Impact','Financial devastation','"I will manage somehow"'],
      ['Urgency','Act now','"I will think about it later"'],
      ['Solution','Specific cover needed','"Insurance is expensive"']
    ]),
    SE('5-Step Visibility Framework','A five-step process to close the Risk Visibility Gap: 1. IDENTIFY — Name the specific risk. "You have a business continuity risk." 2. VISUALISE — Paint the picture. "Imagine waking up tomorrow and your factory cannot operate." 3. QUANTIFY — Put numbers on it. "This would cost your business approximately NGN 15 million per month." 4. CONNECT — Link to what they care about. "This affects your ability to pay your 120 employees and send your son to university." 5. ACT — Show the path forward. "Here is exactly how we close this gap."'),
    SE('The Risk Cascade','How a single risk event cascades through a client\'s life. Example: A heart attack (health crisis) → inability to work (income loss) → depleted savings (financial crisis) → children\'s education affected (family impact) → stress on spouse (relationship impact) → forced asset sale (wealth destruction). Show the client the chain reaction so they understand that one uninsured risk can trigger multiple catastrophes.'),
    SE('The "What If Tomorrow?" Method','Start every conversation about a specific risk with "What if tomorrow..." For example: "What if tomorrow you received a letter that your health insurance doesn\'t cover your treatment? How would you feel? What would you do?" This technique makes risk feel immediate and personal rather than abstract and distant.'),
    SE('The Cost of Nothing Conversation','Help clients understand the cost of inaction. Not just the premium cost, but the cost of NOT having cover. Ask: "What does it cost you to have no cover for this risk?" Clients usually think about premium cost but rarely calculate the cost of being uninsured. The premium is not an expense — it is an investment in avoiding a much larger cost.'),
    C('Risk is invisible. Your job is to make it visible. When clients see their risk as clearly as you do, they act.')
  ],[
    'The Risk Visibility Gap is the distance between advisor perception and client perception of risk',
    'Use the 5-Step Framework: Identify, Visualise, Quantify, Connect, Act',
    'The Risk Cascade shows how one event triggers a chain reaction through a client\'s life',
    'Master the Cost of Nothing conversation to reframe premium from expense to investment'
  ]),
  hQuiz([
    Q('What is the Risk Visibility Gap?',['The difference between premium costs and coverage benefits','The gap between what the advisor sees as risk and what the client perceives','The difference between actual risk and insured risk','The gap between different insurance providers\' quotes'],1,'The Visibility Gap is the disconnect between what the advisor recognises as exposure and what the client perceives.'),
    Q('In the 5-Step Visibility Framework, which step involves putting numbers on the risk?',['Identify','Visualise','Quantify','Connect'],2,'Quantify is where you translate risk into financial terms the client can grasp.'),
    Q('What is the purpose of the Risk Cascade?',['To list all possible insurance products','To show how a single risk event creates a chain reaction of impacts','To calculate premium affordability','To compare different insurance companies'],1,'The Risk Cascade demonstrates the domino effect of a single risk event through all areas of a client\'s life.'),
    Q('What does the "What If Tomorrow?" method do?',['Creates false urgency','Makes risk feel immediate and personal rather than abstract','Discounts the premium cost','Focuses on product features'],1,'By asking "What if tomorrow..." you make the risk feel real and immediate.'),
    Q('What does the Cost of Nothing conversation help clients understand?',['That insurance is always affordable','The cost of being uninsured vs the premium cost','That all risks are covered by standard policies','That premiums never increase'],1,'The Cost of Nothing helps clients compare the premium cost against the far larger cost of being uninsured.')
  ]),
  hScript('Communicating Risk & Making the Invisible Visible',[
    'Risk is invisible. Your clients cannot see it, touch it, or feel it. When they wake up healthy, they feel healthy. When their business is running, they feel secure. The risk of a heart attack, a fire, a business disruption — these are abstract until they happen. Your job as a risk advisor is to make the invisible visible. To help clients see what they cannot see for themselves.',
    'The Risk Visibility Gap is the distance between what you see as an advisor and what your client perceives. You see a clear exposure — a family with inadequate life cover, a business with no key-person protection, a professional with no disability insurance. But your client sees... nothing. Or at best, a vague concern they keep meaning to address. Closing this gap is the core skill of risk communication.',
    'Use the five-step Visibility Framework. First, Identify the risk by name. Second, Visualise it — paint a picture of what it would look like. Third, Quantify it — put numbers on the impact. Fourth, Connect it to what they care about — their family, their business, their dreams. Fifth, Show the path to Act. When you take a client through these five steps, risk stops being abstract and becomes real.',
    'The Cost of Nothing conversation is powerful. Your client is focused on the premium cost. "NGN 50,000 a month? That is expensive." But ask them: "What does it cost you to have no cover for this risk? What is the cost of nothing?" Suddenly the conversation shifts. The premium is not an expense — it is an investment in avoiding a much larger cost. Make risk visible, and clients act.'
  ]),
  hWorkbook([
    {t:'Build a Risk Cascade',i:'Pick one risk that is common for your typical client. Map the cascade from initial event through all the ripple effects.',p:['Choose one risk (e.g., critical illness, business fire, car accident)','Write the initial event at the top','Map at least 5 downstream effects','For each effect, note the financial and emotional impact','Practise explaining this cascade to a colleague in under 2 minutes']},
    {t:'The Cost of Nothing Calculation',i:'For a typical client scenario, calculate both the premium cost AND the cost of being uninsured.',p:['Pick a risk scenario','Research the premium cost for adequate cover','Calculate the financial impact of being uninsured (income loss, asset sale, debt, etc.)','Write a script comparing the two numbers','Practise the conversation with a colleague']}
  ]),
  hCase('The Successful Doctor','Dr. Bello is a 45-year-old cardiothoracic surgeon at a leading private hospital in Lagos. She earns approximately NGN 25 million annually. She drives a luxury car, lives in an upscale neighbourhood, and her three children attend expensive private schools. She has zero disability insurance, zero income protection, and a life policy worth only NGN 5 million (taken out when she was 25). When you meet her, she says: "I am healthy, I am young, and I have a good income. I do not see the point of all this insurance you people keep trying to sell me. I have savings." She is intelligent, confident, and dismissive. Her savings would cover about 4 months of her current lifestyle.',[
    'Build a Risk Cascade for Dr. Bello: what happens if she suffers a hand injury (career-ending for a cardiac surgeon)? Map at least 5 downstream effects.',
    'Apply the 5-Step Visibility Framework to this conversation. Write what you would say at each of the 5 steps.',
    'Calculate the Cost of Nothing for Dr. Bello: what is the actual cost of being uninsured for disability? Consider income loss, lifestyle change, children\'s education, asset sales.',
    'How do you use the "What If Tomorrow?" method with someone who believes "It won\'t happen to me"? Write your exact words.',
    'Dr. Bello\'s savings cover 4 months. How do you respectfully show this is inadequate without making her feel foolish?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'5-Step Visibility Framework Card',description:'Printable reference for the Identify-Visualise-Quantify-Connect-Act framework'},
    {url:'#',type:'doc',title:'Cost of Nothing Calculator',description:'Template to calculate and compare premium cost vs uninsured cost for any scenario'}
  ])
);

C4[6] = L(
  hContent('Handling Objections & Difficult Client Conversations',[
    'Understand objections as information, not obstacles to overcome',
    'Apply the L-C-U-R-C framework to any objection',
    'Use the Objection Iceberg to uncover hidden concerns',
    'Know when to walk away from a client relationship'
  ],[
    SE('Objections Are Information','Every objection contains a hidden message about the client\'s fears, past experiences, or misconceptions. When a client objects, they are telling you exactly what stands between them and better protection. Most advisors treat objections as things to overcome — the best advisors treat them as clues to explore.'),
    SE('The L-C-U-R-C Framework','A five-step process for handling any objection: Listen — fully without interrupting. Let the client finish. Do not prepare your response while they are speaking. Clarify — by asking questions. "Can you tell me more about that?" "What specifically concerns you?" Understand — the real concern beneath the surface. Is it about trust? Cost? Fear? Control? Past experience? Respond — to the real concern, not the surface objection. Address what they actually need to hear. Confirm — they feel heard and their concern is addressed. "Does that answer your concern?" "How does that sit with you?"'),
    SE('The Objection Iceberg','The stated objection is above the water (visible). The real objection is below the surface (hidden). "This is too expensive" above water. Below: "I am afraid of wasting money like I did before" or "I don\'t trust insurance companies" or "I can\'t afford another monthly payment." Your job is to explore what is below the surface.'),
    T('Objection Iceberg — Surface vs Real',['Stated Objection','Possible Real Objection'],[
      ['"This is too expensive"','"I had a bad claims experience and don\'t trust insurers"'],
      ['"I need to think about it"','"I feel pressured and need space"'],
      ['"I already have insurance"','"I am afraid of being sold something I don\'t need"'],
      ['"My brother-in-law is my agent"','"I feel disloyal speaking with you"'],
      ['"I will wait until next year"','"I am overwhelmed and procrastinating"']
    ]),
    SE('The CALM Principle for Difficult Conversations','Calm — Breathe. Do not react emotionally. Stay professional. Acknowledge — Validate their feelings. "I understand why you feel that way." Lead — Guide the conversation toward understanding. "Can I share a perspective?" Manage — Keep the conversation productive and on track. Do not get derailed.'),
    SE('When to Walk Away','Not every client is the right client. Signs it is time to walk away: repeated dishonesty, unethical requests, no decision-making ability, toxic behaviour, fundamental values misalignment. Walking away preserves your integrity and reputation. The best advisors know when to say yes — and when to say no.'),
    C('The objection is not the problem. The objection is a signpost pointing to the real problem. Follow it.')
  ],[
    'Objections are information — every objection contains a hidden message about the client\'s real concern',
    'Use L-C-U-R-C: Listen, Clarify, Understand, Respond, Confirm',
    'The Objection Iceberg reveals the gap between stated and real concerns',
    'Use CALM for difficult conversations; know when walking away is the right choice'
  ]),
  hQuiz([
    Q('In the L-C-U-R-C framework, what should you do first when a client raises an objection?',['Immediately respond with a counter-argument','Listen fully without interrupting','Offer a discount to resolve it','Change the subject'],1,'The first step is to Listen fully — do not prepare your response while they are speaking.'),
    Q('What does the Objection Iceberg represent?',['The difference between cheap and expensive insurance','The gap between stated objections and the real concern beneath the surface','How objections get bigger over time','The difference between personal and business insurance'],1,'The Objection Iceberg shows that the stated objection is visible, but the real concern is hidden below the surface.'),
    Q('When a client says "I need to think about it," what might be the real objection?',['They genuinely need more information','They feel pressured and need space','They want a better price','They are not interested at all'],1,'"I need to think about it" often signals feeling pressured rather than needing information.'),
    Q('What does the "L" in CALM Principle stand for?',['Listen','Lead','Laugh','Leave'],1,'L is for Lead — guide the conversation toward understanding.'),
    Q('When is it appropriate to walk away from a client?',['When they say no to your first recommendation','When there is repeated dishonesty or unethical requests','When they want to compare prices','When they ask too many questions'],1,'Walking away is appropriate when values misalign, dishonesty is present, or the client behaves unethically.')
  ]),
  hScript('Handling Objections & Difficult Client Conversations',[
    'Objections are not obstacles. They are information. Every time a client objects to something, they are giving you a gift — they are telling you exactly what stands between them and better protection. The problem is most advisors treat objections as things to overcome, rather than clues to explore.',
    'The L-C-U-R-C framework gives you a repeatable process. Listen without interrupting. Clarify with genuine curiosity. Understand the real concern beneath the words. Respond to that real concern. Confirm the client feels heard. When you follow this sequence, most objections simply dissolve — not because you argued better, but because you understood better.',
    'The Objection Iceberg is a crucial mental model. Above the water, the client says "This is too expensive." But below the water, the real concern might be "I was mis-sold before and I am afraid of being taken advantage of again." If you respond to "too expensive" with price justification, you miss the real issue. You need to dive below the surface. Ask: "Can you tell me more about what is driving that concern?"',
    'Not every client is your client. There is dignity in walking away from a relationship that does not align with your values. When a client is dishonest, unethical, or simply not ready to engage, walking away preserves your integrity and protects your reputation. The best advisors know when to say yes — and when to say no.'
  ]),
  hWorkbook([
    {t:'Beneath the Surface',i:'For 5 common objections you hear, map what the REAL concern might be below the surface.',p:['List 5 objections you hear regularly','For each one, brainstorm 2-3 possible real concerns beneath the surface','Write a clarifying question for each that would help uncover the real concern','Practise asking these clarifying questions with a colleague']},
    {t:'The L-C-U-R-C Roleplay',i:'With a colleague, roleplay a scenario where the client raises a difficult objection. Follow the L-C-U-R-C framework step by step.',p:['Set up the scenario: client objects to premium cost','Step 1: Listen — let them finish completely (30 seconds)','Step 2: Clarify — ask 2 open questions','Step 3: Understand — identify the real concern','Step 4: Respond — address the real concern, not the surface one','Step 5: Confirm — check if they feel heard. Then swap roles.']}
  ]),
  hCase('The Burned Business Owner','Mr. Okafor is a 55-year-old business owner who has been in the transport and logistics business for 30 years. He is wealthy, well-connected, and used to getting his way. He has had insurance for 20 years but has never made a claim — until last year when a fire destroyed his warehouse. His insurance company fought the claim for 8 months, paid only 40% of the assessed value, and he had to hire a lawyer to get even that. He is furious. His opening words to you: "Insurance is legalised robbery. I paid premiums for 20 years and when I needed them, they abandoned me. You have 10 minutes to convince me otherwise." He is angry, distrustful, and ready to walk out. He has a turnover of NGN 500 million annually and 200 employees who depend on his business. He has no current insurance on his remaining warehouse or his fleet of 45 trucks.',[
    'How do you handle the first 60 seconds? Do NOT defend the insurance industry. What do you say?',
    'Using the Objection Iceberg, what is the REAL concern beneath his stated objection ("Insurance is robbery")?',
    'Apply the L-C-U-R-C framework step by step. Write exactly what you would say at each step.',
    'How do you use the CALM Principle when he raises his voice? Specifically, what does "Lead" look like here?',
    'Is this a client you should walk away from? Why or why not? What factors determine your decision?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'L-C-U-R-C Framework Reference',description:'Step-by-step guide to handling objections with the 5-step framework'},
    {url:'#',type:'doc',title:'Objection Iceberg Worksheet',description:'Template to map stated objections to possible real concerns'}
  ])
);

C4[7] = L(
  hContent('Building Long-Term Client Relationships',[
    'Understand the Client Lifecycle from prospect to advocate',
    'Master the Annual Risk Review as the cornerstone of relationship maintenance',
    'Identify change triggers that create new protection needs',
    'Build a referral culture through exceptional client experience'
  ],[
    SE('The Lifetime Relationship','The real value of advisory is not in the first sale — it is in the lifetime relationship. A client who trusts you for one product will trust you for all their protection needs — and will refer everyone they know. One well-served client can become an entire book of business. But this only happens if you nurture the relationship.'),
    T('Client Relationship Lifecycle',['Stage','What Happens','Advisor Activity'],[
      ['Prospect','Initial contact','Build awareness and credibility'],
      ['First Engagement','First meeting','Discovery and risk assessment'],
      ['Solution Delivered','Policy issued','Ensure smooth onboarding'],
      ['Onboarding','First 90 days','Check-in, confirm understanding'],
      ['Ongoing Service','Regular contact','Touchpoints, value-add content'],
      ['Review','Annual review','Full risk reassessment'],
      ['Deepening','Additional needs identified','Warm cross-sell, referrals'],
      ['Advocate','Client refers others','Leverage trust for introductions']
    ]),
    SE('Change Triggers','Major life events that create new protection needs: marriage, birth of a child, divorce, death of a family member, new job, promotion, business start, business sale, retirement, illness diagnosis, inheritance, relocation. Your job is to be aware of these triggers and reach out proactively at the right time — not to sell, but to help.'),
    SE('The Annual Risk Review','The cornerstone of relationship maintenance. Annual review structure: 1. Review changes — what has changed in their life since last year? 2. Review coverage — what has changed in their existing policies? 3. Reassess risk — has their risk profile changed? 4. Adjust recommendations — what needs updating? 5. Update CoverScore — show progress. 6. Plan ahead — what is coming in the next 12 months?'),
    SE('Claims Support: The Critical Moment','The most critical moment in any advisory relationship is the claims moment. Be the first person your client calls when something happens. Guide them through the process. Advocate for them with the insurer. A well-handled claim creates a client for life. A poorly handled claim — or absence during a claim — destroys everything you built.'),
    SE('Warm Cross-Selling','Not cold cross-selling ("you should also buy this"). Warm cross-selling: identifying related needs that naturally follow from the client\'s situation. "Given your family situation, have you also thought about how your mortgage would be covered if something happened to you?" This is not selling — it is completing their protection picture.'),
    C('The best clients are not the ones you find. They are the ones who find you — because someone they trust sent them.')
  ],[
    'The Client Lifecycle spans 8 stages from Prospect to Advocate',
    'The Annual Risk Review is the cornerstone of relationship maintenance with a 6-point structure',
    'Change triggers are life events that create new protection needs — reach out proactively',
    'Claims support is the most critical moment; warm cross-selling completes the protection picture'
  ]),
  hQuiz([
    Q('What is the cornerstone of long-term relationship maintenance in advisory?',['Monthly phone calls','The Annual Risk Review','Quarterly newsletters','Birthday cards'],1,'The Annual Risk Review is the structured touchpoint that ensures protection stays aligned with changing circumstances.'),
    Q('When is the most critical moment in any advisory relationship?',['When the policy is issued','The claims moment','The first meeting','The annual renewal'],1,'A well-handled claim creates a client for life; absence during a claim destroys everything.'),
    Q('What is the difference between warm cross-selling and cold cross-selling?',['Warm cross-selling uses higher prices','Warm cross-selling identifies related needs from the client\'s existing situation','Cold cross-selling involves warmer language','There is no difference'],1,'Warm cross-selling flows naturally from the client\'s situation; cold cross-selling is disconnected product pushing.'),
    Q('In the Client Lifecycle, what happens at the Onboarding stage?',['Initial meeting','Policy delivery and first 90-day check-in','Annual review','Client refers friends'],1,'Onboarding covers the first 90 days including confirming understanding and smooth implementation.'),
    Q('What are change triggers in the context of client relationships?',['Changes in insurance premium prices','Major life events that create new protection needs','Changes in insurance regulations','Changes in the advisor\'s commission structure'],1,'Major life events like marriage, birth, new job, illness diagnosis, etc. trigger new protection needs.')
  ]),
  hScript('Building Long-Term Client Relationships',[
    'The real value of advisory is not in the first sale. It is in the lifetime relationship. A client who trusts you for one product will trust you for all their protection needs. They will refer their family, their friends, their colleagues. One well-served client can become an entire book of business. But this only happens if you nurture the relationship.',
    'The Annual Risk Review is the cornerstone of relationship maintenance. Once a year, sit down with every client. Not to sell something — to review. What has changed in their life? Has their coverage kept up? Has their risk profile shifted? Show them their CoverScore progress. Plan for the next 12 months. The Annual Risk Review transforms you from a salesperson into a genuine risk partner.',
    'The claims moment is the most critical moment in any advisory relationship. When something bad happens, your client should call you first. Not the insurance company. You. And when they call, you answer. You guide them. You advocate for them. A well-handled claim creates a client for life. Being absent during a claim destroys everything you have built.',
    'Look for change triggers in your clients\' lives. A new baby means you need to review life cover. A promotion means income protection may need updating. A business launch means a whole new set of risks. When you reach out at these moments — not to sell, but to help — you demonstrate that you are paying attention. And clients notice. They stay. They refer. They become advocates.'
  ]),
  hWorkbook([
    {t:'Design Your Annual Review Process',i:'Create a structured annual review template that you can use with every client.',p:['Write the 6-point annual review structure','For each point, write 2-3 specific questions to ask','Design a simple one-page summary to leave with the client','Create a follow-up timeline for after the review','Practise delivering the review with a colleague']},
    {t:'Map Your Client Lifecycle',i:'For your current top 5 clients, map where they are in the Client Lifecycle.',p:['List your 5 best clients','For each, identify which lifecycle stage they are in','Note what change triggers might be approaching','Write 1 action you will take for each client this month','Set a reminder to check their life events quarterly']}
  ]),
  hCase('Three Years of Silence','Mrs. Diallo is a 48-year-old client who bought a comprehensive life and critical illness policy from you three years ago. At the time, she was a marketing director at a major bank, recently divorced, with one son in university in Canada. You had a great first year — regular check-ins, a smooth onboarding, she referred two colleagues. Then you got busy. New clients. New targets. You stopped calling. She didn\'t call either. Three years have passed. You have had zero contact. You don\'t know: her son graduated and is working in Canada; she was promoted to executive director; she was diagnosed with high blood pressure two years ago (which she now manages); she got married again six months ago; her new husband has two children from a previous marriage; and she has been approached by another advisor who is "much more attentive." She has agreed to meet with you one more time. This is your last chance.',[
    'You have 3 years of catching up to do. How do you open this meeting without being defensive?',
    'What change triggers can you identify from the 3 years of updates? List at least 5, and for each, identify the protection implication.',
    'Design the Annual Risk Review for Mrs. Diallo: what has changed, what needs updating, what new cover is needed?',
    'How do you handle the fact that another advisor has been more attentive? What do you say?',
    'Create a 12-month relationship plan to rebuild trust and restore this client to advocate status. Include specific actions and timelines.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Annual Risk Review Template',description:'Structured template for conducting the annual review with any client'},
    {url:'#',type:'doc',title:'Client Lifecycle & Change Trigger Reference',description:'Full lifecycle stages with associated change triggers and advisory actions'}
  ])
);

C4[8] = L(
  hContent('Module 4 Knowledge Check & Advisory Simulation',[
    'Demonstrate mastery of all CCA 104 frameworks across 7 lessons',
    'Apply advisory skills to realistic client scenarios',
    'Complete a comprehensive practical simulation',
    'Progress through AI Roleplay at 5 difficulty levels'
  ],[
    SE('Assessment Structure','This is the capstone assessment for CCA 104. It has three parts: Part A — Knowledge Check (20 questions, 40 points), Part B — Scenario Questions (5 questions, 20 points), and Part C — Practical Simulation (40 points). Plus an AI Roleplay component at 5 difficulty levels. The assessment measures your ability to think like a trusted risk advisor — not your memory of product details.'),
    SE('Part A — Knowledge Check','20 questions worth 2 points each (40 points total). Questions cover: The Five Transformative Questions, TRUST Framework, Credibility Equation, Claims Test, Question Ladder, 5 Levels of Discovery, Risk Signal Method, 8-Stage Framework, "So What?" Test, No-Pressure Principle, 5-Step Visibility Framework, Risk Cascade, Cost of Nothing, L-C-U-R-C Framework, Objection Iceberg, CALM Principle, Client Lifecycle, Annual Risk Review, Claims Support, and Warm Cross-Selling.'),
    SE('Part B — Scenario Questions','5 questions worth 4 points each (20 points total). Each presents a realistic advisory scenario testing your ability to apply frameworks. Scenarios include: a client asking for the cheapest quote, a long-standing client diagnosed with critical illness, a client objecting to switching insurers, a client whose business has outgrown their cover, and a profitable but unresponsive client.'),
    SE('Part C — Practical Simulation: The Ogunlesi Family','Worth 40 points. Mr. and Mrs. Ogunlesi, both 39, married 10 years with two children. He is a senior architect earning NGN 18M/year. She runs a growing catering business earning NGN 4M/year. They have a NGN 50M mortgage, existing life cover of NGN 10M each (inadequate), no disability cover, no business protection, and only 2 months of emergency savings. He has been experiencing chest pains but hasn\'t seen a doctor. She is considering a NGN 5M equipment loan for business expansion. Students must conduct a full annual review, handle the health conversation sensitively, advise on the business loan, and present an updated CoverScore with a 12-month roadmap.'),
    SE('AI Roleplay Assessment','5 difficulty levels: Level 1 (Beginner) — basic discovery using the five transformative questions. Level 2 (Developing) — apply TRUST Framework, handle a simple objection. Level 3 (Competent) — full 8-stage consultative conversation with "So What?" Test and Question Ladder. Level 4 (Advanced) — handle Objection Iceberg, L-C-U-R-C, Risk Cascade, and difficult topics. Level 5 (Mastery) — complete simulated client relationship including annual review, claims support, change triggers, warm cross-selling, and walking away decisions.'),
    C('This assessment is not a test of memory. It is a test of judgment. We are measuring your ability to think like a trusted risk advisor.')
  ],[
    'The Module 4 Assessment has three parts: Knowledge Check, Scenario Questions, and Practical Simulation',
    'Part C features the Ogunlesi family case study — a full annual review with multiple complex factors',
    'The AI Roleplay has 5 levels from Beginner to Mastery, each testing progressively advanced skills',
    'The assessment measures advisory judgment, not product knowledge or memory'
  ]),
  hQuiz([
    Q('What is the primary purpose of the Module 4 Assessment?',['To test memory of insurance product features','To measure the ability to think like a trusted risk advisor','To evaluate sales closing skills','To assess knowledge of insurance regulations'],1,'The assessment measures advisory judgment, not product knowledge or memory.'),
    Q('In the practical simulation, what is the most critical risk signal in the Ogunlesi case?',['She wants a business loan','He has been having chest pains but hasn\'t seen a doctor','They have NGN 10M life cover each','They bought a home 2 years ago'],1,'His chest pains and avoidance of medical attention is a critical risk signal requiring sensitive handling.'),
    Q('What change triggers are present in the Ogunlesi simulation?',['None — everything is stable','Business growth, potential health issue, and property purchase','Only the mortgage is new','Only her business is new'],1,'Multiple triggers: her business growth, his health concerns, and the new mortgage.'),
    Q('In the AI Roleplay assessment, what does Level 5 (Mastery) test?',['Basic product knowledge','Complete simulated client relationship including annual review and complex decisions','Simple objection handling','Asking the five transformative questions'],1,'Level 5 tests the full range of advisory skills in a complete client relationship simulation.'),
    Q('How should students prepare for Part C (Practical Simulation)?',['Memorise all insurance product details','Review all 7 lessons and practise applying the frameworks to realistic scenarios','Prepare a sales script','Focus only on product pricing'],1,'The simulation tests integrated application of all frameworks from Lessons 1-7.')
  ]),
  hScript('Module 4 Knowledge Check & Advisory Simulation',[
    'Congratulations on reaching Module 4 Knowledge Check and Advisory Simulation. This is your capstone assessment for CoverScore Certified Associate module four. It is not a test of memory. It is a test of judgment. We are measuring your ability to think, decide, and act like a trusted risk advisor.',
    'The assessment has three parts. Part A: Knowledge Check — 20 questions covering everything from the Five Transformative Questions to the Client Lifecycle. Two points each, 40 points total. Part B: Five scenario-based questions worth 4 points each. These test your ability to apply frameworks to realistic situations. Part C: The Practical Simulation — worth 40 points. You will work through a complete case study: the Ogunlesi family, who have experienced significant life changes since their last review.',
    'The practical simulation is the heart of the assessment. You will conduct a full annual review, identify risk signals, have a sensitive conversation about health concerns, advise on a business expansion, and present a prioritised protection plan. This is as close as it gets to a real advisory conversation.',
    'There is also an AI Roleplay component with five difficulty levels. Level 1 tests basic discovery. Level 2 tests trust-building. Level 3 tests the full consultative framework. Level 4 tests objection handling. Level 5 tests mastery — a complete client relationship simulation. Work through each level sequentially. Each level prepares you for the next. Good luck. You have learned the mindset, the frameworks, and the skills. Now it is time to demonstrate that you can think like a risk advisor.'
  ]),
  hWorkbook([
    {t:'Self-Assessment: Rate Your Readiness',i:'For each lesson in this module, rate your confidence 1-5. Identify your weakest areas and create a study plan.',p:['List Lessons 1-7','Rate your confidence 1-5 for each lesson\'s core frameworks','For any lesson rated 3 or below, review the key concepts','Practise explaining each framework aloud from memory','Write a one-paragraph summary of the entire module']},
    {t:'Simulation Dry Run',i:'Work through the Ogunlesi case study with a colleague before the assessment.',p:['Read the Ogunlesi simulation details carefully','Role-play the annual review meeting — one person plays the advisor, one plays Mr. Ogunlesi','The advisor must identify all change triggers and risk signals','Practise the health conversation (chest pains) with sensitivity','Present the updated CoverScore and 12-month roadmap','Switch roles and repeat']}
  ]),
  hCase('The Ogunlesi Family Annual Review','Mr. and Mrs. Ogunlesi, both 39. Married 10 years. Two children ages 6 and 3. He is a senior architect earning NGN 18M per year at a reputable firm. She left her HR career 3 years ago to start a catering business that now earns NGN 4M per year and is growing. They bought a home 2 years ago with a NGN 50M mortgage on a 25-year term. Their existing life cover is NGN 10M each — a policy taken out 8 years ago when they were first married. They have no disability cover, no business protection, no income protection, and their emergency fund would cover only 2 months of expenses. He has been experiencing occasional chest pains for the past 4 months but hasn\'t seen a doctor — he is "too busy with work." She is considering expanding her catering business to include a commercial kitchen and needs a NGN 5M equipment loan. They have come to you for their annual review.',[
    'Conduct a full annual review: identify all change triggers, risk profile changes, and protection gaps. List each one with its priority level.',
    'How do you raise the chest pain issue with sensitivity? Write your exact words. Use hypothetical framing.',
    'Advise on her business expansion: what protection does the NGN 5M loan need? What about business continuity? What about her as a key person?',
    'Calculate their current life cover gap: NGN 10M each vs mortgage + family needs + children\'s education. What should their cover be?',
    'Present the updated CoverScore and a prioritised 12-month protection roadmap with specific actions and timelines.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Module 4 Assessment Preparation Guide',description:'Complete guide to all three parts of the assessment with sample questions and marking criteria'},
    {url:'#',type:'doc',title:'AI Roleplay Assessment Overview',description:'Description of all 5 difficulty levels with preparation tips and success criteria'},
    {url:'#',type:'doc',title:'Ogunlesi Case Study Worksheet',description:'Blank template for working through the practical simulation'}
  ])
);

// ═══════════════════════════════════════════════════════════════════
// COURSE 5: CCA 105 — Practical Risk Advisory & Client Assessment (8 lessons)
// ═══════════════════════════════════════════════════════════════════

C5[1] = L(
  hContent('Preparing for a CoverScore Client Engagement',[
    'Understand why pre-engagement preparation determines advisory success',
    'Apply a structured research framework to prepare for each client meeting',
    'Formulate risk hypotheses before stepping into the conversation',
    'Distinguish between the three levels of preparation: strategic, tactical, and logistical'
  ],[
    SE('The Pre-Engagement Principle','Preparation is not what you do before the real work. Preparation is the real work. In risk advisory, your value is determined not by what you say during the meeting, but by what you discovered before it. Every client has a story. Your job is to read as much of it as possible before they walk through the door — or before you walk through theirs.'),
    T('The 7-Step Pre-Engagement Model',['Step','Action','Output'],[
      ['1','Review existing data','Client profile summary'],
      ['2','Research external context','Industry and market brief'],
      ['3','Identify known exposure areas','Risk hypothesis list'],
      ['4','Define engagement objectives','Meeting agenda'],
      ['5','Prepare discovery questions','Question map'],
      ['6','Assemble supporting materials','Resource kit'],
      ['7','Set success criteria','Engagement scorecard']
    ]),
    SE('The Risk Hypothesis','A risk hypothesis is an educated guess about what a client\'s key exposures might be based on available information. It is not a conclusion — it is a starting point. You enter the conversation with hypotheses and leave with answers. Frame hypotheses as questions: "I wonder whether their business has adequate key-person protection given their reliance on the founding partner." The hypothesis focuses your discovery on what matters most.'),
    T('Three Levels of Preparation',['Level','Focus','Time Required'],[
      ['Strategic','Client context, industry risks, life stage', '60-90 minutes'],
      ['Tactical','Specific products, coverage gaps, benchmarks', '30-45 minutes'],
      ['Logistical','Documents, system, meeting flow, agenda', '15-20 minutes']
    ]),
    C('Preparation is the invisible difference between an average advisor and a great one. The client will never see the hours you spent preparing. They will only feel the results.')
  ],[
    'The Pre-Engagement Principle: preparation is the real work, not a precursor to it',
    'The 7-Step Pre-Engagement Model provides a structured approach to client preparation',
    'Risk hypotheses are educated guesses that focus discovery conversations',
    'Three levels of preparation: strategic, tactical, and logistical'
  ]),
  hQuiz([
    Q('What is a risk hypothesis?',['A final conclusion about the client\'s risks','An educated guess about key exposures to validate in conversation','A list of products to recommend','A summary of the client\'s current cover'],1,'A risk hypothesis is an educated guess that focuses discovery — not a conclusion, but a starting point.'),
    Q('Why is preparation considered "the real work"?',['Because it takes the most time','Because it determines the quality and relevance of your advice','Because clients pay for preparation time','Because it replaces the need for discovery questions'],1,'Your value is determined by what you discover before the meeting — preparation shapes the entire engagement.'),
    Q('Which level of preparation focuses on industry risks and client context?',['Logistical','Tactical','Strategic','Administrative'],2,'Strategic preparation addresses client context, industry risks, and life stage — the big picture.'),
    Q('How should a risk hypothesis be framed?',['As a firm recommendation','As a question to be answered during discovery','As a problem statement','As a product suggestion'],1,'Framing hypotheses as questions keeps you open to discovery rather than jumping to conclusions.'),
    Q('What is the output of Step 2 (Research External Context) in the 7-Step Model?',['A product list','An industry and market brief','A signed proposal','A client profile summary'],1,'Step 2 produces an industry and market brief to understand the client\'s operating environment.')
  ]),
  hScript('Preparing for a CoverScore Client Engagement',[
    'Welcome to CCA 105: Practical Risk Advisory and Client Assessment. This is where everything comes together. In CCA 101 through 104, you learned the CoverScore methodology, the scoring system, the advisor mindset, and the frameworks for client conversations. Now you will learn how to apply all of it in real advisory engagements. Lesson one is about preparation.',
    'Here is a truth that separates average advisors from exceptional ones: preparation is not what you do before the real work. Preparation IS the real work. Your value in a client conversation is determined not just by what you say in the meeting, but by what you discovered before it. Every client has a story. Your job is to read as much of it as possible before they walk through the door.',
    'The 7-Step Pre-Engagement Model gives you a structured approach. Step one: review existing data and create a client profile summary. Step two: research external context — industry trends, economic conditions, regulatory changes. Step three: identify known exposure areas and build your risk hypothesis list. Step four: define clear engagement objectives. Step five: prepare discovery questions. Step six: assemble supporting materials. Step seven: set success criteria.',
    'A risk hypothesis is an educated guess about what a client\'s key exposures might be. It is not a conclusion — it is a starting point. You enter the conversation with hypotheses and leave with answers. Frame them as questions: "I wonder whether their business has adequate key-person protection given their reliance on the founding partner." This focuses your discovery on what matters.',
    'Finally, understand the three levels of preparation. Strategic preparation takes 60 to 90 minutes and covers client context, industry risks, and life stage. Tactical preparation takes 30 to 45 minutes and covers specific products, coverage gaps, and benchmarks. Logistical preparation takes 15 to 20 minutes — documents, system readiness, meeting flow, and agenda. Invest your time proportionally. The client will never see the hours you spent preparing. They will only feel the results.'
  ]),
  hWorkbook([
    {t:'Build a Pre-Engagement Checklist',i:'Create your personal pre-engagement checklist based on the 7-Step Model.',p:['List all 7 steps with specific actions for each','For Step 2, identify 3 sources of external research you will use','For Step 3, write 3 sample risk hypotheses for a typical client','For Step 7, define what success looks like in measurable terms','Test your checklist on your next real or practice client']},
    {t:'Risk Hypothesis Practice',i:'Write risk hypotheses for the following client scenarios before the discovery conversation.',p:['A 45-year-old business owner with 20 employees and no succession plan','A young professional couple expecting their first child','A company expanding into a new geographic market','A retiree with significant investment properties','For each, frame the hypothesis as a question to be answered']}
  ]),
  hCase('The New Prospect','Mr. Adewale is a 48-year-old chartered accountant who runs a medium-sized firm with 12 professional staff and 8 support staff. He has been in practice for 18 years. He is married with four children ages 14 to 22. His eldest child is in her final year of medical school abroad. He owns the office building through a separate property company. His wife runs a boutique consulting firm. You have an introductory meeting scheduled for next Tuesday. You have no existing relationship with him — this is a cold lead from a referral partner who said "He needs to sort out his insurance."',[
    'Using the 7-Step Model, create your pre-engagement plan. What do you need to research before the meeting?',
    'Write 3 risk hypotheses about Mr. Adewale. Frame each as a question.',
    'What strategic, tactical, and logistical preparation do you need? List specific actions for each level.',
    'What are your engagement objectives for this first meeting? Define success criteria.',
    'What documents or information would you ask Mr. Adewale to bring to the first meeting?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Pre-Engagement Checklist Template',description:'Printable 7-step checklist for client preparation'},
    {url:'#',type:'doc',title:'Risk Hypothesis Worksheet',description:'Template for formulating and tracking risk hypotheses'}
  ])
);

C5[2] = L(
  hContent('Conducting the CoverScore Discovery Conversation',[
    'Navigate the 8-Stage Discovery Conversation Model from opening to close',
    'Use the Question Funnel technique to move from broad to specific',
    'Build Risk Chains that connect events to consequences to financial impact',
    'Apply the Listen-Reflect-Probe method for deeper client understanding'
  ],[
    T('The 8-Stage Discovery Conversation Model',['Stage','Purpose','Key Question'],[
      ['1 — Open','Set context and build rapport','"Thank you for meeting me today"'],
      ['2 — Permission','Get consent to explore','"Would it be okay if I ask you some questions about your situation?"'],
      ['3 — Context','Understand their world','"Tell me about your business and family"'],
      ['4 — Explore','Dig into risk areas','"What keeps you up at night?"'],
      ['5 — Deepen','Connect risk to impact','"If that happened, what would be the financial consequence?"'],
      ['6 — Summarise','Check understanding','"Let me make sure I understand correctly..."'],
      ['7 — Next Steps','Set expectations','"Based on what you\'ve shared, here is what I recommend we do next"'],
      ['8 — Close','Confirm commitment','"Shall we schedule the follow-up?"']
    ]),
    SE('The Question Funnel','Start broad and narrow down. Open questions explore the landscape: "Tell me about your business." Probing questions focus on specific areas: "You mentioned your key staff. What would happen if one of them left?" Reflective questions deepen understanding: "It sounds like you are concerned about continuity. Is that right?" Consequence questions connect risk to impact: "If your business partner became incapacitated, what would happen to the company?"'),
    SE('Building Risk Chains','A Risk Chain connects a risk event to its full financial impact. Format: "[Event] leads to [Consequence] which results in [Financial Impact]." Example: "If the founding partner becomes critically ill, the business loses its primary revenue generator, which results in a 60 percent drop in income and potential loan default." Risk Chains make abstract risks concrete and motivate action.'),
    T('Listen-Reflect-Probe Method',['Step','Action','Example'],[
      ['Listen','Hear without interrupting','Client: "I worry about my children\'s future"'],
      ['Reflect','Paraphrase back','"So you are concerned about providing for your children no matter what happens"'],
      ['Probe','Explore deeper','"What specifically worries you most about their future?"']
    ]),
    C('The quality of your discovery determines the quality of your advice. A shallow conversation produces shallow recommendations. Deep discovery uncovers real risk, real priorities, and real solutions.')
  ],[
    'The 8-Stage Discovery Model provides a complete conversation structure from open to close',
    'The Question Funnel moves from broad open questions to specific consequence questions',
    'Risk Chains connect events to consequences to financial impact — making risk tangible',
    'Listen-Reflect-Probe is the core communication technique for deep discovery'
  ]),
  hQuiz([
    Q('What is the purpose of Stage 2 (Permission) in the Discovery Model?',['To make the client feel comfortable','To get consent before exploring personal risk information','To pitch products','To set the meeting duration'],1,'Permission is about getting the client\'s consent to explore their personal risk situation before diving in.'),
    Q('What is a Risk Chain?',['A sequence of insurance products to recommend','A connection between a risk event, its consequence, and the financial impact','A list of potential claims','A chain of command in risk management'],1,'A Risk Chain connects event to consequence to financial impact, making abstract risks concrete.'),
    Q('In the Question Funnel, what type of question comes first?',['Consequence questions','Closed yes/no questions','Broad open questions','Leading questions'],2,'Start broad and open to explore the landscape before narrowing down.'),
    Q('What does the Reflect step in Listen-Reflect-Probe involve?',['Reflecting on your own experience','Paraphrasing the client\'s words back to them','Reflecting light on the client\'s face','Refusing to accept the client\'s answer'],1,'Reflect means paraphrasing the client\'s words back to confirm understanding.'),
    Q('What should happen at Stage 6 (Summarise)?',['Close the sale','Check understanding by summarising what the client shared','Present product recommendations','End the meeting'],1,'Stage 6 is about checking your understanding before moving to next steps.')
  ]),
  hScript('Conducting the CoverScore Discovery Conversation',[
    'The discovery conversation is the heart of the CoverScore advisory process. Everything else — the assessment, the report, the recommendations — depends on what you uncover here. A shallow conversation produces shallow advice. Deep discovery produces recommendations that genuinely protect your client. In this lesson, you will learn a structured approach to discovery that ensures you never miss what matters.',
    'The 8-Stage Discovery Conversation Model gives you a complete framework. Stage 1: Open — set context and build rapport. Stage 2: Permission — get consent to explore personal risk. Stage 3: Context — understand their world: their family, their business, their goals. Stage 4: Explore — dig into risk areas using the Question Funnel. Stage 5: Deepen — connect risk to financial impact using Risk Chains.',
    'The Question Funnel is your primary tool. Start broad: "Tell me about your business." Narrow down: "You mentioned your key staff — what would happen if one of them left?" Deepen: "It sounds like you are concerned about continuity. Is that right?" Connect: "If your business partner became incapacitated, what would happen to the company?" Each question goes deeper than the last.',
    'Risk Chains make abstract risks concrete. Format: Event leads to Consequence which results in Financial Impact. For example: "If the founding partner becomes critically ill, the business loses its primary revenue generator, which results in a 60 percent drop in income and potential loan default." When clients hear the chain, they understand why they need protection.',
    'Finally, master the Listen-Reflect-Probe method. Listen without interrupting. Reflect by paraphrasing: "So you are concerned about providing for your children no matter what happens." Probe: "What specifically worries you most?" This method builds trust and uncovers depth that surface-level questions never reach.'
  ]),
  hWorkbook([
    {t:'Map Your Discovery Conversation',i:'Using the 8-Stage Model, write out exactly what you will say at each stage for your next client meeting.',p:['Write your opening script for Stage 1','Write your permission-asking script for Stage 2','List 5 open questions for Stage 3','List 5 probing questions for Stage 4','Write 2 Risk Chains you expect to explore']},
    {t:'Practice Listen-Reflect-Probe',i:'Find a colleague or friend. Ask them to describe a risk or concern in their life. Practise the full Listen-Reflect-Probe cycle three times.',p:['First round: Listen for 2 minutes without interrupting','Reflect: paraphrase their key concern back to them','Probe: ask one deeper question','Repeat the cycle two more times','Write down what you discovered in each round that you would have missed with surface-level questioning']}
  ]),
  hCase('The Reluctant Business Owner','Mr. Okafor is a 55-year-old founder and managing director of a construction company with 85 employees and annual revenue of NGN 450 million. He agreed to meet with you at the urging of his bank manager, who wants him to have "proper insurance" as a condition for a new NGN 100 million credit facility. Mr. Okafor is polite but clearly sceptical. He tells you: "I have been in business 25 years and never claimed. Insurance is a waste of money. I am only here because the bank is forcing me." He has no business continuity plan, no key-person cover, no buy-sell agreement with his two junior partners, and all company assets are personally guaranteed.',[
    'Using the 8-Stage Model, how do you open this conversation given his scepticism? Write your exact opening words.',
    'At Stage 2 (Permission), Mr. Okafor says "Just ask your questions, I do not have all day." How do you handle this?',
    'Build a Risk Chain for Mr. Okafor: if he became incapacitated, what happens to the business, the bank loan, his partners, and his personal guarantees?',
    'Use the Question Funnel to design 5 questions that move from broad to deep with this client.',
    'After discovery, summarise the key risks you would present back to Mr. Okafor at Stage 6.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Discovery Conversation Quick Reference',description:'8-Stage Model on one page for reference during client meetings'},
    {url:'#',type:'doc',title:'Question Funnel Builder',description:'Template to design your discovery questions before each client meeting'}
  ])
);

C5[3] = L(
  hContent('Identifying Risk Objects in the Real World',[
    'Identify the 7 categories of risk objects in any client situation',
    'Distinguish between risk events and risk objects in client conversations',
    'Map dependencies between risk objects to reveal hidden exposure chains',
    'Apply the Risk Object Mapping Process to build a complete picture of what is at risk'
  ],[
    SE('What Is a Risk Object?','A risk object is anything of value that can be lost, damaged, or diminished. In risk advisory, we protect risk objects — not policies. Every client has multiple risk objects: their life, their health, their income, their business, their property, their reputation, and their obligations to others. Your job is to identify every risk object and understand what threatens it.'),
    T('The 7 Categories of Risk Objects',['Category','Examples','Common Blind Spot'],[
      ['People','Self, spouse, children, business partners, key employees','Underinsuring key employees'],
      ['Income','Salary, business profits, investment returns, rental income','Ignoring disability impact on income'],
      ['Assets','Property, vehicles, equipment, inventory, intellectual property','Forgetting liability on assets'],
      ['Liabilities','Mortgages, loans, guarantees, lease obligations, tax liabilities','Personal guarantees on business debt'],
      ['Business','Revenue stream, contracts, client relationships, brand reputation','No succession or continuity plan'],
      ['Future','Children\'s education, retirement, business exit, legacy','Deferring planning until "later"'],
      ['Dependents','Family, employees, community obligations, charitable commitments','Assuming government will provide']
    ]),
    SE('Risk Event vs Risk Object','A risk event is something that happens — an accident, an illness, a death, a lawsuit. A risk object is what suffers when the event occurs. Clients often focus on the event ("I hope I never get into an accident") when they should focus on the object ("If I had an accident, my income would stop, and my family depends on that income"). Your job is to shift their focus from the event to what is actually at risk.'),
    T('The Risk Object Mapping Process',['Step','Action','Question'],[
      ['1','List all risk objects','"What do you value that could be lost?"'],
      ['2','Identify threats to each','"What could damage or diminish this?"'],
      ['3','Map dependencies','"What else depends on this object?"'],
      ['4','Assess current protection','"What would happen if it was lost today?"'],
      ['5','Prioritise based on impact','"Which loss would be most devastating?"']
    ]),
    C('Every client has risk objects they have never thought about. Your job is not just to protect what they know — it is to reveal what they do not know they have at risk.')
  ],[
    'Risk objects are anything of value that can be lost, damaged, or diminished — there are 7 categories',
    'Risk events are what happens; risk objects are what suffers when the event occurs',
    'Dependencies between risk objects create hidden exposure chains',
    'The 5-step Risk Object Mapping Process builds a complete picture of what is at risk'
  ]),
  hQuiz([
    Q('What is a risk object?',['An insurance policy','Anything of value that can be lost, damaged, or diminished','A type of risk event','A claims form'],1,'A risk object is anything of value that can be lost, damaged, or diminished.'),
    Q('Which of the following is a risk event, not a risk object?',['A person\'s income','A car accident that damages a vehicle','A house','A business contract'],1,'The car accident is the event; the vehicle and the person\'s health are the risk objects.'),
    Q('What is a common blind spot when it comes to People as risk objects?',['Overinsuring key employees','Underinsuring key employees','Insuring family members','Not insuring yourself'],1,'Key employees are often underinsured or not insured at all — a common blind spot.'),
    Q('Why is mapping dependencies between risk objects important?',['It increases premium volume','It reveals hidden exposure chains','It is required by regulation','It simplifies policy administration'],1,'Dependencies reveal how the loss of one object affects others — hidden exposure chains.'),
    Q('In the Risk Object Mapping Process, what happens at Step 4?',['List all risk objects','Assess current protection and what would happen if lost today','Map dependencies','Prioritise based on impact'],1,'Step 4 assesses what protection currently exists and what the impact of loss would be.')
  ]),
  hScript('Identifying Risk Objects in the Real World',[
    'A risk object is anything of value that can be lost, damaged, or diminished. Every client has multiple risk objects — their life, their health, their income, their business, their property, their reputation, and their obligations to others. Your job is not just to protect what they already know they have at risk. It is to reveal what they have never thought about.',
    'There are 7 categories of risk objects. People: yourself, your spouse, your children, business partners, key employees. Income: salary, business profits, investment returns, rental income. Assets: property, vehicles, equipment, inventory, intellectual property. Liabilities: mortgages, loans, guarantees, lease obligations. Business: revenue stream, contracts, brand. Future: education, retirement, legacy. And Dependents: family, employees, community.',
    'Here is a critical distinction: a risk event is something that happens. A risk object is what suffers when the event occurs. Clients often focus on the event — "I hope I never get into an accident." Your job is to shift their focus to the object: "If you had an accident, your income would stop. Your family depends on that income. Your income is the risk object."',
    'The Risk Object Mapping Process has 5 steps. Step 1: list all risk objects by asking "What do you value that could be lost?" Step 2: identify what threatens each object. Step 3: map dependencies — what else depends on this object? Step 4: assess current protection. Step 5: prioritise based on impact.',
    'Dependencies are critical. If the business owner becomes incapacitated, the business suffers, which means income stops, which means the mortgage is at risk, which means the family home is at risk. One loss cascades through multiple risk objects. When you map these chains, clients finally understand why protection matters.'
  ]),
  hWorkbook([
    {t:'Risk Object Inventory',i:'Choose a real or hypothetical client. List every risk object across all 7 categories.',p:['Create 7 columns, one for each category','List at least 3 risk objects per category','For each object, write what threatens it','Map dependencies: which objects depend on others?','Rate each object\'s current protection as: None, Partial, or Adequate']},
    {t:'Dependency Chain Analysis',i:'Pick one key risk object and trace its dependency chain.',p:['Select a central risk object (e.g., a business owner\'s health)','List every other object that depends on it','Trace the cascade: if this object is lost, what happens next? Then what? Then what?','Identify the single point of failure in the chain','Determine what protection would break the chain at each link']}
  ]),
  hCase('The Family Office Scenario','The Oluwole family office manages the wealth of a prominent Nigerian family. The patriarch, Chief Oluwole (72), built a conglomerate spanning manufacturing, real estate, and agriculture. He has four children: two work in the business, two have independent careers. The family owns 12 commercial properties, a 500-hectare agricultural estate, a manufacturing plant, and a significant investment portfolio. They employ 340 people across all entities. The Chief has recently been diagnosed with early-stage Parkinson\'s disease. The family wants to understand their risk exposure comprehensively.',[
    'Using the 7 categories, list all risk objects for the Oluwole family office.',
    'Map the dependency chains: if Chief Oluwole\'s health deteriorates further, what risk objects are affected? Trace the full cascade.',
    'Identify any single points of failure in the family\'s current risk structure.',
    'What risk objects are likely unaddressed or underappreciated by the family?',
    'Prioritise the top 5 risk objects that need immediate attention and explain your reasoning.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk Object Categories Reference',description:'One-page guide to the 7 categories with examples and common blind spots'},
    {url:'#',type:'doc',title:'Dependency Mapping Template',description:'Visual template for mapping risk object dependencies and cascading impacts'}
  ])
);

C5[4] = L(
  hContent('Building the Client\'s Risk Profile',[
    'Assess client risk across 8 dimensions to build a complete risk profile',
    'Distinguish between facts, assumptions, and information gaps in client data',
    'Construct a Risk Profile Card that summarises the client\'s exposure picture',
    'Apply a priority matrix to rank risks by likelihood and impact'
  ],[
    T('The 8 Dimensions of a Client Risk Profile',['Dimension','What You Assess','Key Question'],[
      ['1 — Personal','Age, health, family structure, dependents','"Who depends on you financially?"'],
      ['2 — Financial','Income, savings, debt, expenses, obligations','"What are your fixed monthly obligations?"'],
      ['3 — Asset','Property, vehicles, equipment, investments','"What do you own that needs protecting?"'],
      ['4 — Liability','Loans, guarantees, leases, future education costs','"What debts would remain if you were gone?"'],
      ['5 — Business','Revenue, employees, contracts, supply chain, IP','"What keeps your business running?"'],
      ['6 — Health','Medical history, lifestyle, family health history','"Are there any health conditions you are managing?"'],
      ['7 — Coverage','Existing policies, sum assured, beneficiaries, exclusions','"What cover do you currently have and what does it actually protect?"'],
      ['8 — Future','Goals, plans, timelines, expected changes','"What are your financial goals for the next 5 to 10 years?"']
    ]),
    SE('Facts, Assumptions, and Information Gaps','Not all data is equal. Facts are verified information — the client told you and you confirmed it. Assumptions are reasonable inferences based on available data — if the client is 45 with three children, you can assume education funding is relevant. Information gaps are what you do not know yet — and these are the most dangerous. Every risk profile should explicitly state what is fact, what is assumption, and what remains unknown.'),
    SE('The Risk Profile Card','The Risk Profile Card is a one-page summary that captures the client\'s complete risk picture at a glance. It includes: client summary, key facts, the 8-dimension snapshot, top 5 risks identified, current CoverScore, and information gaps. Use it as your compass throughout the advisory engagement — it keeps you focused on what matters.'),
    T('Priority Matrix for Risk Ranking',['Quadrant','Likelihood','Impact','Action'],[
      ['Critical','High','High','Address immediately'],
      ['Important','Low','High','Plan and monitor'],
      ['Possible','High','Low','Monitor and review'],
      ['Monitor','Low','Low','Review periodically']
    ]),
    C('A risk profile is a living document. It changes as the client\'s life changes. The best risk profile is not the most detailed one — it is the one that gets used and updated.')
  ],[
    'The 8 dimensions of a risk profile: Personal, Financial, Asset, Liability, Business, Health, Coverage, Future',
    'Distinguish facts from assumptions from information gaps — gaps are the most dangerous',
    'The Risk Profile Card is a one-page summary that guides the entire engagement',
    'A priority matrix ranks risks by likelihood and impact to focus attention on what matters most'
  ]),
  hQuiz([
    Q('Why is it important to distinguish facts from assumptions in a risk profile?',['Assumptions are always wrong','Fact and assumption require different levels of confidence and different follow-up actions','Facts are not important','Assumptions are more important than facts'],1,'Facts are verified; assumptions need confirmation. Explicitly labelling them prevents overconfidence.'),
    Q('What is the purpose of the Risk Profile Card?',['To present to the client at the end','To provide a one-page compass that guides the entire engagement','To replace the CoverScore assessment','To satisfy regulatory requirements'],1,'The Risk Profile Card keeps you focused on what matters throughout the engagement.'),
    Q('In the Priority Matrix, what action is recommended for risks with High Likelihood and High Impact?',['Review periodically','Plan and monitor','Address immediately','Monitor'],2,'Critical risks with high likelihood and high impact must be addressed immediately.'),
    Q('Which risk profile dimension asks "What debts would remain if you were gone?"',['Personal','Asset','Liability','Coverage'],2,'The Liability dimension assesses debts, guarantees, and obligations that survive the client.'),
    Q('What is the most dangerous type of information in a risk profile?',['Verified facts','Reasonable assumptions','Information gaps','Client opinions'],2,'Information gaps are the most dangerous because you do not know what you do not know.')
  ]),
  hScript('Building the Client Risk Profile',[
    'A risk profile is a comprehensive picture of everything that could go wrong in a client\'s financial life and how protected they currently are. It is the foundation of every advisory recommendation you will make. Build it thoroughly, and your advice will be relevant. Build it poorly, and you might as well be guessing.',
    'There are 8 dimensions to assess: Personal, Financial, Asset, Liability, Business, Health, Coverage, and Future. Each dimension has specific questions you must answer. Personal covers dependents and family structure. Financial covers income, expenses, and obligations. Asset covers property and investments. Liability covers debt and guarantees. Business covers revenue and operations. Health covers medical history. Coverage covers existing protection. Future covers goals and plans.',
    'As you gather data, label it explicitly. Facts are verified — the client told you and you confirmed it. Assumptions are reasonable inferences — if the client is 45 with three children, you assume education funding matters. Information gaps are what you do not know yet. These are the most dangerous because you cannot plan for what you do not know. Be honest about gaps and go find the answers.',
    'The Risk Profile Card is your compass. It is a one-page summary that captures the client summary, key facts, the 8-dimension snapshot, top 5 risks, current CoverScore, and information gaps. Refer to it before every client interaction. It keeps you focused on what matters.',
    'Finally, use the Priority Matrix to rank risks. High likelihood, high impact risks are Critical — address immediately. Low likelihood, high impact risks are Important — plan for them. High likelihood, low impact risks are Possible — monitor them. Low likelihood, low impact risks are Monitor — check periodically. This ensures you focus client resources on what matters most.'
  ]),
  hWorkbook([
    {t:'Build a Complete Risk Profile',i:'Using a client you know (real or hypothetical), build a full 8-dimension risk profile.',p:['Create a section for each of the 8 dimensions','Under each dimension, list facts, assumptions, and information gaps','Write at least 3 entries per dimension','Complete a Risk Profile Card summary','Identify the top 5 priority risks using the Priority Matrix']},
    {t:'Information Gap Hunt',i:'Review the risk profile you built. Identify information gaps and create a plan to fill them.',p:['List every information gap in your profile','For each gap, write 3 specific questions to ask the client','Identify which gaps are most critical to fill first','Create a timeline: when will you ask each question?','Practice asking the most sensitive gap questions with a colleague']}
  ]),
  hCase('The Expanding Business','Mrs. Dlamini is a 42-year-old founder of a rapidly growing logistics company with 45 vehicles, 120 employees, and operations in three countries. Revenue has grown from NGN 80 million to NGN 350 million in 4 years. She has outgrown her current insurance arrangements, which consist of basic motor third-party cover for her fleet and a personal life policy of NGN 20 million taken out 7 years ago. She has no key-person cover, no business interruption insurance, no cyber protection despite running a digital dispatch system, and no succession plan. She has a NGN 200 million loan for fleet expansion personally guaranteed. She is married with two teenage children.',[
    'Build the 8-dimension risk profile for Mrs. Dlamini. List facts, assumptions, and gaps for each dimension.',
    'Identify the top 5 priority risks using the Priority Matrix. Justify each ranking.',
    'What are the most critical information gaps you need to fill before making recommendations?',
    'Create a Risk Profile Card summary for Mrs. Dlamini.',
    'What single risk object represents the greatest potential financial loss? Defend your answer.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk Profile Card Template',description:'One-page template for building and maintaining client risk profiles'},
    {url:'#',type:'doc',title:'8-Dimension Assessment Guide',description:'Detailed questions and prompts for each dimension of the risk profile'}
  ])
);

C5[5] = L(
  hContent('Interpreting the CoverScore Assessment',[
    'Understand that the CoverScore is the beginning of analysis, not the end',
    'Read a client\'s Risk Fingerprint to identify patterns and priorities',
    'Distinguish between high-risk scores and high-priority risks',
    'Evaluate assessment confidence and determine when more data is needed'
  ],[
    SE('The Score Is Not the Story','A CoverScore of 42 tells you the client has significant exposure. It does not tell you what to do about it. The score is a starting point, not a conclusion. Two clients can both have a score of 42 but need completely different recommendations. One might have excellent life cover but no business protection. Another might have good asset insurance but critically underinsure their income. The score points to the problem. Your analysis identifies the solution.'),
    SE('Reading the Risk Fingerprint','The Risk Fingerprint is the pattern of scores across the 8 risk dimensions. A client might score 85 on personal coverage but 25 on business continuity. The fingerprint reveals where the client is strong and where they are vulnerable. Look for clusters of low scores — they indicate systemic risk. Look for a single dimension dragging the total down — that is your priority. Look for score divergence between related dimensions, which may indicate misaligned protection.'),
    T('High Risk vs High Priority',['Concept','Definition','Example'],[
      ['High Risk Score','Low coverage in a dimension','Business continuity score of 20'],
      ['High Priority Risk','Dimension with greatest potential financial impact','Business continuity affects 85 employees and NGN 350M revenue']
    ]),
    SE('Assessment Confidence','Not all assessments are equally reliable. High confidence means you had complete data and clear answers. Medium confidence means some data was estimated or unclear. Low confidence means significant information gaps exist. Always communicate confidence levels to clients and stakeholders. A low-confidence assessment is still useful — it tells you where you need more information. Never present a low-confidence assessment as definitive.'),
    T('The 7-Step Interpretation Model',['Step','Action','Output'],[
      ['1','Review the total CoverScore','Baseline context'],
      ['2','Analyse the Risk Fingerprint','Pattern identification'],
      ['3','Identify critical gaps','Risk priority list'],
      ['4','Assess confidence levels','Quality rating'],
      ['5','Cross-reference with client context','Contextual validation'],
      ['6','Formulate preliminary recommendations','Hypothesis list'],
      ['7','Prepare for the feedback conversation','Discussion guide']
    ]),
    C('The CoverScore tells you what. Your judgment tells you why, what it means, and what to do about it. Never outsource your thinking to the score.')
  ],[
    'The CoverScore is the beginning of analysis — two clients with the same score can need very different solutions',
    'The Risk Fingerprint reveals patterns, clusters, and divergence across the 8 dimensions',
    'High risk score measures coverage level; high priority measures potential financial impact',
    'Assessment confidence levels must be communicated honestly — never present low-confidence data as definitive'
  ]),
  hQuiz([
    Q('What does a CoverScore of 42 tell you?',['Exactly which products to recommend','That the client has significant exposure — but not what to do about it','That the client is adequately covered','That the client has no protection gaps'],1,'The score points to the problem; your analysis identifies the solution.'),
    Q('What is a Risk Fingerprint?',['The client\'s biometric data','The pattern of scores across the 8 risk dimensions','The client\'s claims history','The advisor\'s assessment methodology'],1,'The Risk Fingerprint is the dimensional score pattern revealing strengths and vulnerabilities.'),
    Q('When should you present a low-confidence assessment as definitive?',['When the client asks for a number','When you need to close the sale','Never — always communicate confidence levels honestly','When the score is very low'],2,'Low-confidence assessments should never be presented as definitive.'),
    Q('What does a cluster of low scores across multiple dimensions indicate?',['A data entry error','Systemic risk — multiple interrelated vulnerabilities','Strong protection in those areas','The client has no insurance at all'],1,'Clusters of low scores indicate systemic risk that may require comprehensive solutions.'),
    Q('In the 7-Step Interpretation Model, what happens at Step 6?',['Review total CoverScore','Formulate preliminary recommendations as hypotheses','Present to the client','Calculate confidence levels'],1,'Step 6 formulates preliminary recommendations as hypotheses to validate with the client.')
  ]),
  hScript('Interpreting the CoverScore Assessment',[
    'You have completed the discovery conversation. You have identified risk objects. You have built the risk profile. Now the CoverScore engine produces a number — the client\'s overall risk score. Your job now is to interpret what that number means. And here is the most important thing to understand: the score is not the story. It is the beginning of the story.',
    'A CoverScore of 42 tells you the client has significant exposure. But it does not tell you what to do. Two clients with a score of 42 might need completely different recommendations. One might have good life cover but no business protection. Another might have strong asset insurance but critically underinsure their income. The score points to the problem. Your analysis identifies the solution.',
    'Read the Risk Fingerprint — the pattern of scores across all 8 dimensions. Look for clusters of low scores that indicate systemic risk. Look for a single dimension dragging the total down — that is your priority. Look for divergence between related dimensions that may indicate misaligned protection. The fingerprint tells you the story that the total score cannot.',
    'Distinguish between high-risk scores and high-priority risks. A business continuity score of 20 is a high-risk score. But it becomes high priority only when you understand that the business employs 85 people and generates NGN 350 million in revenue. The score measures coverage. The priority measures impact. Your job is to connect the two.',
    'Finally, assess your confidence. High confidence means complete data and clear answers. Medium means some data was estimated. Low means significant gaps. Always communicate confidence honestly. Never present a low-confidence assessment as definitive. It is still useful — it tells you where you need more information. The CoverScore tells you what. Your judgment tells you why, what it means, and what to do.'
  ]),
  hWorkbook([
    {t:'Interpret Three Risk Fingerprints',i:'Review the following three client Risk Fingerprints and interpret each one.',p:['Client A: Personal 85, Financial 70, Asset 90, Liability 80, Business 25, Health 75, Coverage 60, Future 55 — what patterns do you see?','Client B: Personal 40, Financial 35, Asset 30, Liability 25, Business 20, Health 30, Coverage 15, Future 20 — what is the priority?','Client C: Personal 90, Financial 85, Asset 95, Liability 90, Business 85, Health 90, Coverage 85, Future 80 — is this client truly low risk? What questions would you ask?','For each, identify the priority dimension and your preliminary recommendation hypothesis']},
    {t:'Confidence Assessment Practice',i:'Review a real or hypothetical assessment and rate your confidence.',p:['List every piece of data in the assessment','For each, mark whether it is: verified, estimated, or unknown','Calculate your overall confidence level','Write a paragraph explaining your confidence to the client','Identify the top 3 pieces of missing data you need to improve confidence']}
  ]),
  hCase('The Contradictory Profile','Mr. Uche is a 38-year-old tech entrepreneur with a CoverScore of 58. His dimensional scores are: Personal 90, Financial 75, Asset 85, Liability 70, Business 30, Health 80, Coverage 65, Future 50. He has excellent personal life cover (NGN 80 million) and good health insurance. His business — a fintech startup with 25 employees and NGN 200 million in revenue — has no key-person cover, no business interruption insurance, no cyber protection, and no buy-sell agreement with his two co-founders. He has a NGN 50 million venture debt facility personally guaranteed. He dismisses business protection as "something we will get to when we are bigger."',[
    'Interpret Mr. Uche\'s Risk Fingerprint. What patterns do you see? What story does it tell?',
    'Why does a relatively high total CoverScore of 58 still leave him dangerously exposed?',
    'What is the highest priority risk — and why is it high priority but not reflected as a high-risk score?',
    'Rate your assessment confidence. What information gaps exist?',
    'Using the 7-Step Interpretation Model, prepare your preliminary recommendations as hypotheses.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk Fingerprint Reading Guide',description:'Quick reference for identifying patterns and priorities in dimensional scores'},
    {url:'#',type:'doc',title:'Assessment Confidence Calculator',description:'Template for evaluating and communicating assessment confidence levels'}
  ])
);

C5[6] = L(
  hContent('From Risk Score to Protection Strategy',[
    'Translate identified risks into actionable protection strategies using the 5 risk treatments',
    'Apply the Risk-to-Protection Chain framework to build coherent recommendations',
    'Design a 3-Tier Protection Roadmap that prioritises actions by urgency and impact',
    'Develop a Minimum Viable Protection Strategy for clients with budget constraints'
  ],[
    T('The 5 Risk Treatments',['Treatment','What It Means','When to Use'],[
      ['Avoid','Eliminate the risk entirely','When the risk is unacceptable and preventable'],
      ['Reduce','Mitigate through controls and prevention','When risk can be managed but not eliminated'],
      ['Transfer','Shift risk to an insurer via a policy','When financial impact would be catastrophic'],
      ['Accept','Retain the risk knowingly','When cost of treatment exceeds potential loss'],
      ['Reserve','Set aside funds for potential loss','When insurance is unavailable or uneconomical']
    ]),
    SE('The Risk-to-Protection Chain','Each risk identified should be traceable to a protection recommendation. The chain is: Risk Event leads to Risk Object leads to Financial Impact leads to Protection Strategy leads to Specific Recommendation. Example: Critical illness event leads to Business Owner (risk object) leads to Loss of revenue and loan default (financial impact) leads to Income protection and key-person cover (protection strategy) leads to Specific policy recommendation with sum assured and premium.'),
    T('The 3-Tier Protection Roadmap',['Tier','Timeframe','Focus'],[
      ['Tier 1 — Foundation','0-3 months','Critical gaps that could cause immediate financial catastrophe'],
      ['Tier 2 — Strengthening','3-12 months','Important gaps that need structured solutions'],
      ['Tier 3 — Optimisation','12-24 months','Fine-tuning, efficiency, and advanced strategies']
    ]),
    SE('Minimum Viable Protection Strategy','Not every client can afford complete protection immediately. The MVP Strategy asks: "What is the smallest set of protections that prevents financial catastrophe?" Focus on: catastrophic risks first (death, disability, critical illness of primary earner), then liability risks (loans, guarantees, dependents), then asset risks, then everything else. A partial strategy implemented today is better than a perfect strategy implemented never.'),
    C('Perfect protection is the enemy of good protection. A partial plan implemented today protects the client better than a complete plan that never gets implemented because it felt too expensive.')
  ],[
    'The 5 risk treatments: Avoid, Reduce, Transfer, Reserve, Accept — each suited to different situations',
    'The Risk-to-Protection Chain traces each risk to a specific, actionable recommendation',
    'The 3-Tier Protection Roadmap sequences actions by urgency: Foundation, Strengthening, Optimisation',
    'The Minimum Viable Protection Strategy focuses on preventing financial catastrophe first'
  ]),
  hQuiz([
    Q('Which risk treatment is most relevant when financial impact would be catastrophic?',['Avoid','Reduce','Transfer','Accept'],2,'Transfer via insurance is the primary mechanism when financial impact is catastrophic.'),
    Q('What is the Risk-to-Protection Chain?',['A list of products to sell','A traceable path from risk event to specific recommendation','A regulatory filing requirement','A claims process'],1,'Each risk should be traceable through the chain to a specific protection recommendation.'),
    Q('What is the timeframe for Tier 2 (Strengthening) in the Protection Roadmap?',['0-3 months','3-12 months','12-24 months','24+ months'],1,'Tier 2 covers important gaps that need structured solutions within 3-12 months.'),
    Q('What is the purpose of the Minimum Viable Protection Strategy?',['To sell as many products as possible','To identify the smallest set of protections preventing financial catastrophe','To reduce the advisor\'s workload','To delay all recommendations'],1,'MVP Strategy focuses on what prevents catastrophe when the client cannot do everything at once.'),
    Q('When should the Accept treatment be used?',['Never — it is irresponsible','When the cost of treatment exceeds the potential loss','Only for very wealthy clients','When insurance is mandatory'],1,'Risk acceptance is appropriate when treating the risk costs more than the potential loss.')
  ]),
  hScript('From Risk Score to Protection Strategy',[
    'You have interpreted the CoverScore. You understand the client\'s risk profile. Now comes the moment of translation: turning risk into action. This is where your advisory value is truly demonstrated. A client does not need a score — they need a strategy. They do not need data — they need decisions. Your job is to convert analysis into a clear, actionable protection plan.',
    'There are 5 risk treatments available. Avoid: eliminate the risk entirely. Reduce: mitigate through controls. Transfer: shift risk to an insurer via a policy. Accept: retain the risk knowingly. Reserve: set aside funds. Most of your work will involve Transfer — insurance — but an advisor who only recommends insurance is not advising; they are selling. Sometimes the best recommendation is not a policy.',
    'The Risk-to-Protection Chain ensures every recommendation is traceable back to a specific risk. Risk event leads to Risk Object leads to Financial Impact leads to Protection Strategy leads to Specific Recommendation. If you cannot trace a recommendation back through this chain, your recommendation is not grounded in the client\'s actual exposure.',
    'The 3-Tier Protection Roadmap helps clients implement protection in the right order. Tier 1 — Foundation — covers critical gaps that could cause immediate financial catastrophe. Address these in the first 3 months. Tier 2 — Strengthening — covers important gaps with structured solutions over 3 to 12 months. Tier 3 — Optimisation — covers fine-tuning and advanced strategies over 12 to 24 months.',
    'Finally, the Minimum Viable Protection Strategy. Not every client can afford everything at once. Ask: "What is the smallest set of protections that prevents financial catastrophe?" Focus on catastrophic risks first, then liability, then assets. A partial plan implemented today is better than a perfect plan that never gets implemented because it seemed too expensive. Perfect protection is the enemy of good protection.'
  ]),
  hWorkbook([
    {t:'Build a Protection Roadmap',i:'Take the risk profile you built in Lesson 4 and design a complete protection strategy.',p:['List every identified risk','Apply the Risk-to-Protection Chain to each risk','Assign each recommendation to a treatment type','Organise recommendations into the 3-Tier Roadmap','Define the MVP Strategy — what is the minimum set of protections needed?']},
    {t:'Budget Constraint Challenge',i:'Your client has a limited budget and can only afford 40 percent of your recommendations. Decide what to prioritise.',p:['List all recommendations with estimated costs','Rank them by potential financial impact if unaddressed','Select the set that fits within 40 percent of total cost','Explain why you chose each recommendation','Identify what risks remain unaddressed and how to communicate this to the client']}
  ]),
  hCase('The Budget-Constrained Family','The Osei family: Samuel (41) and Grace (39), married with three children ages 9, 7, and 4. Samuel earns NGN 15 million annually as a civil engineer. Grace earns NGN 6 million as a school administrator. They have a NGN 40 million mortgage and NGN 5 million in car loans. Their current cover: Samuel has NGN 8 million life cover through his employer; Grace has no cover. They have no disability cover, no critical illness cover, no income protection, and minimal savings (3 months\' expenses). Their total available budget for insurance is NGN 500,000 per year. A comprehensive protection plan would cost approximately NGN 1.2 million per year.',[
    'Build the Risk-to-Protection Chain for each major risk the Osei family faces.',
    'Design the full 3-Tier Protection Roadmap (unconstrained budget).',
    'Now apply the budget constraint: what is the Minimum Viable Protection Strategy for NGN 500,000 per year?',
    'What risks remain unaddressed under the MVP Strategy? How do you communicate this to the family?',
    'Create a timeline for when they could add more protection as their income grows.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk Treatment Decision Guide',description:'Flowchart for selecting the appropriate risk treatment for each exposure'},
    {url:'#',type:'doc',title:'Protection Roadmap Template',description:'3-Tier Roadmap template for sequencing client recommendations'}
  ])
);

C5[7] = L(
  hContent('Presenting the CoverScore Risk Report',[
    'Structure a risk report presentation that tells a compelling story from opening to commitment',
    'Apply the "So What?" principle to ensure every data point has meaning for the client',
    'Use the Top Three Rule to avoid overwhelming clients with information',
    'Handle client objections, disagreements, and emotional reactions professionally'
  ],[
    T('The 10-Stage Presentation Journey',['Stage','Content','Duration'],[
      ['1 — Context','Why we are here and what we discussed','2 min'],
      ['2 — The Score','The CoverScore and what it means','3 min'],
      ['3 — The Story','Risk Fingerprint walkthrough','5 min'],
      ['4 — Key Findings','Top 3 risks identified','5 min'],
      ['5 — Recommendations','Protection strategies for each risk','8 min'],
      ['6 — Cost of Nothing','What happens if nothing changes','3 min'],
      ['7 — Roadmap','3-Tier implementation timeline','3 min'],
      ['8 — Investment','Premium estimates and budget','3 min'],
      ['9 — Questions','Open discussion','5 min'],
      ['10 — Next Steps','Commitment and action plan','3 min']
    ]),
    SE('The "So What?" Principle','Every data point you present must pass the "So What?" test. "Your CoverScore is 42" — so what? It means you have significant exposure that could threaten your family\'s financial future. "Your business continuity score is 25" — so what? It means if you are unable to work, your business could fail within 3 months. Translate every number into a real-world consequence that matters to the client. If a data point does not pass the So What test, leave it out.'),
    SE('The Top Three Rule','Clients can absorb at most three key messages in a single presentation. Identify the three most important things the client needs to understand and act on. Build your entire presentation around these three messages. Everything else supports or expands on the top three. If everything is important, nothing is important. Disciplined focus makes your message memorable and actionable.'),
    T('Handling Objections and Disagreements',['Objection Type','Response Strategy','Example'],[
      ['Disbelief','Acknowledge, explain methodology, offer evidence','"I understand your surprise. Let me show you how we calculated this."'],
      ['Defensiveness','Normalise, depersonalise, focus on solutions','"This is very common for businesses at your stage."'],
      ['Dismissal','Respectful challenge, cost of nothing','"I respect your view. May I show you what the data suggests would happen if nothing changes?"'],
      ['Emotion','Validate, pause, offer space','"I can see this is concerning. Would you like a moment?"'],
      ['Stalling','Clarify, create urgency, offer next step','"What specifically would you like more time to consider?"']
    ]),
    C('A report that sits in a drawer is worthless. A presentation that produces action is invaluable. Your goal is not to inform — it is to move the client to protect what matters.')
  ],[
    'The 10-Stage Presentation Journey structures the report from context through to commitment',
    'The "So What?" principle ensures every data point connects to a real-world client consequence',
    'The Top Three Rule focuses the presentation on what is most important and actionable',
    'Common client reactions include disbelief, defensiveness, dismissal, emotion, and stalling — each requires a specific response'
  ]),
  hQuiz([
    Q('What is the "So What?" principle?',['Asking "so what?" when the client disagrees','Ensuring every data point has a real-world meaning for the client','Asking the client "so what?" about their concerns','Ignoring data that does not seem important'],1,'Every piece of data must translate into a client-relevant consequence.'),
    Q('According to the Top Three Rule, how many key messages should a presentation focus on?',['One','Three','Five','As many as needed'],1,'Clients can absorb at most three key messages. Focus your presentation around the top three.'),
    Q('What is the recommended response to a client who dismisses your findings?',['Accept their dismissal and move on','Respectfully challenge and present the cost of nothing','Argue more forcefully','Lower your recommendations'],1,'When a client dismisses findings, respectfully challenge and show what the cost of inaction would be.'),
    Q('In the 10-Stage Presentation, what happens at Stage 6 (Cost of Nothing)?',['Present premium costs','Explain what happens if the client takes no action','Discuss alternative strategies','Close the sale'],1,'Stage 6 presents the cost of doing nothing — the most powerful motivator for action.'),
    Q('What is the goal of a risk report presentation?',['To inform the client about their score','To move the client to take protective action','To demonstrate the advisor\'s expertise','To complete regulatory requirements'],1,'A report that sits in a drawer is worthless. The goal is action.')
  ]),
  hScript('Presenting the CoverScore Risk Report',[
    'You have done the work. You have prepared, discovered, mapped risk objects, built the profile, interpreted the assessment, and designed the protection strategy. Now comes the moment that determines whether all of that work translates into client action: the presentation. A brilliant strategy that the client does not understand or act on is worthless. Presentation is not the end of advisory — it is the most critical part.',
    'The 10-Stage Presentation Journey gives you a proven structure. Start with context: remind them why you are here and recap what you discussed. Present the score and what it means — use the So What principle. Walk through the Risk Fingerprint story. Then share the Top Three findings. Everything you present should build toward one thing: action.',
    'The So What principle is simple. Every data point must pass the test: so what does this mean for the client? Your CoverScore is 42 — so what? It means your family\'s financial future is at significant risk. Your business continuity score is 25 — so what? It means if you cannot work, your business could fail within 3 months. Translate every number into a real-world consequence.',
    'The Top Three Rule keeps you focused. Clients can absorb at most three key messages. Identify the three most important things they need to understand and act on. Build the entire presentation around these three. If everything is important, nothing is important. Disciplined focus makes your message memorable.',
    'Finally, be ready for reactions. Disbelief — acknowledge and explain your methodology. Defensiveness — normalise their situation. Dismissal — respectfully challenge with the cost of nothing. Emotion — validate and give space. Stalling — clarify what they need. Your goal is not to inform — it is to move them to protect what matters. A report that sits in a drawer is worthless. A presentation that produces action is invaluable.'
  ]),
  hWorkbook([
    {t:'Design a Report Presentation',i:'Take a client case and design a complete 10-stage report presentation.',p:['Outline each of the 10 stages with specific content','For each data point, write the "So What?" translation','Identify the Top Three messages','Write your opening statement for Stage 1','Write your closing ask for Stage 10']},
    {t:'Objection Handling Practice',i:'For each objection type, prepare your response.',p:['Disbelief: "I do not believe my score is that low" — write your response','Defensiveness: "I have always managed fine without insurance" — write your response','Dismissal: "Insurance is a waste of money" — write your response','Emotion: Client becomes visibly upset about their exposure — write your response','Stalling: "I need to think about it" without specifics — write your response']}
  ]),
  hCase('The Sceptic董事会','You are presenting to the board of a manufacturing company with 200 employees and NGN 800 million annual revenue. Their CoverScore is 35. The CEO is sceptical about insurance. The CFO is concerned about costs. The Operations Director believes their current cover is adequate. The Company Secretary is the one who invited you and supports your recommendations. You have 40 minutes for the presentation. The board will make a decision at the end.',[
    'How do you open the presentation given the mixed audience of sceptics and supporters? Write your opening words.',
    'Identify the Top Three messages for this board. What must they understand and act on?',
    'For each sceptical board member, prepare your response to their expected objection.',
    'What is the "Cost of Nothing" for this company? Present it compellingly.',
    'What is your ask at Stage 10? What specific commitment do you want from the board?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Presentation Journey Checklist',description:'10-stage checklist for structuring risk report presentations'},
    {url:'#',type:'doc',title:'Objection Response Matrix',description:'Quick reference for handling 15 common client objections and responses'}
  ])
);

C5[8] = L(
  hContent('Practical Risk Advisory Simulation and Module Assessment',[
    'Apply all 12 stages of the Advisory Mastery Model to a complex client case',
    'Synthesise discovery data into a complete risk profile and CoverScore interpretation',
    'Design and present a comprehensive protection strategy with implementation roadmap',
    'Demonstrate professional judgment in handling sensitive client dynamics and objections'
  ],[
    SE('The Advisory Mastery Model — 12 Stages','This capstone simulation tests your ability to execute the complete advisory process end-to-end. The 12 stages are: 1 — Pre-Engagement Preparation, 2 — Discovery Conversation, 3 — Risk Object Identification, 4 — Risk Profile Building, 5 — CoverScore Assessment, 6 — Score Interpretation, 7 — Strategy Design, 8 — Recommendation Development, 9 — Report Presentation, 10 — Objection Handling, 11 — Implementation Planning, 12 — Ongoing Relationship Management. You must demonstrate competence across all 12.'),
    SE('GreenField Agro-Processing Ltd — Case Overview','GreenField Agro-Processing Ltd is a mid-sized agricultural processing company based in Kaduna, Nigeria. Founded 15 years ago by Mr. Chidi Okonkwo (54), the company processes cassava, maize, and soya into industrial starches, animal feed, and edible oils. They employ 180 permanent staff and 250 seasonal workers. Annual revenue: NGN 1.2 billion. They have a NGN 350 million bank loan for a new processing facility, personally guaranteed by Mr. Okonkwo. Their CoverScore is 54. Critical gaps include: no key-person cover on Mr. Okonkwo, no business interruption insurance, no succession plan, inadequate fire protection for the main processing facility, and no cyber protection despite increasing digitalisation of supply chain and payments.'),
    T('GreenField CoverScore — 8 Dimensions',['Dimension','Score','Assessment'],[
      ['Personal','65','Mr. Okonkwo has NGN 30M personal life cover — inadequate for his NGN 200M estate value'],
      ['Financial','60','Good cash flow but no income protection if Mr. Okonkwo is incapacitated'],
      ['Asset','45','Processing facility underinsured; fire risk not fully covered; equipment values outdated'],
      ['Liability','40','NGN 350M loan personally guaranteed; no loan protection insurance'],
      ['Business','25','No key-person cover; no succession plan; no business continuity planning'],
      ['Health','70','Mr. Okonkwo has controlled hypertension but no critical illness cover'],
      ['Coverage','35','Policies are not reviewed; beneficiaries outdated; gaps in every line'],
      ['Future','30','No exit plan; children not involved; retirement unfunded; estate plan missing']
    ]),
    SE('Assessment Rubric','Your performance will be evaluated across 9 criteria: (1) Preparation quality, (2) Discovery depth, (3) Risk object identification, (4) Risk profile completeness, (5) Score interpretation accuracy, (6) Strategy coherence, (7) Presentation effectiveness, (8) Objection handling, (9) Implementation planning. Each criterion scored 1-5, total 45 points. Pass mark: 32/45 (71 percent).'),
    C('This simulation is the closest thing to a real advisory engagement you will experience in this certification. Treat it as real. Make real decisions. Face real trade-offs. And demonstrate that you can think, act, and advise like a professional risk advisor.')
  ],[
    'The Advisory Mastery Model has 12 stages covering the complete advisory process from preparation to ongoing management',
    'GreenField Agro-Processing Ltd has a CoverScore of 54 with critical gaps across business, liability, coverage, and future dimensions',
    'The assessment rubric evaluates 9 criteria scored 1-5 each, requiring 32/45 to pass',
    'This simulation tests your ability to synthesise everything learned across CCA 101 through 105'
  ]),
  hQuiz([
    Q('What is GreenField Agro-Processing Ltd\'s overall CoverScore?',[42,54,58,65],1,'GreenField has a CoverScore of 54 with critical gaps in Business (25) and Coverage (35) dimensions.'),
    Q('Which dimension has the lowest score for GreenField?',['Personal','Business','Asset','Health'],1,'Business dimension scores 25 — the lowest — due to no key-person cover, no succession plan, and no business continuity planning.'),
    Q('What is the most critical single risk object for GreenField?',['The processing facility','Mr. Chidi Okonkwo (founder)','The bank loan','The seasonal workers'],1,'Mr. Okonkwo is the critical risk object — his incapacitation would cascade through every dimension of the business.'),
    Q('How many criteria are evaluated in the assessment rubric?',[5,7,9,12],2,'Nine criteria are evaluated, each scored 1-5, for a total of 45 points with a pass mark of 32.'),
    Q('What is the pass mark for this assessment?',['25/45 (56%)','32/45 (71%)','36/45 (80%)','40/45 (89%)'],1,'The pass mark is 32 out of 45, or 71 percent.')
  ]),
  hScript('Practical Risk Advisory Simulation and Module Assessment',[
    'Welcome to the capstone of CCA 105 — the Practical Risk Advisory Simulation and Module Assessment. This is where everything you have learned across CCA 101 through 105 comes together. This is not a test of memory. It is a test of judgment. You will work through a complete, real-world client case from preparation through to implementation planning.',
    'The case is GreenField Agro-Processing Ltd, a mid-sized agricultural processing company in Kaduna, Nigeria. Founded 15 years ago by Mr. Chidi Okonkwo. It employs 180 permanent staff and 250 seasonal workers. Annual revenue is NGN 1.2 billion. They have a CoverScore of 54. They have critical gaps in every dimension of their risk profile. Your job is to guide them from risk identification to protection.',
    'You will be evaluated across the 12 stages of the Advisory Mastery Model. Stage 1: prepare for the engagement. Stage 2: conduct discovery. Stage 3: identify risk objects. Stage 4: build the risk profile. Stage 5: complete the CoverScore assessment. Stage 6: interpret the score. Stage 7: design the strategy. Stage 8: develop recommendations. Stage 9: present the report. Stage 10: handle objections. Stage 11: plan implementation. Stage 12: establish ongoing relationship management.',
    'The assessment rubric has 9 criteria: preparation quality, discovery depth, risk object identification, risk profile completeness, score interpretation accuracy, strategy coherence, presentation effectiveness, objection handling, and implementation planning. Each scored 1 to 5. Pass mark is 32 out of 45. This is a rigorous standard, and you should approach this with the seriousness it deserves.',
    'GreenField\'s most critical gap is clear: Mr. Okonkwo himself. With no key-person cover, personally guaranteed loans, no succession plan, and no business continuity planning, his incapacitation would cascade through every dimension — the business, the family, the employees, the bank. Your strategy must address this first, then layer in the other protections. This is the essence of advisory: identify what matters most and act on it. You have the tools, the frameworks, and the methodology. Now apply them. Good luck.'
  ]),
  hWorkbook([
    {t:'Preparation Phase',i:'Complete your pre-engagement preparation for GreenField Agro-Processing Ltd.',p:['Review the case overview and identify key facts','Research the agro-processing industry in Nigeria — what are the top 3 risks?','Formulate 5 risk hypotheses about GreenField','Define your engagement objectives for the first meeting','Prepare your discovery question map']},
    {t:'Full Advisory Process Simulation',i:'Work through the complete 12-stage Advisory Mastery Model for GreenField.',p:['Complete Stages 1-4: Prepare, Discover, Identify Objects, Build Profile','Complete Stages 5-6: Conduct and Interpret the CoverScore','Complete Stages 7-8: Design Strategy and Develop Recommendations','Complete Stage 9: Prepare your report presentation','Complete Stages 10-12: Handle objections, plan implementation, set up ongoing management']}
  ]),
  hCase('GreenField Agro-Processing Ltd — Capstone Simulation','GreenField Agro-Processing Ltd has a CoverScore of 54 with critical gaps across Personal, Financial, Asset, Liability, Business, Health, Coverage, and Future dimensions. Mr. Chidi Okonkwo (54), the founder, personally guarantees a NGN 350 million loan. There is no key-person cover, no succession plan, no business interruption insurance, inadequate asset protection, and no cyber security. Employees: 180 permanent and 250 seasonal. Annual revenue: NGN 1.2 billion. This simulation tests your ability to synthesise everything from CCA 101 through 105 into a coherent advisory engagement.',[
    'Build a complete risk profile for GreenField across all 8 dimensions. Include facts, assumptions, and information gaps.',
    'Interpret GreenField\'s Risk Fingerprint. Identify patterns, clusters, and the single most critical risk.',
    'Design a comprehensive 3-Tier Protection Roadmap. What goes in each tier and why?',
    'Present the Minimum Viable Protection Strategy assuming Mr. Okonkwo is initially reluctant about the total investment.',
    'Prepare for the board presentation. The CEO is sceptical, the CFO is cost-conscious. Write your opening, your Top Three, and your response to their likely objections.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'GreenField Case Study Brief',description:'Complete case study details including financials, risk data, and key personnel information'},
    {url:'#',type:'doc',title:'Advisory Mastery Model Checklist',description:'12-stage checklist to guide your complete advisory process from preparation to ongoing management'},
    {url:'#',type:'doc',title:'Assessment Rubric & Scorecard',description:'9-criteria rubric for self-assessment and evaluation of your capstone performance'}
  ])
);

// ═══════════════════════════════════════════════════════════════════
// COURSE 6: CCA 106 — Risk Advisory Practice, Business Development & Client Growth (8 lessons)
// ═══════════════════════════════════════════════════════════════════

const C6 = {};

C6[1] = L(
  hContent('The CoverScore Advisor\'s Ideal Client',[
    'Define the CoverScore Ideal Client Profile',
    'Distinguish between a product prospect and a risk advisory prospect',
    'Identify characteristics of a high-value CoverScore prospect',
    'Identify risk-rich environments and trigger events'
  ],[
    SE('The Ideal Client Principle','The best client is not necessarily the client who wants insurance. The best client is the client whose risks deserve better understanding and better protection. The CoverScore advisor therefore looks beyond the immediate insurance transaction. A prospect may already have insurance and still have significant protection gaps.'),
    T('The 7 Characteristics of an Ideal Client',['Characteristic','What It Means'],[
      ['Risk Exposure','Meaningful assets, people, operations, or financial interests'],
      ['Risk Complexity','Multiple interconnected risks requiring structured assessment'],
      ['Change','Environment is changing — expansion, new assets, new contracts'],
      ['Protection Gaps','Current insurance may not match current exposure'],
      ['Decision Authority','Access to someone who can influence risk decisions'],
      ['Capacity to Act','Organisational or individual ability to implement improvements'],
      ['Willingness to Improve','Openness to understanding risks and improving protection']
    ]),
    SE('Risk-Rich Environments','A risk-rich environment is where multiple meaningful risk exposures exist. The greater the number and complexity of risk objects, the greater the potential value of a structured CoverScore assessment. Consider a growing manufacturing company with employees, machinery, buildings, inventory, vehicles, suppliers, digital systems, and contractual obligations — compared to a simple sole proprietor with one vehicle.'),
    T('High-Value Prospect Segments',['Segment','Why Attractive','CoverScore Funnel'],[
      ['SMEs','Rapid growth, informal risk management, underinsurance','SME Risk Assessment'],
      ['Manufacturing','Complex property, machinery, supply chain, BI risks','Manufacturing Risk Assessment'],
      ['Healthcare','Professional liability, equipment, cyber, patient risks','Hospital Risk Assessment'],
      ['Churches','Buildings, congregations, events, volunteers, vehicles','Church Risk Assessment'],
      ['Schools','Students, staff, buildings, transport, liability','School Risk Assessment']
    ]),
    SE('Change Creates Risk','One of the most powerful prospecting concepts: when something changes, the risk profile may change. Business expansion, new facilities, new employees, digital transformation, new vehicles, new contracts — each creates new or increased exposures. The advisor should ask: "Has the client\'s protection kept pace with the change?"'),
    SE('The Trigger Event Model','A trigger event is something that should cause an advisor to ask: "Has this change created new or increased risks?" Examples: business expansion, new branch, new factory, new equipment, new fleet, new employees, major contract, merger, digital transformation, regulatory change, major loss, rapid revenue growth.'),
    C('Don\'t ask "Who can I sell insurance to?" Ask "Who has meaningful risks that I can help them understand, prioritise, and manage?"')
  ],[
    'The ideal CoverScore client has meaningful risk exposure, complexity, change, protection gaps, decision authority, capacity, and willingness',
    'Product prospects know what they want; risk advisory prospects need structured assessment',
    'Risk-rich environments with multiple exposures create the strongest advisory opportunities',
    'Change creates risk — every significant change is a potential prospecting opportunity'
  ]),
  hQuiz([
    Q('What is the fundamental difference between a traditional insurance prospect and a CoverScore prospect?',['The CoverScore prospect has more money','The CoverScore prospect has meaningful risks that may require structured assessment','The CoverScore prospect must have no insurance','The CoverScore prospect must own a large company'],1,'A CoverScore prospect is defined by risk complexity and protection gaps, not by income or policy intent.'),
    Q('Which is NOT one of the seven characteristics of an ideal CoverScore client?',['Risk exposure','Risk complexity','Willingness to improve','Guaranteed willingness to buy a specific policy'],3,'The ideal client is defined by risk characteristics, not by guaranteed purchase intent.'),
    Q('What does the principle "Change creates risk" mean?',['Every change is negative','Changes may create new or increased exposures','Clients should avoid change','Insurance eliminates change'],1,'When a client\'s environment changes, their risk profile changes too — creating opportunities for advisory.'),
    Q('Which is an example of a trigger event?',['A business maintaining same operations for ten years','A company opening a new branch','An individual watching television','A client renewing the same policy without changes'],1,'Opening a new branch is a trigger event that changes the risk profile.'),
    Q('Why is a growing manufacturing company often a strong CoverScore prospect?',['It automatically needs every insurance product','It may have multiple interconnected risk exposures','It must buy insurance','It has no risk management'],1,'Manufacturing companies typically have complex, interconnected exposures across property, machinery, people, liability, supply chain, and cyber.'),
    Q('What question should the advisor ask when a client\'s business has changed significantly?',['Would you like to buy insurance?','How has your risk and protection programme changed with the business?','Can I have your premium?','Which insurer do you currently use?'],1,'The CoverScore advisor asks about risk and protection changes, not about buying insurance.'),
    Q('What is the purpose of prospect prioritisation?',['To ignore all low-income clients','To focus advisor time where meaningful value can be created','To sell the most expensive products','To avoid prospecting'],1,'Prioritisation ensures the advisor focuses energy where the greatest value can be created.'),
    Q('Which prospect is most likely to be a Priority Prospect?',['High risk complexity, recent trigger event, accessible decision-maker, willing to engage','Low risk complexity, no trigger event, no access','No risk exposure and no interest','A prospect who refuses all engagement'],0,'Priority prospects combine high risk complexity, recent triggers, decision access, and willingness.'),
    Q('What should the CoverScore advisor look for before approaching a prospect?',['Only the prospect\'s income','Risk exposure, complexity, change, gaps, authority, and willingness','Only the prospect\'s existing insurer','Only the prospect\'s age'],1,'A full set of risk characteristics determines whether the prospect is worth pursuing.'),
    Q('What is the best opening question for a business that has recently expanded?',['Would you like to buy Fire Insurance?','How have you reviewed your risk and protection programme to reflect your expansion?','Can I send you a quotation?','Who is your current insurer?'],1,'The best question starts with risk and change, not with a product.')
  ]),
  hScript('The CoverScore Advisor\'s Ideal Client',[
    'Welcome to Lesson One of CCA 106. In this lesson, we are going to answer one of the most important questions in building a successful risk advisory practice: Who is the ideal CoverScore client? The answer may surprise you. The ideal client is not simply the person who wants to buy insurance. It is the person or organisation whose risks deserve better understanding, better prioritisation, and better protection.',
    'Traditional insurance selling often begins with a product. Motor insurance. Fire insurance. Life insurance. But the CoverScore approach begins somewhere else. We begin with the client. We ask: What do they own? Who depends on them? What could disrupt their operations? What has changed? And does their current protection still match their current risk environment? That is the mindset of a risk advisor.',
    'A strong CoverScore prospect typically has seven characteristics. They have meaningful risk exposure. Their risks may be complex. Something may have changed recently. They may have protection gaps. They have the authority or influence to make decisions. They have the capacity to act. And most importantly, they are willing to improve. The combination of these factors creates a strong opportunity for risk advisory.',
    'We call these environments risk-rich environments. A risk-rich environment is one where multiple meaningful exposures exist. Think about a growing manufacturing company. It may have employees, machinery, buildings, inventory, vehicles, suppliers, customers, digital systems, and contractual obligations. Each represents a potential risk object. The more complex the environment, the greater the value of understanding how those risks connect.',
    'CoverScore can be applied across many industries. SMEs often have significant protection gaps because their businesses grow faster than their risk management systems. Manufacturers face complex property, machinery, operational, supply chain, and business interruption risks. Hospitals face professional, patient, cyber, equipment, and operational risks. Churches and faith organisations manage buildings, people, events, vehicles, and public exposures. Schools face risks involving students, staff, buildings, transportation, and liability.',
    'One of the most powerful principles in CoverScore prospecting is simple: Change creates risk. When a business expands, its risk profile changes. When it hires more employees, its people exposure changes. When it buys new equipment, its asset exposure changes. When it moves into digital systems, its cyber exposure changes. Every significant change creates an opportunity to ask a powerful question: Has the client\'s protection kept pace with the change?',
    'A good advisor should always understand why the prospect should act now. Maybe the business is expanding. Maybe it has acquired new assets. Maybe its policies have not been reviewed for years. Maybe it has recently experienced a loss. The stronger the reason for action now, the more relevant the CoverScore conversation becomes.',
    'Not every prospect deserves the same level of attention. Priority prospects have high risk complexity, a recent trigger event, access to decision-makers, and a willingness to engage. Development prospects may need more education and nurturing. Long-term prospects should remain in your relationship pipeline. Low-priority prospects should receive limited attention. Your goal is not to talk to everyone. Your goal is to focus your energy where you can create the greatest value.',
    'Consider PrimeBuild Engineering. The company has 120 employees, 15 heavy-duty vehicles, two warehouses, and a new contract. It has also hired 30 new employees, acquired five additional vehicles, and opened a new warehouse. This is a strong CoverScore opportunity not because we know exactly which insurance products they need. It is a strong opportunity because their risk environment has changed significantly. The right question is not "Would you like Contractors All Risk insurance?" The better question is: "Your business has grown significantly. How have you reviewed your risk and protection programme to reflect these changes?"',
    'The CoverScore advisor\'s ideal client is not defined by a product. It is defined by an opportunity to create meaningful risk clarity. Look for risk. Look for complexity. Look for change. Look for protection gaps. Look for people who have the authority and willingness to act. And most importantly, look for situations where your advice can genuinely make a difference. Remember: Don\'t ask "Who can I sell insurance to?" Ask: "Who can I help become better protected?"'
  ]),
  hWorkbook([
    {t:'Identify the Ideal Client',i:'Review the following prospects and rank them from highest to lowest CoverScore advisory opportunity.',p:['Prospect A: A 25-year-old salaried employee with one vehicle and basic motor insurance','Prospect B: A manufacturing company with 300 employees, multiple factories, imported machinery, recent expansion','Prospect C: A small church with one rented meeting hall and 20 members','Prospect D: A hospital with 100 employees, digital patient records, expensive equipment, 24-hour operations','Prospect E: An SME that recently moved into a new building, hired 40 employees, and acquired 10 vehicles','Rank them 1-5 and explain your reasoning for each']},
    {t:'Trigger Event Hunt',i:'Look around your local market. Identify three organisations that have recently experienced a trigger event.',p:['What changed? (expansion, new facility, new equipment, new employees)','What risk objects may be affected?','Why might this be a CoverScore opportunity?','Write your risk hypothesis for each']}
  ]),
  hCase('PrimeBuild Engineering Analysis','PrimeBuild Engineering Ltd has 120 employees, 15 heavy-duty vehicles, two warehouses, one central office, multiple construction projects, and a new contract worth NGN 500 million. Existing protection includes Motor Insurance, Fire Insurance, and Group Life. Recent changes include the new contract, 30 new employees, five additional vehicles, and a new warehouse.',[
    'Why is PrimeBuild a strong CoverScore prospect? Identify at least 5 reasons.',
    'What risk objects exist across people, assets, operations, liability, and financial dimensions?',
    'What trigger events have occurred? How has each changed the risk profile?',
    'What protection gaps might exist despite their existing insurance?',
    'Write the opening question you would use to start a conversation with PrimeBuild\'s management.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Ideal Client Profile Reference Card',description:'One-page guide to the 7 characteristics with examples'},
    {url:'#',type:'doc',title:'Trigger Event Identification Worksheet',description:'Template for identifying and analysing trigger events in your market'}
  ])
);

C6[2] = L(
  hContent('Prospecting Through Risk Intelligence',[
    'Define risk intelligence prospecting',
    'Identify risk signals in the real world',
    'Use the Risk Signal to Advisory Opportunity model',
    'Convert risk signals into relevant conversation starters'
  ],[
    SE('The Prospecting Mindset Shift','Traditional prospecting asks: Who do I know? Who can I call? Who needs insurance? Risk intelligence prospecting asks: What has changed? What is growing? What is being built? What new risks may have emerged? This is the difference between selling from a product list and prospecting from the real world.'),
    SE('What Is Risk Intelligence Prospecting?','Risk Intelligence Prospecting is the systematic process of identifying potential clients by observing, researching, and interpreting signals that indicate the presence of new, increased, or inadequately managed risks. The process is: Observe, Research, Interpret, Identify Risk Signals, Identify Potential Risk Objects, Identify Decision-Maker, Engage, Assess.'),
    T('Traditional vs Risk Intelligence Prospecting',['Traditional','Risk Intelligence'],[
      ['Starts with a product','Starts with a risk signal'],
      ['Focuses on volume','Focuses on relevance'],
      ['Asks who can buy','Asks who may need help'],
      ['Uses generic messages','Uses researched conversations'],
      ['Sells before understanding','Understands before recommending']
    ]),
    SE('The Risk Signal','A Risk Signal is an observable piece of information that suggests a prospect\'s risk environment may have changed. Examples: a company opens a new branch, a factory acquires new machinery, a hospital launches a digital platform, a church constructs a new auditorium, an SME moves into a larger facility, a business hires significantly more employees.'),
    T('Risk Signal Categories',['Category','Examples'],[
      ['Growth Signals','Revenue growth, new branches, new employees, new markets'],
      ['Asset Signals','New buildings, new machinery, new vehicles, new technology'],
      ['Operational Signals','New production line, new service, increased capacity'],
      ['People Signals','Major recruitment, new leadership, increased workforce'],
      ['Digital Signals','New website, customer portal, digital payments, cloud adoption'],
      ['Contractual Signals','Major contracts, government projects, international partnerships'],
      ['Incident Signals','Fire, theft, accident, cyber incident, equipment failure'],
      ['Regulatory Signals','New legislation, new compliance requirements, regulatory enforcement']
    ]),
    SE('The Risk Signal to Advisory Opportunity Model','Every risk signal should trigger three questions: (1) What changed? Identify the event. (2) What risk objects may be affected? Identify assets, people, operations, liabilities. (3) What should we investigate? Determine whether a CoverScore assessment may be appropriate. Example: A manufacturing company opens a new production facility. Risk objects include building, machinery, raw materials, employees, visitors, production operations, business income, and third-party liabilities. Advisory opportunity: a comprehensive Manufacturing CoverScore Assessment.'),
    C('Don\'t prospect for policies. Prospect for risk signals. Every meaningful risk signal can become the beginning of a valuable advisory conversation.')
  ],[
    'Risk intelligence prospecting starts with observing change, not with a product list',
    'Risk signals are observable events suggesting the risk environment has changed',
    'The Risk Signal to Advisory Opportunity model connects observed changes to potential assessments',
    'Public sources like company websites, news, and social media provide legitimate risk intelligence'
  ]),
  hQuiz([
    Q('What is Risk Intelligence Prospecting?',['Selling as many policies as possible','Identifying prospects by observing and interpreting risk signals','Calling every person in a database','Waiting for clients to request insurance'],1,'Risk intelligence prospecting uses observable signals to identify potential advisory opportunities.'),
    Q('What is a Risk Signal?',['Proof that a client needs a specific insurance policy','An observable event suggesting the risk environment may have changed','A completed insurance claim','A premium quotation'],1,'A risk signal is an invitation to investigate, not a confirmed protection gap.'),
    Q('Which of the following is a risk signal?',['A company opens a new branch','An advisor drinks coffee','A client reads a newspaper','An employee takes lunch'],0,'A new branch indicates growth and changing risk exposure.'),
    Q('What should an advisor do after identifying a risk signal?',['Immediately sell the most expensive policy','Research and investigate the potential risk implications','Ignore it','Assume the client is uninsured'],1,'The advisor should research and investigate before making any recommendations.'),
    Q('What is the correct sequence?',['Product to Premium to Prospect to Risk','Risk Signal to Risk Objects to Advisory Opportunity','Premium to Claim to Prospect','Policy to Risk Signal to Research'],1,'The sequence moves from observing a signal to identifying affected objects to determining the advisory opportunity.'),
    Q('Which source can provide legitimate risk intelligence?',['Company websites','Public news reports','Industry publications','All of the above'],3,'Multiple public sources provide legitimate risk intelligence when used ethically.'),
    Q('What is the purpose of a risk intelligence hypothesis?',['To make a final diagnosis before meeting the client','To provide a reason to investigate potential risk exposures','To replace the CoverScore assessment','To determine the premium immediately'],1,'A hypothesis is a reason to investigate, not a conclusion.'),
    Q('Which question is most appropriate after a major business expansion?',['Which insurance policy do you want?','How has your risk and protection programme changed with the expansion?','Can I send you a quotation?','Who is your cheapest insurer?'],1,'The CoverScore approach asks about risk and protection changes first.'),
    Q('What is the primary benefit of risk intelligence prospecting?',['It eliminates the need for prospecting','It makes prospect conversations more relevant and informed','It guarantees every prospect will buy','It removes all risk'],1,'Risk intelligence creates more relevant, informed conversations.'),
    Q('Complete: "Don\'t prospect for policies. Prospect for ___."',['clients','risk signals','premiums','referrals'],1,'Prospect for risk signals, not policies.')
  ]),
  hScript('Prospecting Through Risk Intelligence',[
    'Welcome to Lesson Two of CCA 106. In the previous lesson, we learned how to identify the CoverScore advisor\'s ideal client. Now we move to the next question: How do we find these clients? The answer is risk intelligence. Instead of simply looking for people who might buy insurance, we learn to identify situations where risk is changing, growing, or being overlooked. This is called Risk Intelligence Prospecting.',
    'Traditional prospecting often begins with a list: Who can I call? Who do I know? Who is renewing? Risk intelligence prospecting begins somewhere else. We ask: What has changed? What is growing? What is being built? What is being acquired? What new risks may have emerged? This shift makes prospecting more relevant and more intelligent.',
    'Risk Intelligence Prospecting is the process of identifying potential clients by observing and interpreting signals that indicate new, increased, or inadequately managed risks. We observe. We research. We interpret. We identify potential risk objects. We identify decision-makers. And then we engage. Notice that we do not jump immediately to an insurance product. First, we develop a hypothesis. Then we use the CoverScore assessment to investigate.',
    'A Risk Signal is an observable piece of information that suggests a client\'s risk environment may have changed. A new factory. A new branch. A larger workforce. New equipment. A major contract. Digital transformation. These are not proof of a protection gap. They are signals. And a good advisor knows how to investigate what those signals might mean.',
    'Every risk signal should trigger three questions. First: What changed? Second: What risk objects may have been affected? Third: What should we investigate? Imagine a manufacturer opening a new production facility. The signal is the new factory. But the potential risk objects include the building, machinery, stock, employees, operations, and business income. The advisor\'s opportunity is to investigate whether the organisation\'s protection has kept pace with the change.',
    'Risk intelligence can come from many legitimate sources. Company websites. Google Business profiles. Social media. News reports. Industry publications. Professional networks. These sources can reveal expansion, new facilities, major contracts, recruitment, investments, and other changes. Always remember that prospect research must be ethical, lawful, and respectful of privacy.',
    'Before approaching an important prospect, use the five-step Risk Intelligence Research Framework. First: What does the organisation do? Second: How large or complex is it? Third: What has changed recently? Fourth: What risks might those changes create? Fifth: Who is responsible for making risk or insurance decisions? Five questions can turn a cold prospect into a highly relevant conversation.',
    'Consider Alpha Foods Manufacturing. The company has announced a new production facility, significant machinery investment, 60 new employees, a new distribution fleet, and expansion into two additional states. A traditional salesperson might immediately start listing insurance products. A CoverScore advisor thinks differently. These changes may have increased property, machinery, employee, fleet, logistics, liability, supply chain, and business interruption exposures.',
    'Risk intelligence should change the way you communicate. Instead of saying "We sell insurance to businesses. Do you need anything?" you can say: "I noticed your organisation recently expanded its operations. Changes like these can significantly alter a company\'s risk profile. We help organisations assess whether their risk and protection strategy has kept pace with growth. Would you be open to a short conversation?" The difference is relevance.',
    'Risk intelligence transforms prospecting. Instead of chasing everyone, you look for meaningful signals. Instead of guessing what clients need, you investigate. Instead of leading with products, you lead with relevance. Remember: Don\'t prospect for policies. Prospect for risk signals. Risk signals lead to conversations. Conversations lead to assessments. Assessments create opportunities to advise.'
  ]),
  hWorkbook([
    {t:'Risk Intelligence Hunt',i:'Choose one real organisation in your local market. Using publicly available information, identify risk signals.',p:['What does the organisation do?','What is its approximate scale?','What has changed recently?','Identify 5 risk signals','Identify 10 potential risk objects','Identify 5 potential risk areas','Identify 2 likely decision-makers','Write your risk intelligence hypothesis','Write an initial outreach message']},
    {t:'The GreenLine Logistics Challenge',i:'GreenLine Logistics has recently acquired 20 delivery trucks, opened a new warehouse, hired 50 drivers, signed a major e-commerce delivery contract, started using GPS fleet tracking, and expanded operations into three new states.',p:['Identify at least 6 risk signals','Identify at least 8 potential risk objects','Identify at least 5 potential risk areas','Identify the likely decision-makers','Write a one-paragraph risk intelligence hypothesis','Write a professional opening message']}
  ]),
  hCase('Alpha Foods Manufacturing','Alpha Foods Manufacturing Ltd recently announced a new production facility, NGN 800 million investment in new machinery, 60 new employees, a new distribution fleet, and expansion into two additional states. Their existing insurance has not been reviewed since before the expansion.',[
    'Identify all risk signals from the public information provided.',
    'Map the risk objects for each signal — what is exposed?',
    'Write your risk intelligence hypothesis.',
    'Identify the likely decision-makers.',
    'Write a professional outreach message that demonstrates research and creates relevance.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk Signal Categories Reference',description:'Quick reference for the 8 risk signal categories with examples'},
    {url:'#',type:'doc',title:'Risk Intelligence Profile Template',description:'Template for building prospect intelligence briefs from public information'}
  ])
);

C6[3] = L(
  hContent('The CoverScore Prospecting System',[
    'Explain the CoverScore Prospecting System with its 10 stages',
    'Build a focused prospect universe and apply the Prospect Opportunity Score',
    'Develop a prospecting sequence using the 3-Part Opening',
    'Move prospects from first contact through to CoverScore assessment'
  ],[
    SE('Why a System Is Necessary','Many advisors prospect inconsistently — they call when they need sales, send random messages, follow up only when they remember. The problem is not lack of effort but lack of system. Without a system, the advisor does not know who to contact, why, when, what to say, what to do next, or which opportunities deserve priority.'),
    T('The 10 Stage Prospecting System',['Stage','Action'],[
      ['1 — Target','Define the market you want to serve'],
      ['2 — Identify','Build a structured prospect universe'],
      ['3 — Research','Find relevant risk intelligence'],
      ['4 — Score','Assign a Prospect Opportunity Score'],
      ['5 — Prioritise','Focus on highest-value opportunities'],
      ['6 — Engage','Start a relevant conversation'],
      ['7 — Qualify','Determine if a real advisory opportunity exists'],
      ['8 — Assess','Move the prospect into a CoverScore assessment'],
      ['9 — Nurture','Maintain the relationship when timing is not immediate'],
      ['10 — Convert','Translate needs into protection and ongoing advisory']
    ]),
    SE('The Prospect Opportunity Score','The POS is an internal tool for ranking business-development opportunities. Five factors rated 1-5 each (max 25): Risk Signal Strength, Risk Complexity, Decision-Maker Accessibility, Engagement Potential, Timing. Priority classification: 21-25 Priority A (immediate engagement), 16-20 Priority B (active prospecting), 11-15 Priority C (develop), 5-10 Priority D (monitor).'),
    SE('The 3-Part Opening','Part 1 — Observation: "I noticed..." Part 2 — Risk Relevance: "Changes like this can affect..." Part 3 — Invitation: "We help organisations assess... Would you be open to a brief conversation?" Example: "I noticed that your company recently expanded into a second location. Changes like this can significantly affect property, liability, people, and business continuity risks. We help growing organisations assess whether their protection strategy has kept pace. Would you be open to a brief conversation?"'),
    T('Weekly Prospecting Routine',['Day','Activity'],[
      ['Monday','Research — identify new prospects'],
      ['Tuesday','Intelligence — research risk signals'],
      ['Wednesday','Engagement — contact Priority A and B prospects'],
      ['Thursday','Conversations — conduct discovery conversations'],
      ['Friday','Follow-up — move prospects forward'],
      ['Saturday','Review — update CRM and pipeline']
    ]),
    SE('The Prospecting Flywheel','The system is cyclical. A satisfied client can become a repeat client, a cross-solution opportunity, a referral source, and a case study. Research leads to engagement, which leads to assessment, which leads to advice, which leads to protection, which leads to review, which leads to referrals, which leads to new prospects — creating a sustainable growth engine.'),
    C('A good advisor does not wait for prospects to appear. A good advisor builds a system that consistently finds, understands, and engages the right prospects.')
  ],[
    'The 10-stage CoverScore Prospecting System provides a repeatable pathway from target to conversion',
    'The Prospect Opportunity Score (POS) ranks prospects by signal strength, complexity, access, engagement, and timing',
    'The 3-Part Opening (Observation, Risk Relevance, Invitation) creates relevant, low-pressure first contact',
    'A consistent weekly routine and CRM pipeline tracking are essential for sustainable business development'
  ]),
  hQuiz([
    Q('What is the purpose of a prospecting system?',['To eliminate the need for sales','To create a repeatable process for finding and developing opportunities','To guarantee every prospect buys','To replace risk assessment'],1,'A prospecting system creates consistency and measurability.'),
    Q('What comes first in the 10-stage system?',['Convert','Assess','Target','Nurture'],2,'Target — defining the market — comes first.'),
    Q('What does the Prospect Opportunity Score measure?',['The client\'s insurance premium','The potential business-development opportunity','The client\'s risk score','The client\'s claims history'],1,'The POS is an internal tool for prioritising prospects.'),
    Q('Which is NOT part of the Prospect Opportunity Score?',['Risk signal strength','Timing','Engagement potential','Client\'s favourite colour'],3,'The POS evaluates signal strength, complexity, access, engagement, and timing.'),
    Q('What is the purpose of qualification?',['To determine whether a genuine advisory opportunity exists','To force the prospect to buy','To avoid speaking with prospects','To calculate premium'],0,'Qualification determines whether the prospect should move forward.'),
    Q('What is the ultimate goal of CoverScore prospecting?',['To make as many calls as possible','To create a pathway to meaningful risk assessment and advisory','To send the most quotations','To sell the cheapest policy'],1,'The goal is to create a pathway from prospect to assessment to advisory.'),
    Q('What should happen to a prospect who is not ready?',['Delete them','Ignore them','Place them in a structured nurture cycle','Send daily sales messages'],2,'Nurture prospects until timing becomes right.'),
    Q('Why is prioritisation important?',['Advisor time is limited','Every prospect has equal value','It eliminates follow-up','It guarantees conversion'],0,'Time is limited; prioritisation ensures focus on the best opportunities.'),
    Q('What are the three parts of the CoverScore 3-Part Opening?',['Product, Price, Policy','Observation, Risk Relevance, Invitation','Quote, Follow-up, Close','Premium, Claims, Renewal'],1,'Observation, Risk Relevance, and Invitation form the 3-Part Opening.'),
    Q('Complete: "A good advisor builds a system that consistently ___."',['sells the most products','finds, understands, and engages the right prospects','calls every lead','sends mass messages'],1,'The system finds, understands, and engages the right prospects.')
  ]),
  hScript('The CoverScore Prospecting System',[
    'Welcome to Lesson Three of CCA 106. In our previous lesson, we learned how to use risk intelligence to identify opportunities. But identifying opportunities is only the beginning. To consistently grow as a CoverScore advisor, you need a system. A system that tells you who to target, how to research them, how to prioritise them, how to engage them, and how to move them toward a CoverScore assessment. That is the CoverScore Prospecting System.',
    'Many advisors work hard but prospect inconsistently. They call when they need sales. They send messages when they remember. They follow up when an opportunity comes to mind. The problem is not always effort. The problem is often the absence of a system. The CoverScore approach replaces random prospecting with a repeatable process.',
    'The CoverScore Prospecting System has ten stages. Target. Identify. Research. Score. Prioritise. Engage. Qualify. Assess. Nurture. And finally, convert. The system creates a clear pathway from a potential prospect to a meaningful advisory relationship.',
    'The first stage is Target. Decide who you want to serve. The second stage is Identify. Build a structured prospect universe. Instead of saying "I know many businesses," your objective should be to say "I have identified one hundred businesses that fit my target profile." Specificity creates focus. Focus creates consistency.',
    'Next, research your prospects. Understand their business. Understand their scale. Identify what has changed. Consider what risks those changes may create. And identify who makes risk or insurance decisions. Your research should create a reason for contact. The prospect should not feel like a random name on a list. They should feel like a business you have taken the time to understand.',
    'Not every prospect deserves the same amount of your time. The CoverScore Prospecting System introduces the Prospect Opportunity Score. We consider the strength of the risk signal, the complexity of potential risks, access to decision-makers, engagement potential, and timing. The result helps us focus our attention where the opportunity is strongest.',
    'Once you have prioritised a prospect, it is time to engage. Start with an observation. Connect it to risk relevance. Then invite the prospect into a conversation. For example: "I noticed your company recently expanded into a second location. Changes like this can affect property, liability, people, and business continuity risks. We help growing organisations assess whether their protection strategy has kept pace. Would you be open to a brief conversation?" Notice the difference. You are not asking for a sale. You are opening an advisory conversation.',
    'The ultimate objective of CoverScore prospecting is not simply to get a meeting. It is to create a pathway to assessment. A lead becomes a conversation. A conversation becomes a qualified opportunity. The qualified opportunity becomes a CoverScore assessment. The assessment produces a risk report. The report leads to a protection strategy. And the strategy leads to implementation and ongoing advisory.',
    'The CoverScore Prospecting System is also a flywheel. A satisfied client can become a repeat client. A referral source. A cross-solution opportunity. And a source of new prospects. This creates a cycle where every successful advisory relationship can contribute to future growth.',
    'The system only works when it becomes a habit. Use your week intentionally. Research on Monday. Build intelligence on Tuesday. Engage prospects on Wednesday. Hold conversations on Thursday. Follow up on Friday. Review your pipeline on Saturday. Prospecting should not be something you do only when your pipeline is empty.'
  ]),
  hWorkbook([
    {t:'Build Your First Pipeline',i:'Select one target market and identify 10 real prospects.',p:['Name, Industry, Location for each','Decision-maker identified','One risk signal per prospect','Three potential risk objects per prospect','Prospect Opportunity Score and priority category','First engagement channel','Next action for each']},
    {t:'The 5-5-5 Routine',i:'Plan one week of the 5-5-5 routine: 5 new prospects identified, 5 researched, 5 outreach attempts.',p:['Day 1 (Monday): Research — identify 5 new prospects','Day 2 (Tuesday): Build intelligence on 5 prospects','Day 3 (Wednesday): Engage 5 prospects','Day 4 (Thursday): Hold conversations','Day 5 (Friday): Follow-up and review']}
  ]),
  hCase('Medicare Specialist Hospital','A CoverScore advisor discovers that Medicare Specialist Hospital has opened a new hospital wing, acquired new MRI equipment, hired 30 additional employees, launched a digital patient portal, and experienced increased patient volume. The hospital has existing insurance but has not conducted a comprehensive risk review in over two years.',[
    'Apply the 10-stage Prospecting System to this prospect. What happens at each stage?',
    'Calculate the Prospect Opportunity Score. Justify each factor rating.',
    'Write a 3-Part Opening message for the Hospital Administrator.',
    'What qualification questions would you ask to determine if this is a genuine opportunity?',
    'What CoverScore Assessment funnel is most appropriate? Why?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Prospect Opportunity Score Calculator',description:'Template for calculating and tracking POS across your prospect pipeline'},
    {url:'#',type:'doc',title:'Weekly Prospecting Planner',description:'Printable weekly planner for the CoverScore prospecting routine'}
  ])
);

C6[4] = L(
  hContent('Starting the Risk Conversation',[
    'Explain the purpose of a first risk conversation',
    'Use the CoverScore 3-Part Opening effectively',
    'Apply the Risk Conversation Ladder from context to protection',
    'Handle common prospect responses without selling prematurely'
  ],[
    SE('The Purpose of the First Conversation','The first conversation has one primary objective: Earn permission to continue. It is not the time to explain every product, present a quotation, discuss premium, or give a long company introduction. The first conversation should create Relevance (why should I listen?), Curiosity (could there be something I have not considered?), Trust (this person understands my situation), and Permission (I am willing to have a deeper conversation).'),
    T('Sales Opening vs Risk Opening',['Traditional Sales Opening','CoverScore Risk Opening'],[
      ['"Good morning, we sell insurance. Do you have any needs?"','"I noticed your organisation recently expanded. Changes like this can create new risks. Would you be open to a brief conversation?"'],
      ['The prospect thinks: "What are they selling?"','The prospect thinks: "What risks are they talking about?"'],
      ['Product-first conversation','Risk-first conversation'],
      ['Starts with what advisor wants to sell','Starts with what the client may be exposed to']
    ]),
    SE('The 3-Part Opening','Part 1 — Observation: Start with something specific you have noticed. "I noticed your company recently opened a second branch in Abuja." Part 2 — Risk Relevance: Connect the observation to possible risk. "Expanding into a second location can introduce new property, liability, employee, operational, and business interruption exposures." Part 3 — Invitation: "Would you be open to a brief conversation about how you are currently managing these exposures?"'),
    SE('The Risk Conversation Ladder','Move through five levels gradually. Level 1 — Context: "Tell me about the business." Level 2 — Change: "What has changed recently?" Level 3 — Exposure: "What risks have those changes created?" Level 4 — Impact: "What would happen if those risks materialised?" Level 5 — Protection: "How are you currently managing those risks?" This sequence avoids jumping straight into insurance.'),
    T('Handling Common Responses',['Response','Advisory Response'],[
      ['"We already have insurance"','"That is good. When was your last comprehensive risk review?"'],
      ['"Send me a quotation"','"I can help with that. Let me first understand your risk environment so the recommendation is relevant."'],
      ['"We are not interested"','"I understand. May I ask one question? When was the last time you reviewed your overall risk exposure?"'],
      ['"I am busy"','"I understand. Would it work if I sent a brief summary and we schedule a 15-minute call at a more convenient time?"']
    ]),
    C('Do not start with what you sell. Start with what the client may be exposed to. Because when people understand their risks, they become more open to discussing protection.')
  ],[
    'The first conversation earns permission to continue — it creates relevance, curiosity, trust, and permission',
    'The 3-Part Opening connects a specific observation to risk relevance and invites exploration',
    'The Risk Conversation Ladder moves from context through change, exposure, and impact to protection',
    'Common responses like "we already have insurance" should be handled with advisory reframing, not argument'
  ]),
  hQuiz([
    Q('What is the primary objective of the first risk conversation?',['Sell a policy immediately','Send a quotation','Earn permission to continue the conversation','Explain every insurance product'],2,'The goal is to earn permission to continue, not to sell.'),
    Q('What should a CoverScore advisor start with?',['Product','Premium','Risk','Claims'],2,'Always start with risk.'),
    Q('What are the three parts of the CoverScore 3-Part Opening?',['Product, Price, Policy','Observation, Risk Relevance, Invitation','Quote, Follow-up, Close','Premium, Claims, Renewal'],1,'Observation, Risk Relevance, and Invitation.'),
    Q('Which question is most useful for exploring changes in a client\'s risk profile?',['Do you need insurance?','What is your budget?','What has changed in your organisation over the last 12 months?','Do you want a quotation?'],2,'The "What has changed?" question uncovers risk triggers.'),
    Q('What should an advisor do when a prospect says "We already have insurance"?',['Argue with the prospect','End the conversation','Immediately sell another product','Explore whether existing protection still matches current risks'],3,'Acknowledge and explore whether protection has kept pace with change.'),
    Q('What is the correct sequence of the Risk Conversation Ladder?',['Protection, Premium, Product, Claims','Context, Change, Exposure, Impact, Protection','Product, Quote, Premium, Close','Lead, Quote, Policy, Renewal'],1,'The ladder moves from context through change, exposure, and impact to protection.'),
    Q('What does the "R" in the R-H-Q-N Framework represent?',['Risk','Revenue','Reason','Recommendation'],2,'Reason — why am I contacting them?'),
    Q('What should an advisor do after asking a question?',['Immediately ask another question','Listen carefully','Start explaining products','Send a quotation'],1,'Listen carefully before asking the next question.'),
    Q('Which statement best reflects the CoverScore philosophy?',['Sell first, understand later','Start with the product the advisor wants to sell','Start with what the client may be exposed to','Always offer the cheapest policy'],2,'Start with the client\'s potential exposures.'),
    Q('What is the ultimate progression of the first risk conversation?',['Observation, Conversation, Assessment','Product, Premium, Policy','Quote, Discount, Close','Claim, Renewal, Sale'],0,'Observation leads to conversation, which leads to assessment.')
  ]),
  hScript('Starting the Risk Conversation',[
    'Welcome to Lesson Four of CCA 106. In the previous lesson, we learned how to build a structured prospecting system. We now know how to identify the right prospects, research them, and prioritise opportunities. But there is one critical skill left: How do you actually start the conversation? This is where many advisors struggle. The CoverScore advisor does not begin with a product. The CoverScore advisor begins with risk.',
    'Imagine contacting a business owner and saying: "Good morning. We sell motor, fire, life, marine, health and liability insurance. Do you need any insurance?" What is the prospect likely thinking? "What are they trying to sell me?" Now imagine saying: "I noticed your company recently expanded its operations. Changes like this can create new exposures. I would like to understand how your risk environment has changed and whether your current protection strategy has kept pace." The conversation immediately feels different.',
    'The first risk conversation has one primary objective: Earn permission to continue the conversation. You do not need to explain every insurance product. You do not need to present a quotation. You need to create relevance, curiosity, and trust. Your goal is to get the prospect to say "Let\'s talk."',
    'The CoverScore advisor uses the three-part opening. First: Observation — what have you noticed? Second: Risk Relevance — why might that matter? Third: Invitation — can we explore it together? For example: "I noticed your company recently opened a second branch. Expanding into another location can create new property, liability, employee, and business continuity exposures. Would you be open to a brief conversation about how your current protection strategy has evolved?"',
    'One of the most powerful questions in risk advisory is "What has changed?" Because risk is dynamic. A business may have had adequate protection two years ago. But what if the business now has more employees, more assets, more branches, more technology, and more customers? The risk profile may have changed. But the protection may not have changed with it. That is where gaps emerge.',
    'The CoverScore risk conversation moves through five levels. Start with context: "Tell me about the business." Explore change: "What has changed recently?" Move to exposure: "What risks have those changes created?" Explore impact: "What would happen if those risks materialised?" Then discuss protection: "How are you currently managing those risks?" This sequence allows the prospect to discover the risk with you.',
    'Remember, the risk conversation is not an interrogation. Use this simple rhythm: Ask. Listen. Reflect. Explore. Ask a question. Listen carefully. Reflect what you heard. Then explore deeper. The best advisors are not the ones who talk the most. They are the ones who understand the most.',
    'A common response is "We already have insurance." Do not argue. Do not immediately start listing products. Say: "That is good to hear. Our role is not simply to help businesses buy insurance. We help them assess whether their existing protection still matches their current risk environment. When was your last comprehensive risk review?" You have now moved the conversation from insurance ownership to protection adequacy.',
    'The same principle works across industries. For an SME: "I noticed your business has expanded into a larger facility." For manufacturing: "I noticed you recently added a new production line." For a hospital: "I noticed your hospital has introduced new diagnostic equipment." For a church: "I understand your organisation now operates several facilities and hosts large gatherings." Each observation creates a reason to discuss risk.',
    'Before contacting any prospect, use the R-H-Q-N Framework. Reason: Why am I contacting them? Hypothesis: What risk might be relevant? Question: What do I need to learn? Next Step: What do I want to happen? If you cannot answer these four questions, you are probably not ready. Remember: Do not start with what you sell. Start with what the client may be exposed to.'
  ]),
  hWorkbook([
    {t:'The 3-Prospect Conversation Challenge',i:'Select three real prospects from your pipeline and prepare a full conversation plan.',p:['Write one specific observation for each','Identify three possible risk areas','Write your 3-Part Opening for each','Create five questions using the Risk Conversation Ladder','Predict one objection per prospect','Write your advisory response for each objection','Define the next step you want']},
    {t:'Roleplay Practice',i:'Practice the risk conversation with a colleague or record yourself.',p:['Opening using the 3-Part structure','Ask the "What has changed?" question','Move through the Conversation Ladder','Handle "We already have insurance"','Summarise what you heard','Invite the prospect to the next step']}
  ]),
  hCase('The SME Owner','You have identified a Lagos-based manufacturing SME that recently expanded into a larger facility. The company now has 70 employees, new machinery, increased inventory, a new delivery fleet, and two major corporate customers. The owner has been in business for 12 years and has insurance but admits he has not really reviewed it since the expansion.',[
    'Write your specific observation for this prospect.',
    'Write your 3-Part Opening.',
    'Using the Risk Conversation Ladder, write 5 discovery questions.',
    'Predict how the owner might respond to "When was your last comprehensive risk review?"',
    'Write your response if he says "I already have insurance. I do not think I need anything else."'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk Conversation Quick Reference',description:'One-page guide to the 3-Part Opening and Conversation Ladder'},
    {url:'#',type:'doc',title:'Objection Response Matrix',description:'10 common prospect responses with advisory reframing responses'}
  ])
);

C6[5] = L(
  hContent('Converting Prospects into CoverScore Assessments',[
    'Recognise assessment-ready buying signals',
    'Use the Assessment Invitation Framework to convert conversations',
    'Explain the value of a CoverScore Assessment as a diagnostic',
    'Secure assessment appointments and reduce no-shows'
  ],[
    SE('The Conversion Journey','The CoverScore business development process follows: Prospect to Risk Conversation to Risk Interest to Assessment Invitation to Completed Assessment to Risk Score to Protection Gap Analysis to Recommendation to Protection Decision to Implementation to Continuous Review. The advisor\'s job is to identify when the prospect is ready for the next appropriate step.'),
    SE('Assessment Readiness Signals','A prospect is assessment-ready when they demonstrate: Acknowledgement ("I think we may have some gaps"), Curiosity ("How would we know if we have a gap?"), Concern ("That could be a serious problem"), Change ("We haven\'t reviewed since we expanded"), Uncertainty ("I\'m not sure what we\'re covered for"), Consequence Awareness ("If we were shut down, it would be very difficult"), or Permission ("Can you help us review this?").'),
    T('The Assessment Invitation Framework',['Step','Action','Example'],[
      ['Summarise','Reflect what you heard','"From what you\'ve shared, the business has changed significantly..."'],
      ['Identify','Highlight the concern','"Your risk profile may be very different from when you last reviewed."'],
      ['Explain','Show how assessment helps','"The CoverScore Assessment helps us map risks and identify gaps."'],
      ['Invite','Ask participation','"Would you be open to completing the assessment?"']
    ]),
    SE('The Diagnostic Positioning','Think about a doctor. A doctor does not prescribe treatment before understanding the patient\'s condition. The doctor listens, examines, diagnoses, then recommends treatment. The CoverScore advisor follows the same philosophy: Discover, Assess, Score, Analyse, then Recommend. The assessment comes before the recommendation.'),
    T('Handling Assessment Objections',['Objection','Response'],[
      ['"Just send me a quote"','"I can help with that. To make sure the recommendation is relevant, let me understand your risk environment first."'],
      ['"I don\'t have time"','"We can keep the first stage focused. Would 15 minutes work?"'],
      ['"I already know my risks"','"The assessment helps structure that knowledge and compare it against current protection."'],
      ['"We have a broker"','"The assessment can serve as an independent risk review complementing your existing relationship."']
    ]),
    C('Don\'t force the assessment. Make the assessment make sense. Because when a prospect understands why they need clarity, the assessment becomes a natural next step.')
  ],[
    'Assessment readiness is indicated by acknowledgement, curiosity, concern, change, uncertainty, or permission signals',
    'The Assessment Invitation Framework: Summarise, Identify, Explain, Invite',
    'Position the assessment as a diagnostic — assess before recommending',
    'Common objections like "send a quote" should be reframed toward risk understanding first'
  ]),
  hQuiz([
    Q('What is the primary purpose of the CoverScore Assessment?',['To sell insurance immediately','To create a structured understanding of risk and protection gaps','To replace every existing insurance advisor','To calculate premiums'],1,'The assessment creates clarity before recommendation.'),
    Q('Which statement indicates assessment readiness?',['"I don\'t want to discuss anything"','"I\'m not sure whether our current protection covers the new equipment"','"Send me every product brochure"','"I don\'t know your company"'],1,'Uncertainty about protection adequacy indicates readiness.'),
    Q('What is the correct Assessment Invitation Framework?',['Sell, Quote, Close, Follow up','Summarise, Identify, Explain, Invite','Ask, Quote, Discount, Close','Product, Price, Premium, Policy'],1,'Summarise what you heard, identify the concern, explain the assessment, invite participation.'),
    Q('What is the main reason for assessing before recommending?',['To delay the sale','To make the process more complicated','To base recommendations on the client\'s actual risk environment','To avoid speaking to the client'],2,'Assess first so recommendations are grounded in the client\'s actual risk.'),
    Q('How should an advisor respond when a prospect says "We already have a broker"?',['Tell them their broker is inadequate','End the conversation','Respect the existing relationship and position CoverScore as additional risk intelligence','Immediately offer a discount'],2,'Position as complementary risk intelligence, not as a replacement.'),
    Q('What does the CoverScore Conversion Bridge begin with?',['"You should buy..."','"You mentioned..."','"Our premium is..."','"We have a promotion..."'],1,'Start with "You mentioned..." to connect to the prospect\'s own words.'),
    Q('Which is NOT part of managing an assessment appointment?',['Confirming the date','Confirming the time','Identifying participants','Sending a random quotation before the assessment'],3,'Never send a quotation before understanding the risk.'),
    Q('Why should assessment conversion be measured?',['To pressure advisors','To identify where prospects drop off in the conversion funnel','To eliminate prospecting','To replace risk assessment'],1,'Measuring conversion identifies bottlenecks.'),
    Q('What is the Conversion Bridge structure?',['Product, Price, Policy','You mentioned, That means, The question is, Assessment can help, Would you be open','Quote, Proposal, Close','Lead, Call, Sale'],1,'The bridge connects the prospect\'s words to the assessment opportunity.'),
    Q('Complete: "Don\'t force the assessment. ___."',['Sell the policy','Make the assessment make sense','Reduce the premium','Send a brochure'],1,'Make the assessment make sense as a natural next step.')
  ]),
  hScript('Converting Prospects into CoverScore Assessments',[
    'Welcome to Lesson Five of CCA 106. In our previous lesson, we learned how to start a risk conversation. But a good conversation is only the beginning. The next question is: How do we move from conversation to action? In this lesson, we will learn how to convert a prospect into a completed CoverScore Assessment. The key principle is simple: The assessment should never feel like a sales pitch. It should feel like the natural next step in understanding the client\'s risk.',
    'The CoverScore journey follows a clear sequence. First, we identify the prospect. Then we start the risk conversation. We create interest. We invite the prospect to complete an assessment. The assessment produces a risk score, a Risk Fingerprint, and a protection gap analysis. We then use those findings to develop recommendations. The goal is not to skip steps. The goal is to move the client through the right step at the right time.',
    'Not every prospect is ready for an assessment. Look for signals. The prospect says "I think we may have some gaps" or "I\'m not sure what we\'re actually covered for" or "We haven\'t reviewed our insurance since we expanded." These are assessment readiness signals. When the prospect begins to recognise uncertainty, curiosity, or concern, the advisor can introduce the assessment as the logical next step.',
    'Think about a doctor. A doctor does not prescribe treatment before understanding the patient\'s condition. The doctor listens, examines, diagnoses, and then recommends treatment. The CoverScore advisor follows the same principle. We discover. We assess. We score. We analyse. Then we recommend. This is why the assessment comes before the protection recommendation.',
    'When you believe a prospect is ready, use the Assessment Invitation Framework. First, summarise what you have heard. Second, identify the potential concern. Third, explain what the assessment can help clarify. Fourth, invite the prospect to participate. For example: "From what you\'ve shared, your business has changed significantly since your last insurance review. You now have more employees, assets, and operational exposure. The CoverScore Assessment can help us understand your current risk profile and identify potential protection gaps. Would you be open to completing the assessment?"',
    'Another powerful technique is the Conversion Bridge. Start with "You mentioned..." Then "That means..." Then "The question is..." Next "The CoverScore Assessment can help us..." And finally "Would you be open to...?" This structure connects the prospect\'s own words to the assessment. You are not forcing the assessment. You are showing why it makes sense.',
    'Sometimes the prospect will say "Just send me a quote." Do not reject the request. Reframe it. Say: "I can certainly help with that. To make sure the recommendation is relevant, it would help me understand your current risk environment first. Otherwise, I may recommend something that doesn\'t address your actual priorities." A quote answers "How much does this cost?" An assessment answers "What protection do I actually need?"',
    'A prospect may tell you "We already have a broker." Never attack the existing relationship. Instead, say: "That\'s good. Having an existing advisor is valuable. The CoverScore Assessment can also serve as an independent risk review that helps you understand your overall risk position." Your objective is not to replace relationships unnecessarily. Your objective is to bring additional risk intelligence and clarity.',
    'Once the prospect agrees, secure the appointment properly. Confirm the date, time, format, who should participate, and expected duration. Tell them what, if anything, they should prepare. Send confirmation immediately. Remind 24 hours before. A scheduled assessment is not the same as a completed assessment. Good advisors manage the journey all the way to completion.',
    'Measure your assessment conversion funnel. How many prospects were invited? How many booked? How many started? How many completed? How many received their reports? And how many accepted recommendations? This helps you identify where prospects are dropping off. What gets measured can be improved.'
  ]),
  hWorkbook([
    {t:'The 5-Assessment Conversion Challenge',i:'Select five real prospects from your pipeline. For each, document:',p:['The risk conversation outcome','The readiness signal you heard','Your Assessment Invitation using Summarise, Identify, Explain, Invite','The most likely objection and your response','The appointment date and time','The assessment status']},
    {t:'Objection Handling Practice',i:'For each objection, write your response:',p:['"Just send me a quote"','"I don\'t have time for an assessment"','"I already know my risks"','"We have a broker we trust"','"We are not interested"']}
  ]),
  hCase('The Growing SME','An SME owner says: "We have grown significantly this year. We have moved into a bigger facility, doubled our staff, and bought new equipment. But honestly, we haven\'t reviewed our insurance in a while."',[
    'Write your response acknowledging the growth and identifying the risk concern.',
    'Write your Assessment Invitation using the framework.',
    'What readiness signal did the owner demonstrate?',
    'Predict the most likely objection and write your response.',
    'What would you confirm in the appointment scheduling?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Assessment Readiness Signal Guide',description:'Quick reference for recognising when a prospect is ready for an assessment'},
    {url:'#',type:'doc',title:'Assessment Appointment Confirmation Template',description:'Templates for confirmation messages and reminders'}
  ])
);

C6[6] = L(
  hContent('From Advisory Insight to Business Conversion',[
    'Translate CoverScore findings into client priorities',
    'Use the Risk-to-Protection Conversion Framework',
    'Apply the Three-Priority Rule and the "So What?" Test',
    'Convert risk intelligence into appropriate protection recommendations'
  ],[
    SE('Insight Alone Does Not Create Value','A CoverScore Assessment may identify ten risk exposures, but the client may not be ready to address all ten. The advisor\'s job is to determine which risks matter most right now. Move from "Here are all your risks" to "Here are the three risks we believe deserve your immediate attention." Focus creates clarity. Clarity creates decisions. Decisions create action.'),
    T('The Risk-to-Protection Conversion Framework',['Step','Action'],[
      ['1 — Discover','What risks exist?'],
      ['2 — Quantify','What could the risk cost the client?'],
      ['3 — Prioritise','Which risks deserve immediate attention?'],
      ['4 — Identify the Gap','What protection is missing or insufficient?'],
      ['5 — Recommend','What practical action can address the gap?'],
      ['6 — Decide','What does the client want to do?'],
      ['7 — Implement','How will the solution be put in place?'],
      ['8 — Review','How will the client remain protected as circumstances change?']
    ]),
    SE('The "So What?" Test','Every risk finding should answer: So what? Finding: The company has expensive production machinery. So what? A breakdown could stop production. So what? Production stoppage could cause revenue loss, delayed deliveries, and reputational damage. So what? The business faces significant financial exposure beyond equipment repair costs. This turns technical observations into business conversations.'),
    SE('The Three-Priority Rule','When presenting CoverScore findings, avoid overwhelming the client. Do not present "Here are 27 things you need to fix." Instead: "Based on the assessment, we have identified three priority areas that deserve immediate attention." Example: Priority 1 — Business Interruption, Priority 2 — Cyber Risk, Priority 3 — Employee Protection. Explain why each matters and what the consequence of inaction would be.'),
    T('Risk Insight vs Product Recommendation',['Risk Insight','Protection Gap','Recommendation'],[
      ['"Your business depends on one production facility"','"Current protection may not fully address financial consequences of prolonged interruption"','Review Business Interruption protection'],
      ['"You have acquired new machinery"','"New equipment may not be covered under existing property policy"','Review Machinery Breakdown and Property protection'],
      ['"You now process customer data digitally"','"Cyber exposure may not be addressed by current programme"','Explore Cyber risk protection']
    ]),
    C('Risk insight creates the opportunity. Advisory clarity creates the decision. The right action creates the business relationship.')
  ],[
    'Insight alone does not create value — clients need focus, prioritisation, and clear recommendations',
    'The Risk-to-Protection Conversion Framework has 8 steps from discovery through to review',
    'The "So What?" Test translates technical findings into business consequences',
    'The Three-Priority Rule prevents overwhelming clients and drives action on what matters most'
  ]),
  hQuiz([
    Q('What is the key transition taught in this lesson?',['Prospecting to marketing','Advisory insight to business conversion','Policy renewal to claims','Product pricing to underwriting'],1,'Moving from identifying risks to helping clients act on them.'),
    Q('What should come before a product recommendation?',['Discount','Risk understanding and protection gap analysis','Commission calculation','Policy document'],1,'Understanding and gap analysis come before any recommendation.'),
    Q('What is the correct conversion sequence?',['Product, Price, Quote, Risk','Risk, Consequence, Gap, Recommendation, Action','Quote, Premium, Risk, Client','Policy, Claim, Assessment'],1,'Risk first, then consequence, gap, recommendation, and action.'),
    Q('What does the "So What?" Test help an advisor do?',['Calculate premium','Explain the business consequences of a risk','Sell more products immediately','Avoid risk assessment'],1,'It translates technical findings into meaningful business consequences.'),
    Q('What is the purpose of the Three-Priority Rule?',['To sell three products to every client','To focus the client on the most important risks','To reduce every client\'s insurance coverage','To avoid making recommendations'],1,'Focus on the three most important risks to avoid overwhelming the client.'),
    Q('What should an advisor do if a client cannot afford every recommendation?',['Pressure the client','Recommend everything immediately','Prioritise critical risks and create a phased roadmap','End the relationship'],2,'Create a phased approach based on priority and impact.'),
    Q('Which is NOT necessarily a risk management response?',['Avoid','Reduce','Transfer','Sell immediately'],3,'Selling is a business action, not a risk management response.'),
    Q('Which statement is the best conversion question?',['"You must buy this"','"Would you like us to prepare a recommendation?"','"Can I get your payment now?"','"This is your only option"'],1,'Ask permission to prepare a recommendation.'),
    Q('How should an advisor respond to "I need to think about it"?',['Pressure the client','End the relationship','Ask what specifically they would like to think through','Immediately offer a discount'],2,'Find out what the real concern is.'),
    Q('What should every recommendation meeting end with?',['"We\'ll keep in touch"','A specific next action','A product brochure','A discount'],1,'Always end with a clear next action.')
  ]),
  hScript('From Advisory Insight to Business Conversion',[
    'Welcome to Lesson Six of CCA 106. In the previous lesson, we learned how to convert prospects into CoverScore Assessments. But completing an assessment is not the final destination. The real value begins when we turn what we discover into action. In this lesson, we will learn how to move from advisory insight to business conversion. In other words: How do we help a client move from "I understand my risks" to "I know what I need to do about them?"',
    'The CoverScore journey does not end when the assessment is completed. The assessment produces intelligence. The intelligence creates insight. The insight identifies priorities. The priorities lead to recommendations. The recommendations lead to decisions. And decisions lead to protection. This is where advisory insight becomes business conversion.',
    'One of the most important principles is this: A risk insight is not the same thing as a product recommendation. For example, saying "Your business depends heavily on one production facility" is an insight. Explaining that a prolonged shutdown could affect revenue and customer commitments reveals the consequence. Identifying that existing protection may not fully address the financial impact reveals a gap. Only then do we move to the appropriate recommendation. Risk first. Product second.',
    'For every finding in a CoverScore report, ask: "So what?" A company may have expensive machinery. So what? A machinery breakdown could stop production. So what? Production interruption could reduce revenue and affect customer commitments. So what? The business could face significant financial exposure. This is how the advisor turns a technical risk finding into a meaningful business conversation.',
    'Do not overwhelm the client with every risk identified in the assessment. A CoverScore report may reveal many exposures. But the client needs focus. Use the Three-Priority Rule. Identify the three risks that deserve the most immediate attention. Explain why they matter. Then agree with the client on what should happen next. Focus creates clarity. Clarity creates decisions. Decisions create action.',
    'The Risk-to-Protection Conversion Framework follows eight steps. Discover the risk. Quantify its potential impact. Prioritise the exposure. Identify the protection gap. Recommend the appropriate action. Secure a client decision. Implement the solution. And finally, review the risk over time. Notice that the recommendation appears in the middle of the process. It does not come first.',
    'When presenting a recommendation, reconnect the client to their original goal. Then present the finding. Explain the consequence. Identify the gap. Present the recommendation. And ask for the next decision. For example: "You told us that protecting business continuity is a priority. The assessment identified business interruption as one of your highest-priority risks. A prolonged shutdown could affect revenue and fixed expenses. Your current protection may not fully address this exposure. Would you like us to develop the appropriate options for your consideration?"',
    'Not every risk requires insurance. Some risks should be avoided. Some should be reduced. Some should be prevented. Some may be transferred. Others may be retained. Insurance is one risk management tool among several. The CoverScore advisor recommends what the client needs — not simply what the advisor wants to sell.',
    'Sometimes the client agrees with the recommendation but cannot address everything immediately. Do not pressure them. Help them prioritise. Identify the risks with the greatest potential impact. Address those first. Then create a phased protection roadmap: immediate priorities, ninety-day priorities, six-month priorities, and a twelve-month review. This approach keeps the client protected while respecting their financial reality.',
    'Never end a recommendation meeting with "We\'ll keep in touch." Always agree on a specific next action. Perhaps the advisor will prepare a proposal. Perhaps the client will provide information. Perhaps a management presentation will be scheduled. Every successful advisory conversation should end with a clear next step.'
  ]),
  hWorkbook([
    {t:'From Report to Recommendation',i:'Take a real or simulated CoverScore report and prepare a recommendation conversation.',p:['Identify the top 3 risks using the Three-Priority Rule','Apply the "So What?" Test to each risk — what is the business consequence?','Identify the protection gap for each','Write your recommendation for each','Create a phased protection roadmap: Immediate, 90 days, 6 months, 12 months']},
    {t:'Conversion Roleplay Prep',i:'Prepare for a roleplay where the client raises three objections:',p:['"The premium is too expensive" — how do you respond?','"We already have insurance" — how do you respond?','"Let me think about it" — how do you respond?','Write your conversion question — what will you ask to move the client forward?','Define the next action you want']}
  ]),
  hCase('PrimeBuild Engineering — The Recommendation','PrimeBuild Engineering has a CoverScore of 54. The assessment identifies: (1) Business Interruption — Very High exposure, current protection may not reflect revenue growth, (2) Machinery Breakdown — New equipment not specifically protected, (3) Cyber Risk — Digital systems introduced without corresponding protection, (4) Liability — Expanded operations created new third-party exposures, (5) Employee Protection — Workforce grew 25% without benefit review.',[
    'Apply the Three-Priority Rule — which three risks deserve immediate attention?',
    'For each priority, apply the "So What?" Test — what is the business consequence?',
    'Identify the protection gap for each priority risk.',
    'Write your recommendation for each using the Risk, Impact, Priority, Recommendation, Next Step structure.',
    'Create a phased protection roadmap for PrimeBuild.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk-to-Protection Conversion Framework',description:'One-page reference for the 8-step conversion framework'},
    {url:'#',type:'doc',title:'Protection Roadmap Template',description:'Template for building phased protection plans for clients'}
  ])
);

C6[7] = L(
  hContent('Client Retention, Referrals & Lifetime Advisory Relationships',[
    'Understand why retention is more valuable than one-time sales',
    'Build a structured post-sale engagement process using the 30-60-90 model',
    'Generate referrals through value rather than pressure',
    'Create a lifetime advisory relationship through continuous risk review'
  ],[
    SE('The Sale Is Not the Finish Line','Traditional insurance selling follows: Prospect to Sell Policy to Renew Policy. The CoverScore model is different: Prospect to Assess to Advise to Protect to Review to Improve to Refer to Reassess. The advisor does not disappear after the policy is issued. The relationship continues. The client should always feel "My advisor understands my risks" — not "My agent only calls when my policy is expiring."'),
    T('The Lifetime Advisory Cycle',['Stage','Purpose'],[
      ['1 — Connect','Build the relationship'],
      ['2 — Assess','Understand the client\'s risks'],
      ['3 — Advise','Explain priorities and protection gaps'],
      ['4 — Protect','Implement appropriate solutions'],
      ['5 — Engage','Stay connected between renewals'],
      ['6 — Review','Monitor changes in the client\'s environment'],
      ['7 — Improve','Strengthen the client\'s risk posture over time'],
      ['8 — Advocate','Create satisfied clients who willingly refer others']
    ]),
    SE('The 30-60-90 Retention Model','First 30 Days: Confirm successful implementation — policy documentation, coverage understanding, claims procedures, contact confirmation. 60 Days: Check satisfaction and understanding — "How has your experience been since implementation?" "Have there been any changes?" 90 Days: Conduct a value review — "Since we completed your assessment, has anything changed?" This early engagement prevents the advisor from becoming invisible.'),
    SE('Claims Are Moments of Truth','When something goes wrong, the client needs more than a policy. Respond quickly. Explain the process. Help with documentation. Keep the client informed. Follow up until resolution. After the claim, ask: "What have we learned from this event?" Was the risk correctly identified? Was coverage adequate? Were there unexpected gaps? The claim becomes a learning opportunity.'),
    T('The Referral Moment',['When to Ask','What to Say'],[
      ['After a successful assessment','"You mentioned how useful it was to see your risks mapped out. Is there anyone in your network who might benefit from the same exercise?"'],
      ['After a successful claim','"I\'m glad we could support you through the process. Is there anyone you know who might benefit from a more structured approach?"'],
      ['After a successful review','"Your risk profile has improved significantly. Do you know another business owner who might benefit from this approach?"']
    ]),
    C('Retention is earned through relevance. Referrals are earned through trust. Lifetime relationships are earned through consistent value.')
  ],[
    'Retention creates recurring opportunities for review, improvement, and referral — the sale is not the finish line',
    'The Lifetime Advisory Cycle ensures continuous engagement: Connect, Assess, Advise, Protect, Engage, Review, Improve, Advocate',
    'Claims are moments of truth that either strengthen or damage the relationship',
    'The best referrals come from demonstrated value and trust, not from pressure'
  ]),
  hQuiz([
    Q('What should happen after a policy is implemented?',['The advisor disappears until renewal','The relationship continues through engagement and review','The client must find another advisor','The advisor stops assessing risk'],1,'Engagement and review continue after implementation.'),
    Q('What is the purpose of the 30-60-90 model?',['To calculate premiums','To structure post-implementation client engagement','To replace claims processes','To recruit agents'],1,'The 30-60-90 model ensures continuous engagement after the sale.'),
    Q('What is the most powerful annual review question?',['"Do you want to renew?"','"Can you pay today?"','"What has changed since we last reviewed your risks?"','"Do you want a discount?"'],2,'"What has changed?" uncovers new risks and opportunities.'),
    Q('When should an advisor ask for a referral?',['At every conversation','Only when value has been demonstrated and timing is appropriate','Before meeting the client','Immediately after introducing themselves'],1,'Referral asks should be connected to demonstrated value.'),
    Q('What is better than receiving only a referral name?',['A cold email','A warm introduction','A generic advertisement','A mass WhatsApp message'],1,'A warm introduction transfers trust from the referrer.'),
    Q('What is a client advocate?',['A competitor','A satisfied client who actively supports and recommends the advisor','An insurance regulator','A claims officer'],1,'An advocate actively supports and recommends the advisor.'),
    Q('Why are claims called moments of truth?',['They determine the advisor\'s commission','They are moments when clients experience the practical value of their protection','They eliminate the need for insurance','They automatically generate referrals'],1,'Claims demonstrate the real value of protection.'),
    Q('What is a living risk profile?',['A static policy document','An evolving record of the client\'s risk posture and protection needs','A premium receipt','A marketing brochure'],1,'A living risk profile evolves as the client\'s circumstances change.'),
    Q('What is the primary basis for ethical cross-selling?',['Sales targets','Commission','Newly identified client needs and protection gaps','Competitor pricing'],2,'Cross-selling should be based on newly identified needs, not targets.'),
    Q('What is the ultimate objective of the CoverScore relationship model?',['Sell as many policies as possible','Build lifetime advisory relationships based on continuous value','Contact clients only during renewal','Avoid reassessing clients'],1,'Lifetime relationships based on continuous value.')
  ]),
  hScript('Client Retention, Referrals & Lifetime Advisory Relationships',[
    'Welcome to Lesson Seven of CCA 106. In our previous lesson, we learned how to turn advisory insight into business conversion. But winning the business is not the end of the relationship. It is the beginning. In this lesson, we will explore how to retain clients, generate referrals, and build lifetime advisory relationships. The CoverScore advisor does not want to be remembered only when a policy is due for renewal. We want to become the person clients call whenever something changes.',
    'Traditional insurance selling often ends with a policy. The CoverScore relationship does not. After protection is implemented, the advisor stays engaged. We review. We reassess. We identify changes. We help the client improve. And we continue adding value. This is how a transaction becomes a relationship.',
    'The CoverScore Lifetime Advisory Cycle has eight stages. Connect. Assess. Advise. Protect. Engage. Review. Improve. And advocate. Notice that protection is only one part of the relationship. The real objective is continuous risk improvement.',
    'The first ninety days after implementation are critical. In the first thirty days, confirm that everything was implemented correctly. At sixty days, check satisfaction and understanding. At ninety days, conduct a value review. Ask: "What has changed since we completed your assessment?" This simple question can uncover new risks before they become major problems.',
    'The annual review should not be a simple renewal reminder. It should be a risk reassessment. What assets have changed? What people have changed? Has the business expanded? Has revenue increased? Have new liabilities emerged? Has technology changed? Is the existing protection still adequate? The goal is simple: Make sure the client\'s protection evolves as the client\'s life or business evolves.',
    'Claims are moments of truth. When something goes wrong, the client needs more than a policy. They need support. The advisor should help the client understand the process and stay engaged. After the claim, ask: "What have we learned from this event?" The goal is to turn a difficult experience into an opportunity to improve the client\'s risk posture.',
    'The best referrals come from trust and value. Do not ask "Do you know anyone who needs insurance?" Instead, connect the referral to the value you have created. You might say: "You mentioned how useful it was to see your risks mapped out clearly. Is there anyone in your network who might benefit from the same exercise?" The client is not being asked to sell insurance. They are being invited to introduce someone who may benefit from the same value.',
    'A name is useful. An introduction is better. When a satisfied client introduces you to someone directly, trust transfers. For example: "I\'d like to introduce you to my advisor. He recently helped us identify some risks in our business, and I thought you might benefit from a similar conversation." That is a warm introduction. It creates a much stronger starting point than a cold call.',
    'Some clients become more than customers. They become advocates. They may refer prospects, provide testimonials, introduce you to their business network, invite you to speak to their association, or recommend you to their community. Advocacy is earned through consistent value. The question is not "How many referrals can I get?" The question is "How many clients have I helped enough that they want others to experience the same value?"',
    'A client\'s risk profile should never be treated as a static document. It should evolve. Imagine a client begins with a risk score of 42. After implementing priority recommendations, the score improves to 61. Later, after another review, it reaches 78. Now the conversation is no longer about how much premium the client has paid. It is about how much better protected the client has become. That is the power of continuous risk advisory.'
  ]),
  hWorkbook([
    {t:'12-Month Retention Plan',i:'Choose one client and create a 12-month engagement calendar.',p:['Month 1: Implementation confirmation','Month 3: Value review','Month 6: Risk change conversation','Month 9: Protection gap check','Month 12: Full reassessment','For each: objective, risk question, value to provide, next action']},
    {t:'The Referral Conversation',i:'Practice asking for a referral naturally.',p:['Identify a satisfied client from your experience','What value have you delivered to them?','Write your referral request using Value, Evidence, Invitation','Request a warm introduction, not just a name','Write the WhatsApp introduction you want the client to send']}
  ]),
  hCase('The 18-Month Client','A client has been with you for 18 months. The client has renewed one policy, acquired new equipment, increased revenue by 40%, hired 20 new employees, opened a second location, and has not completed a new CoverScore assessment. The client recently referred one business owner to you.',[
    'Conduct a relationship health check — Green, Amber, or Red?',
    'Identify new risk triggers from the changes listed.',
    'Recommend a new CoverScore Assessment and explain why.',
    'Write a referral thank-you message and request a warm introduction to another prospect.',
    'Position the client as a potential CoverScore Advocate.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'30-60-90 Retention Model Reference',description:'Quick reference for post-implementation client engagement stages'},
    {url:'#',type:'doc',title:'Client Risk Review Calendar Template',description:'Annual planning template for continuous risk review'}
  ])
);

C6[8] = L(
  hContent('Business Development Simulation & Module Assessment',[
    'Demonstrate the complete CoverScore business development process',
    'Apply all 7 lessons of CCA 106 to a realistic client scenario',
    'Interpret a CoverScore Assessment and convert findings into actionable recommendations',
    'Build a retention and referral strategy for long-term client relationships'
  ],[
    SE('The Business Development Master Cycle','The entire CCA 106 methodology summarised: 1 — Identify the right prospect, 2 — Research before approaching, 3 — Prioritise why the prospect matters, 4 — Engage with a risk conversation, 5 — Discover the prospect\'s circumstances, 6 — Assess via CoverScore, 7 — Interpret risk profile and gaps, 8 — Advise on recommendations, 9 — Protect with appropriate solutions, 10 — Retain through continuous value, 11 — Advocate for referrals and relationships.'),
    SE('PrimeCraft Manufacturing Ltd — Capstone Case','PrimeCraft Manufacturing Limited is a Lagos-based manufacturer with 110 employees, annual revenue of approximately $12 million, two production facilities, a central warehouse, production machinery, eight delivery vehicles, an ERP system, and recent export activity. Over three years, revenue has grown 60%, employees increased from 70 to 110, a second facility was acquired, new machinery purchased, and digital systems introduced. The insurance programme has not had a comprehensive risk review in three years.'),
    T('PrimeCraft CoverScore Assessment',['Risk Pillar','Score','Status'],[
      ['Property & Assets','48','High Exposure'],
      ['Business Interruption','39','Very High Exposure'],
      ['Supply Chain','44','High Exposure'],
      ['People & Workforce','62','Moderate'],
      ['Liability','51','Moderate-High'],
      ['Cyber & Data','46','High Exposure'],
      ['Fleet & Mobility','68','Moderate'],
      ['Financial Risk','64','Moderate']
    ]),
    SE('The Advisory Conversion Challenge','Your task: Take PrimeCraft through the complete CoverScore business development journey. Identify risk triggers. Research the prospect. Start a risk conversation. Convert to assessment. Interpret the findings. Prioritise protection gaps. Present recommendations. Convert insight into action. Build a retention plan. Generate a referral. Demonstrate mastery of the CoverScore Business Development Methodology.'),
    C('The CoverScore advisor does not chase customers. The advisor identifies risk, creates insight, creates value, and earns the right to be the advisor the client calls first.')
  ],[
    'The Business Development Master Cycle integrates all 11 stages from identification through to advocacy',
    'PrimeCraft Manufacturing is a realistic capstone case with multiple risk triggers and protection gaps',
    'The assessment reveals critical exposures in Business Interruption, Property, Supply Chain, and Cyber',
    'The advisor must demonstrate prospecting, discovery, assessment conversion, interpretation, recommendation, retention, and referral skills'
  ]),
  hQuiz([
    Q('What is the primary purpose of the CoverScore advisor?',['Sell the cheapest insurance policy','Identify, understand, and help clients manage risk','Replace insurance companies','Focus only on policy renewals'],1,'The advisor\'s primary purpose is risk advisory.'),
    Q('What should come before recommending a solution?',['Product presentation','Risk discovery and understanding','Premium negotiation','Policy issuance'],1,'Discovery and understanding must come first.'),
    Q('What is the purpose of prospect research?',['To find reasons not to contact the prospect','To understand the prospect\'s business and potential risk environment','To prepare a generic sales pitch','To avoid asking questions'],1,'Research enables relevant, informed engagement.'),
    Q('Which is the strongest CoverScore prospect?',['A business with no changing risks','A business experiencing significant growth and operational change','A business that refuses all engagement','A random contact list'],1,'Growth and change create risk advisory opportunities.'),
    Q('What is the CoverScore approach to starting a prospect conversation?',['Lead with product pricing','Lead with a risk insight relevant to the prospect','Immediately ask for a policy purchase','Send a generic brochure'],1,'Lead with risk relevance, not with products.'),
    Q('What is the purpose of discovery?',['To talk continuously','To understand the client\'s circumstances, risks, and priorities','To avoid discussing risk','To immediately quote'],1,'Discovery builds understanding of risk.'),
    Q('Which question best reflects the CoverScore discovery approach?',['"How much insurance do you want?"','"What has changed most significantly in your business?"','"Which insurer do you currently use?"','"Can I send you a quotation?"'],1,'The "what has changed" question is central to CoverScore discovery.'),
    Q('What is a risk object?',['A sales target','Something of value or importance that can be exposed to risk','A premium receipt','A marketing campaign'],1,'Risk objects are what the assessment protects.'),
    Q('What should an advisor do with a risk score?',['Simply read the number','Interpret what the score means in the client\'s context','Use it to guarantee claims','Use it to determine commission'],1,'Interpretation is the critical advisory skill.'),
    Q('What is the ultimate goal of the CoverScore business development process?',['Maximise one-time sales','Build long-term risk advisory relationships','Sell the highest-priced product','Replace all competitors'],1,'Long-term relationships based on continuous value.')
  ]),
  hScript('Business Development Simulation & Module Assessment',[
    'Welcome to the final lesson of CCA 106. This is the capstone — where everything comes together. Over the past seven lessons, you have learned how to identify the ideal client, use risk intelligence, build a prospecting system, start risk conversations, convert prospects into assessments, turn insight into business, and build lifetime relationships. Now you will demonstrate all of it in a realistic business development simulation.',
    'The CoverScore Business Development Master Cycle has 11 stages. Identify the right prospect. Research before approaching. Prioritise why the prospect matters. Engage with a risk conversation. Discover the prospect\'s circumstances. Assess via CoverScore. Interpret risk profile and protection gaps. Advise on recommendations. Protect with appropriate solutions. Retain through continuous value. And advocate for referrals and relationships.',
    'Your capstone case is PrimeCraft Manufacturing Limited — a Lagos-based manufacturer with 110 employees, $12 million in annual revenue, two production facilities, and significant recent growth. Over three years, revenue has grown 60%, employees increased from 70 to 110, a second facility was acquired, new machinery purchased, and digital systems introduced. But the insurance programme has not had a comprehensive risk review in three years.',
    'PrimeCraft\'s CoverScore Assessment reveals significant exposures. Business Interruption scores 39 — Very High. Property and Assets score 48 — High. Supply Chain scores 44 — High. Cyber and Data scores 46 — High. The risk fingerprint tells a clear story: a company that has grown rapidly while its risk management framework has not kept pace. This is exactly the type of situation where a CoverScore advisor creates the most value.',
    'Your task is to take PrimeCraft through the complete journey. First, prepare your prospect intelligence brief. Why is PrimeCraft a good prospect? What are the major risk triggers? Who should you target? What is your business development hypothesis? Second, write your outreach message. It must demonstrate research, reference a relevant business change, introduce risk, and avoid generic sales language.',
    'Third, conduct the discovery conversation. Explore business growth, operations, assets, people, supply chain, technology, business interruption, liability, and existing protection. Listen for the trigger: the Managing Director reveals they haven\'t reviewed their insurance since before the second facility was acquired. That is your opportunity. Fourth, convert to assessment: explain why a structured CoverScore assessment adds value.',
    'Fifth, interpret the assessment findings. Do not simply read the scores. Explain what they mean in business terms. "Your overall score indicates moderate-to-high risk exposure, with the greatest concerns around business interruption, property and assets, supply chain, and cyber. These risks are connected to the growth your business has experienced." Sixth, prioritise the protection gaps. Which three deserve immediate attention?',
    'Seventh, present your recommendations using the Risk to Impact to Priority to Recommendation to Next Step structure. Eighth, convert insight into business. Identify the appropriate protection solutions — but always connect each solution back to an identified risk. Ninth, handle objections professionally. When the MD says "We already have a broker," respond without attacking the existing relationship.',
    'Tenth, build your retention strategy. Create a six-month engagement plan. Eleventh, ask for a referral naturally. When the MD says "This process has helped us see risks we had not really thought about," that is your moment. Connect your ask to the value delivered. And twelfth, reflect on what you would do differently if managing this client for the next three years.',
    'The CoverScore advisor does not chase customers. The advisor identifies risk. Creates insight. Creates value. Value creates trust. Trust creates relationships. Relationships create retention. Great relationships create referrals. And referrals create the next generation of CoverScore opportunities. That is the CoverScore Business Development Methodology. CCA 106 is now complete.'
  ]),
  hWorkbook([
    {t:'Capstone Deliverable',i:'Complete the PrimeCraft Manufacturing Business Development Portfolio.',p:['Prospect Intelligence Brief — 1 page','Outreach Message — email or WhatsApp','Discovery Plan — 10 questions','Risk Object Map — at least 15 risk objects','CoverScore Interpretation — written analysis','Protection Gap Analysis — top 5 gaps','Priority Recommendation Plan — Immediate, High, Strategic','Business Conversion Plan — solutions linked to risks','Objection Handling Response — existing broker objection','Client Retention Plan — 6-month schedule','Referral Strategy — request + warm introduction script','Advisor Reflection — "What would I do differently over 3 years?"']},
    {t:'Module 6 Final Assessment',i:'Complete the 30-question certification-style assessment.',p:['Section A — Questions 1-20: Knowledge Assessment (2 marks each = 40 marks)','Section B — Questions 21-25: Scenario Questions (4 marks each = 20 marks)','Section C — Questions 26-30: Capstone Case Analysis (8 marks each = 40 marks)','Total: 100 marks. Pass mark: 80%. Review the lesson content before attempting.'],t:'Assessment'}
  ]),
  hCase('PrimeCraft Manufacturing — Capstone Simulation','PrimeCraft Manufacturing Limited has 110 employees, $12 million revenue, two production facilities, a central warehouse, production machinery, eight delivery vehicles, ERP systems, recent export activity, and significant growth over three years. Their CoverScore is 54/100 with critical exposures in Business Interruption (39), Property & Assets (48), Supply Chain (44), and Cyber & Data (46). The MD believes they are adequately insured because "we have always had insurance."',[
    'Prepare your prospect intelligence brief — why is PrimeCraft a strong opportunity? Identify at least 5 reasons.',
    'Write your outreach message — must demonstrate research, reference change, introduce risk, avoid generic sales language.',
    'Prepare 10 discovery questions covering business growth, operations, assets, people, supply chain, technology, BI, liability, and existing protection.',
    'Interpret the CoverScore assessment — explain what the scores mean in business terms, not just technical numbers.',
    'Prioritise the top 5 protection gaps and present recommendations using the Risk-Impact-Priority-Recommendation-Next Step structure.',
    'Write your response when the MD says "We already have an insurance broker. I don\'t want to disrupt that relationship."',
    'Create a 6-month client engagement plan and a natural referral request.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Business Development Master Cycle Reference',description:'Complete 11-stage reference for the CoverScore business development process'},
    {url:'#',type:'doc',title:'PrimeCraft Case Study Brief',description:'Full case study details including financials, risk data, and assessment outputs for the capstone simulation'}
  ])
);



// ═══════════════════════════════════════════════════════════════════
// C7 — CCA 107: Professional Risk Advisory Practice & Client Portfolio Management
// ═══════════════════════════════════════════════════════════════════

const C7 = {};
const C8 = {};

C7[1] = L(
  hContent('The Professional CoverScore Advisor',[
    'Define the role of a professional CoverScore Advisor',
    'Explain the difference between an insurance seller and a risk advisor',
    'Apply the five pillars of professional CoverScore practice',
    'Demonstrate professional integrity and ethical conduct',
    'Protect client confidentiality',
    'Recognise conflicts of interest',
    'Understand the limits of your professional competence',
    'Manage client expectations accurately',
    'Communicate risk professionally',
    'Understand the importance of documentation and accountability'
  ],[
    SE('The Advisor\'s New Role','A CoverScore Advisor is not merely a distributor of insurance products. The advisor is a professional who helps clients understand and manage uncertainty. The advisor\'s work sits at the intersection of risk, insurance, business, finance, people, operations, technology, and client decision-making. The advisor\'s role is therefore broader than policy placement.'),
    T('Insurance Seller vs CoverScore Advisor',['Dimension','Insurance Seller','CoverScore Advisor'],[
      ['Starting Point','Product','Risk environment'],
      ['Focus','Price and transaction','Insight and advice'],
      ['Question','What policy do you need?','What could go wrong?'],
      ['Approach','Transactional','Consultative and continuous'],
      ['Measure','Policies sold','Protection improved']
    ]),
    T('The Five Pillars of Professional Practice',['Pillar','Meaning','Application'],[
      ['Competence','Continuously develop professional knowledge','Know your strengths; recognise your limits'],
      ['Integrity','Be honest and transparent','Need first; product second'],
      ['Confidentiality','Protect information entrusted by clients','Not yours to share'],
      ['Objectivity','Base recommendations on client needs','Risk \u2192 Impact \u2192 Priority \u2192 Recommendation'],
      ['Accountability','Take responsibility for professional actions','What did you recommend, why, and what was decided?']
    ]),
    SE('Competence: Know What You Know','Professionalism begins with competence. A CoverScore Advisor should continuously develop knowledge in risk management, insurance, client advisory, industry risks, claims, technology, and regulatory requirements. But competence also means recognising your limitations. If a client asks for specialist tax advice, you should not pretend to be a tax expert. Knowing when to involve another professional is not weakness \u2014 it is professionalism.'),
    SE('Integrity: Do What Is Right','Integrity means putting the client\'s legitimate interests ahead of immediate financial incentive. A professional advisor does not misrepresent coverage, hide important exclusions, create false urgency, guarantee claims outcomes, recommend unnecessary products, exaggerate risk, or manipulate assessment results. Every recommendation should answer: "Why is this relevant to the client?" Need comes first. Product comes second.'),
    SE('Confidentiality: Protect the Trust','During a CoverScore assessment, clients may disclose financial information, business revenue, employee information, assets, security arrangements, contracts, operational vulnerabilities, and personal information. This information must be handled responsibly. Confidentiality is not simply a rule \u2014 it is part of the trust relationship between advisor and client.'),
    SE('Objectivity: Advise, Don\'t Push','Objectivity means separating what the client needs from what the advisor wants to sell. The CoverScore Advisor asks: What is the risk? What is the potential impact? How urgent is it? What options are available? What should the client prioritise? This approach keeps the conversation focused on the client\'s reality and creates stronger trust.'),
    SE('Accountability: Document Your Advice','Professional advisors document important client interactions. You should be able to answer: What did I recommend? Why did I recommend it? What information informed the recommendation? What did the client decide? What actions remain outstanding? When should we review again? Documentation creates continuity and protects both the client and the advisor.'),
    SE('Professional Boundaries','A professional advisor knows when to advise and when to refer. You should not provide legal advice outside your competence, provide tax advice without appropriate expertise, guarantee investment returns, guarantee insurance claims, or make promises that depend on decisions made by another party. Instead, the CoverScore Advisor acts as a risk intelligence coordinator \u2014 identify the issue, explain risk implications, and bring in the right professional expertise.'),
    SE('Managing Client Expectations','One of the fastest ways to lose client trust is to promise what you cannot guarantee. When a client asks "Will my claim definitely be paid?", avoid saying "Don\'t worry, your claim will definitely be paid." Instead, respond professionally: "Based on the policy terms, this appears to be an area that may respond to the loss. The insurer will need to assess the claim in accordance with the policy terms and conditions."'),
    T('The CoverScore Professional Workflow',['Stage','Purpose'],[
      ['Prepare','Prepare before the engagement'],
      ['Discover','Discover the client\'s risk environment'],
      ['Document','Document important information'],
      ['Assess','Assess the risks'],
      ['Interpret','Interpret the findings'],
      ['Advise','Advise the client'],
      ['Implement','Implement appropriate solutions'],
      ['Monitor','Monitor changes'],
      ['Review','Review regularly'],
      ['Improve','Continuously improve the client\'s protection']
    ]),
    C('A policy is a transaction. A risk advisory relationship is a profession.')
  ],[
    'A CoverScore Advisor helps clients understand, prioritise, and manage risk professionally',
    'The five pillars are Competence, Integrity, Confidentiality, Objectivity, and Accountability',
    'Advisors must recognise professional boundaries and manage client expectations accurately',
    'Documentation and accountability are essential to professional practice'
  ]),
  hQuiz([
    Q('What is the primary role of a professional CoverScore Advisor?',['Sell as many policies as possible','Help clients understand and manage risk','Guarantee insurance claims','Replace insurance companies'],1,'The advisor\'s role is to help clients understand and manage risk.'),
    Q('Which is NOT one of the five pillars of professional CoverScore practice?',['Competence','Integrity','Commission maximisation','Accountability'],2,'Commission maximisation is not a pillar of professional practice.'),
    Q('What should an advisor do when a matter is outside their expertise?',['Pretend to know','Give the client an estimate','Involve an appropriately qualified professional','Ignore the issue'],2,'Professionalism means involving appropriate expertise when needed.'),
    Q('Should an advisor manipulate a client\'s CoverScore to improve sales conversion?',['Yes','Only for important clients','No','Only with client approval'],2,'Manipulating assessments violates professional integrity.'),
    Q('What should recommendations be based on?',['Commission','Client needs and identified risks','Product availability only','Sales targets'],1,'Recommendations must be based on client needs and identified risks.'),
    Q('Why is confidentiality important?',['It protects client trust and sensitive information','It increases commission','It guarantees claims','It reduces competition'],0,'Confidentiality protects client trust and sensitive information.'),
    Q('Why is documentation important?',['It creates accountability and continuity','It replaces client meetings','It guarantees renewal','It eliminates risk'],0,'Documentation creates accountability and continuity.'),
    Q('Which statement best describes professional CoverScore practice?',['Sell first and explain later','Recommend everything possible','Understand risk, advise objectively, and continuously improve protection','Focus only on premium'],2,'Professional practice means understanding risk, advising objectively, and continuously improving protection.')
  ]),
  hScript('The Professional CoverScore Advisor',[
    'Welcome to Lesson 1 of CCA 107. Throughout the CoverScore Academy journey, you have learned how to understand risk, conduct assessments, identify protection gaps, provide recommendations, and develop business relationships. But professional risk advisory requires more than knowledge. It requires trust.',
    'When clients work with you, they share information about their finances, assets, employees, families, businesses, vulnerabilities, and future plans. That information creates a responsibility. A professional CoverScore Advisor must operate to a higher standard.',
    'A traditional insurance salesperson may begin with a product. The CoverScore Advisor starts differently. The advisor begins with the client\'s risk environment. What could go wrong? What would be affected? How serious would the impact be? What protection already exists? Where are the gaps?',
    'Professional CoverScore practice rests on five essential pillars. Competence \u2014 you must understand your profession and continuously improve your knowledge. Integrity \u2014 you must be honest and do what is right. Confidentiality \u2014 you must protect information entrusted to you. Objectivity \u2014 your recommendations should be based on client needs. Accountability \u2014 you must be able to explain what you recommended and why.',
    'Professionalism begins with competence, but also means recognising your limitations. When a matter is outside your expertise, involve the right professional. Integrity means putting the client\'s interests ahead of your immediate financial incentive. Every recommendation should answer: "Why is this relevant to the client?"',
    'During a CoverScore assessment, clients may disclose sensitive information. This information must be handled responsibly. Confidentiality is not simply a rule \u2014 it is part of the trust relationship. Objectivity means separating what the client needs from what the advisor wants to sell.',
    'One of the fastest ways to lose client trust is to promise what you cannot guarantee. When a client asks about claims, respond professionally and accurately. Professionalism means being accurate \u2014 even when certainty is uncomfortable.',
    'Professional CoverScore practice follows a disciplined workflow: Prepare, Discover, Document, Assess, Interpret, Advise, Implement, Monitor, Review, and continuously improve. This transforms risk advisory from an occasional transaction into a professional practice.',
    'A CoverScore Advisor is trusted with more than a client\'s insurance needs. Your greatest asset is not your ability to sell a policy. It is your ability to become the professional your client trusts to call first when something changes. That is the standard of the Professional CoverScore Advisor.'
  ]),
  hWorkbook([
    {t:'The Professional Decision Challenge',i:'For each scenario, explain what you would do and why.',p:['Scenario 1: A client asks you not to disclose a previous major claim. Explain your response.','Scenario 2: A client asks "Can you guarantee this claim will be paid?" Explain how you would respond.','Scenario 3: A manufacturing client asks you to certify whether a machine is technically safe. Explain your response.','Scenario 4: A friend asks you to disclose confidential client information. Explain your response.','Scenario 5: Two products \u2014 Product A is more relevant but lower commission, Product B is less relevant but higher commission. What do you recommend and why?']},
    {t:'Five Pillars Self-Assessment',i:'For each pillar, rate your current strength and identify one improvement action.',p:['Competence: Current strength? What will you do to improve?','Integrity: Current strength? What will you do to improve?','Confidentiality: Current strength? What will you do to improve?','Objectivity: Current strength? What will you do to improve?','Accountability: Current strength? What will you do to improve?']}
  ]),
  hCase('The Professional\'s Dilemma','A long-standing client calls you. They have just acquired a competing business and merged operations. They assume their existing insurance policies still apply. They also mention they have been dealing directly with an insurer for some additional covers and want your opinion on whether they are adequately protected.',[
    'Identify the professional issues in this situation.',
    'What risks may the client be unaware of after the acquisition?',
    'How should you approach the conversation without alarming the client?',
    'What documentation should you prepare before the meeting?',
    'How would you demonstrate the five pillars in this engagement?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'The CoverScore Professional Standard Reference',description:'One-page guide to the five pillars with practice examples'},
    {url:'#',type:'doc',title:'Professional Practice Self-Assessment Worksheet',description:'Self-assessment tool for evaluating your professional advisory practice'}
  ])
);

C7[2] = L(
  hContent('Managing the CoverScore Client Journey',[
    'Explain the CoverScore Client Journey',
    'Identify the major stages of the client lifecycle',
    'Understand the advisor\'s responsibility at each stage',
    'Manage client onboarding professionally',
    'Convert assessment findings into actionable recommendations',
    'Coordinate implementation and follow-up',
    'Conduct post-implementation reviews',
    'Identify risk changes that require reassessment',
    'Manage renewals as strategic review opportunities',
    'Build long-term client relationships beyond individual transactions'
  ],[
    SE('The Client Journey Never Ends','A CoverScore Assessment is not the end of the advisor\'s work. It is the beginning of the client\'s advisory journey. A client may begin as a prospect, become an assessment client, then a protection client, and finally a long-term advisory relationship. The objective is not simply to win the client \u2014 it is to create, deliver, and continuously demonstrate value.'),
    T('The 12-Stage CoverScore Client Journey',['Stage','Purpose','Advisor\'s Responsibility'],[
      ['Attract','Find the right client through risk intelligence','Identify risk triggers and change signals'],
      ['Engage','Start with relevance, not a sales pitch','Demonstrate understanding of client situation'],
      ['Discover','Understand the client\'s reality','Ask questions, listen, probe, identify risk objects'],
      ['Assess','Turn information into risk intelligence','Complete CoverScore Assessment'],
      ['Interpret','Make the risk intelligence understandable','Explain meaning, drivers, impact, and priority'],
      ['Advise','Connect risk to action','Provide prioritised recommendations'],
      ['Decide','The client owns the decision','Explain implications of each option'],
      ['Implement','Turn advice into action','Coordinate documentation, quotations, underwriting'],
      ['Monitor','Risk does not stand still','Watch for meaningful changes'],
      ['Review','Don\'t wait for renewal','Conduct strategic risk conversation'],
      ['Improve','Continuous risk improvement','Show measurable progress over time'],
      ['Advocate','Value creates referrals','Ask "Who else might benefit from this?"']
    ]),
    SE('The Journey Is a Cycle','The CoverScore Client Journey is not a one-time process. It is a continuous cycle. A client grows. The risk environment changes. New assets appear. New employees join. New technology is introduced. The advisor returns to discovery. The client is reassessed. This transforms an insurance transaction into a long-term advisory relationship.'),
    SE('Common Client Journey Failure Points','Many client relationships fail not because the advisor lacks technical knowledge, but because the journey is poorly managed. Common failures include: poor onboarding, no follow-up after assessment, unclear recommendations, delayed implementation, no documentation, no risk monitoring, and renewal-only relationships.'),
    SE('The Advisor\'s Client Journey Checklist','At every stage, ask five questions: What does the client need now? What is the next action? Who owns the action? When is it due? How will I demonstrate value? These five questions create accountability and prevent passive relationships.'),
    C('Don\'t manage policies. Manage the client\'s evolving risk journey.')
  ],[
    'The CoverScore Client Journey has 12 stages from Attract to Advocate',
    'The journey is a continuous cycle, not a one-time process',
    'Each stage has a purpose, expected outcome, and advisor responsibility',
    'Common failures include poor onboarding, no follow-up, and renewal-only relationships'
  ]),
  hQuiz([
    Q('When does the CoverScore Client Journey begin?',['When the client buys a policy','When the client submits a claim','Before the first transaction, during prospect engagement','At renewal'],2,'The journey begins before the first transaction.'),
    Q('What is the primary purpose of the Discovery stage?',['To sell immediately','To understand the client\'s risk environment','To collect commission','To issue a policy'],1,'Discovery is about understanding the client\'s risk environment.'),
    Q('What should happen after a CoverScore Assessment?',['The advisor should disappear until renewal','The findings should be interpreted and translated into recommendations','The score should be changed to satisfy the client','The client should automatically buy every recommended product'],1,'Findings must be interpreted and translated into recommendations.'),
    Q('Who ultimately makes the protection decision?',['The advisor','The insurer','The client','The regulator'],2,'The client makes the final decision.'),
    Q('Why should advisors monitor clients after implementation?',['Risk environments change','To increase premiums automatically','To sell unnecessary products','To avoid speaking with clients'],0,'Risk environments constantly change.'),
    Q('What should a client review focus on?',['Only renewal dates','Changes in the client\'s risk environment','Only commission','Only competitor pricing'],1,'Reviews should focus on changes in the risk environment.'),
    Q('What creates client advocacy?',['Pressure','Discounts alone','Consistent delivery of meaningful value','Frequent sales calls'],2,'Consistent value delivery creates advocacy.'),
    Q('Which best describes the CoverScore Client Journey?',['A one-time insurance sales process','A continuous cycle of risk discovery, advice, protection, monitoring, and improvement','A claims management process only','A renewal checklist'],1,'The journey is a continuous cycle.')
  ]),
  hScript('Managing the CoverScore Client Journey',[
    'Welcome to Lesson 2 of CCA 107. A CoverScore Assessment is not the end of the advisor\'s work \u2014 it is the beginning. Your responsibility is not simply to win a client, complete an assessment, and disappear until renewal. A professional advisor stays connected to the client\'s changing risk environment.',
    'The CoverScore Client Journey has twelve interconnected stages: Attract, Engage, Discover, Assess, Interpret, Advise, Decide, Implement, Monitor, Review, Improve, and Advocate. Each stage has a purpose and a professional responsibility.',
    'The journey begins with Attract \u2014 finding clients whose risk environment may have changed. Then Engage \u2014 starting with relevance. Then Discover \u2014 understanding the client\'s business, people, assets, operations, dependencies, and vulnerabilities.',
    'Discovery leads to Assessment, then Interpretation, then Advice. The client makes the decision. Then Implementation \u2014 turning advice into protection. After implementation comes Monitoring, because risk does not stand still.',
    'The ultimate objective is Improvement and Advocacy. When clients experience genuine value, they refer others. The best referral conversation begins with: "Who else in your network might benefit from understanding their risks?"',
    'Many client relationships fail because the journey is poorly managed. Every stage must have a clear next action. The goal is to become the professional the client trusts to help them navigate risk over time.'
  ]),
  hWorkbook([
    {t:'The Client Journey Mapping Challenge',i:'You have just completed a CoverScore Assessment for BrightPath Private Hospital with 75 employees, 40 beds, a diagnostic laboratory, a pharmacy, medical equipment, patient records, an ambulance, and a digital hospital management system.',p:['Month 1: Assessment presentation \u2014 what will you cover?','Month 2: Protection recommendations \u2014 how will you present them?','Month 3: Implementation follow-up \u2014 what will you track?','Month 4: Outstanding gap review \u2014 what gaps remain?','Month 6: Risk change check \u2014 what questions will you ask?','Month 9: Client value review \u2014 how will you demonstrate value?','Month 12: Full reassessment \u2014 what will you compare?']},
    {t:'Journey Failure Analysis',i:'Analyse a client relationship you have managed. Which stages of the journey were handled well and which were neglected?',p:['Which stages did you execute well?','Which stages were weak or missing?','What was the impact on the client relationship?','What will you do differently next time?']}
  ]),
  hCase('The Client You Lost','A CoverScore Advisor completed an assessment for a manufacturing company. The advisor delivered the report, recommended several solutions, obtained quotations, and issued two policies. After that, the advisor had no contact with the client for 11 months. At renewal, the advisor discovered the client had acquired a new warehouse, increased inventory by 40%, added 25 employees, purchased new machinery, started exporting, and experienced a minor machinery breakdown \u2014 all unknown to the advisor.',[
    'Which stages of the client journey failed?',
    'What should the advisor have done differently?',
    'What risk changes should have triggered a reassessment?',
    'How could the advisor have created more value?',
    'What should the advisor do now to recover the relationship?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'CoverScore Client Journey Reference Card',description:'One-page guide to all 12 journey stages with advisor actions'},
    {url:'#',type:'doc',title:'Client Journey Planning Template',description:'Template for managing a client through all 12 journey stages'}
  ])
);

C7[3] = L(
  hContent('Building and Managing a Client Risk Portfolio',[
    'Define a CoverScore Client Risk Portfolio',
    'Explain why portfolio management matters',
    'Segment clients according to risk and advisory priority',
    'Distinguish between client value and risk complexity',
    'Build a client portfolio dashboard',
    'Prioritise client actions',
    'Identify dormant, at-risk, and high-opportunity clients',
    'Track protection gaps across a portfolio',
    'Manage client concentration risk',
    'Create a structured portfolio review rhythm',
    'Use CRM and CoverScore intelligence to manage multiple relationships',
    'Develop a portfolio action plan'
  ],[
    SE('From Client Management to Portfolio Management','As your advisory practice grows, you may have 20, 50, or 100 clients across different industries. Each client has different risks, priorities, protection gaps, renewal dates, and advisory needs. The challenge becomes not just "How do I serve this client?" but "How do I consistently manage every client relationship without losing visibility, quality, or relevance?" This is the purpose of Client Risk Portfolio Management.'),
    T('What Is a Client Risk Portfolio?',['Dimension','Question It Answers'],[
      ['Client','Who are they and what do they do?'],
      ['Risk','What exposures exist and how severe are they?'],
      ['Protection','What protection is in place and where are the gaps?'],
      ['Action','What recommendations and follow-ups remain outstanding?'],
      ['Relationship','How healthy is the engagement and satisfaction?']
    ]),
    T('Client Portfolio Segmentation',['Segment','Description','Advisor Focus'],[
      ['Strategic','High importance, complex risk, long-term value','Proactive management'],
      ['Growth','Strong potential for deeper advisory engagement','Develop relationship'],
      ['Maintain','Stable, require consistent service','Regular monitoring'],
      ['Reactivate','Dormant, disengaged, or inactive','Renewed attention']
    ]),
    SE('Risk-Based Prioritisation','Client value alone should not determine priority. Risk urgency also matters. A large commercial client with a stable risk profile may need less urgent attention than a smaller business that has just suffered a major loss. A professional portfolio considers both relationship importance and risk urgency.'),
    SE('Portfolio Dashboard','A professional advisor should know at a glance: how many active clients, which clients have high-risk exposures, which protection gaps remain open, which assessments are due, which reviews are overdue, which recommendations have not been implemented, and which relationships have become dormant.'),
    SE('Identifying At-Risk Clients','A client may become at risk because their business has changed significantly, a critical recommendation remains unimplemented, their assessment is outdated, they have experienced a major loss, communication has broken down, or they have expressed dissatisfaction. The professional advisor responds early.'),
    SE('Protection Gap Portfolio View','One of the most powerful uses of portfolio management is identifying patterns across clients. Multiple manufacturing clients may have BI exposures. Several hospitals may have cyber concerns. A portfolio-level view helps identify recurring risk themes and improve advisory strategy.'),
    SE('Client Concentration Risk','What happens if one client represents a very large percentage of your revenue? Or if several major clients operate in the same industry? This is client concentration risk. A healthy advisory practice diversifies its portfolio to reduce dependence on a small number of relationships.'),
    T('Portfolio Review Rhythm',['Frequency','Focus'],[
      ['Daily','Urgent client actions'],
      ['Weekly','Active client engagements'],
      ['Monthly','Portfolio health review'],
      ['Quarterly','Risk trends and opportunities'],
      ['Annual','Overall portfolio strategy']
    ]),
    C('A growing client list is not the same as a healthy advisory portfolio.')
  ],[
    'A Client Risk Portfolio is a structured view of clients, risks, protection, actions, and relationships',
    'Segmentation helps allocate attention according to client needs and risk urgency',
    'Portfolio dashboards identify at-risk clients, protection gaps, and concentration risks',
    'A regular review rhythm prevents reactive management'
  ]),
  hQuiz([
    Q('What is a Client Risk Portfolio?',['A list of policies only','A structured view of clients, risks, protection, actions, and relationships','A list of premium payments','A claims register'],1,'A portfolio is a structured view of clients, risks, protection, actions, and relationships.'),
    Q('Why is portfolio segmentation important?',['It allows the advisor to ignore small clients','It helps allocate attention according to client and risk needs','It guarantees higher commission','It replaces client reviews'],1,'Segmentation helps allocate attention according to client and risk needs.'),
    Q('What should determine portfolio priority?',['Revenue alone','Risk urgency and client needs, among other factors','The client\'s age','Renewal dates only'],1,'Priority should consider risk urgency and client needs.'),
    Q('Which is a portfolio risk alert?',['A major business expansion','An outdated assessment','A critical unimplemented recommendation','All of the above'],3,'All are potential portfolio risk alerts.'),
    Q('What does client concentration risk mean?',['Having too many products','Depending excessively on a small number of clients or revenue sources','Having too many employees','Having a high CoverScore'],1,'Concentration risk is excessive dependence on a small number of clients.'),
    Q('What makes a portfolio healthy?',['A large number of clients','High premium volume only','Engaged clients, current risk info, active gap management, healthy relationships','Many policies'],2,'A healthy portfolio has engaged clients, current risk info, active gap management, and healthy relationships.'),
    Q('A client opens a new facility. What should the advisor consider?',['Ignoring it until renewal','Assessing whether the change creates new risk exposures','Cancelling the existing policy','Automatically increasing every policy'],1,'New facilities may create new risk exposures.'),
    Q('What is the purpose of a portfolio dashboard?',['To replace the advisor','To provide visibility into portfolio health and priorities','To increase premium automatically','To eliminate client communication'],1,'A dashboard provides visibility into portfolio health and priorities.')
  ]),
  hScript('Building and Managing a Client Risk Portfolio',[
    'Welcome to Lesson 3 of CCA 107. What happens when you have many clients \u2014 ten, fifty, one hundred? Each with different risks, priorities, and outstanding actions. Individual client management is no longer enough. You need a system. That system is your Client Risk Portfolio.',
    'A CoverScore Client Risk Portfolio brings together five critical dimensions: the client, their risk profile, their protection status, outstanding actions, and relationship health. Instead of opening twenty different files, your portfolio gives you a single view of where things stand.',
    'Without portfolio management, advisors become reactive \u2014 responding to whichever client calls first, focusing on the nearest renewal, forgetting some clients. Portfolio management turns client management into a disciplined professional process.',
    'Not every client requires the same level of attention. Strategic clients need proactive management. Growth clients have strong potential. Maintain clients need consistent service. Reactivate clients need renewed attention. Segmentation helps you allocate time intelligently.',
    'Client value alone should not determine priority. A smaller business that has just suffered a major loss may need more urgent attention than a large stable client. A professional portfolio considers both relationship importance and risk urgency.',
    'Portfolio management also reveals opportunities. A client who opens a new facility, expands their workforce, or enters a new market may need advisory conversations. The objective is to ensure the client\'s protection grows with the business.',
    'Portfolio review requires a rhythm. Daily \u2014 manage urgent actions. Weekly \u2014 follow up on active engagements. Monthly \u2014 review portfolio health. Quarterly \u2014 examine risk trends. Annually \u2014 evaluate overall direction. This prevents the advisor from becoming trapped in daily transactions.',
    'A professional CoverScore Advisor measures success by portfolio quality. Do you understand your clients? Do you know their current risks? Are protection gaps being addressed? Are clients engaged? Manage your portfolio intentionally.'
  ]),
  hWorkbook([
    {t:'Portfolio Prioritisation Challenge',i:'You have six clients. Rank them from 1 to 6 according to priority and explain your reasoning.',p:['Alpha Manufacturing: CoverScore 48, last review 18 months ago, major expansion','BrightPath Hospital: CoverScore 61, last review 4 months ago, stable','Grace Community Church: CoverScore 52, last review 14 months ago, new building','PrimeTech SME: CoverScore 72, last review 8 months ago, rapid growth','CityRide Logistics: CoverScore 45, last review 2 months ago, major accident','Greenfield Stores: CoverScore 78, last review 6 months ago, stable']},
    {t:'Dashboard Design Challenge',i:'Design a one-page portfolio dashboard for your ideal advisory practice.',p:['What metrics would you display?','How would you segment clients?','What colours or alerts would indicate risk?','How often would you update it?','Who would have access?']}
  ]),
  hCase('The Overloaded Advisor','An advisor has 65 clients and manages everything using WhatsApp messages, personal memory, paper files, and a spreadsheet of renewal dates. There is no structured view of protection gaps, assessment dates, outstanding recommendations, risk changes, client engagement, or satisfaction. Over the last year, three clients experienced losses, two left for competitors, five have not been contacted in over a year, several expanded their businesses, and one major client represents 45% of annual revenue.',[
    'What portfolio management failures exist?',
    'What information should be added to the CRM?',
    'Which clients should be prioritised?',
    'What concentration risk exists?',
    'What portfolio review rhythm should be introduced?',
    'What dashboard metrics would you track?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Portfolio Segmentation Reference Card',description:'Guide to the four portfolio segments with action priorities'},
    {url:'#',type:'doc',title:'Portfolio Review Planning Template',description:'Template for daily, weekly, monthly, quarterly, and annual reviews'}
  ])
);

C7[4] = L(
  hContent('Risk Reviews, Reassessments and Portfolio Monitoring',[
    'Explain the difference between a risk review and a risk reassessment',
    'Understand why continuous portfolio monitoring is essential',
    'Identify events that should trigger a client review',
    'Identify events that should trigger a full CoverScore reassessment',
    'Establish appropriate review frequencies for different clients',
    'Monitor changes in client risk profiles',
    'Track unresolved protection gaps',
    'Use risk alerts and portfolio signals to prioritise action',
    'Conduct effective client risk review conversations',
    'Document review outcomes and next steps',
    'Recognise when a client\'s CoverScore may no longer reflect current reality',
    'Build a practical monitoring and reassessment plan'
  ],[
    SE('Risk Does Not Stand Still','A client\'s risk profile is never permanent. A business that was adequately protected yesterday may be underprotected today. A hospital may acquire new equipment. A manufacturer may open a new factory. A church may construct a new auditorium. Every significant change can alter the risk profile.'),
    T('The Three-Layer Monitoring Model',['Layer','Purpose','When'],[
      ['Monitor','Continuously watch for meaningful changes','Ongoing'],
      ['Review','Engage the client to understand what changed','When change is detected'],
      ['Reassess','Update the risk profile when changes are material','When changes are significant']
    ]),
    SE('The Problem with Static Risk Profiles','Imagine completing an assessment in January. Twelve months later, the company has opened a new warehouse, doubled inventory, purchased new machinery, and increased its workforce. The original assessment may no longer represent current reality. The professional advisor monitors the gap between what we know and what is actually happening.'),
    SE('What Is a Risk Review?','A risk review is a structured conversation designed to understand what has changed since the last assessment or review. It does not necessarily mean starting the entire assessment process again. The advisor explores what changed, what is new, what has grown, what incidents occurred, and which recommendations were implemented.'),
    SE('What Is a Reassessment?','A reassessment becomes necessary when changes are significant enough to affect the risk profile. The goal: "If we assessed this client today, would the risk profile look different?" If yes, a reassessment may be appropriate.'),
    T('Reassessment Triggers',['Change Type','Examples','Response'],[
      ['Minor','Small asset addition, routine staff change','Monitor'],
      ['Moderate','New product line, moderate fleet expansion','Focused review'],
      ['Significant','New facility, acquisition, major loss, merger','Full reassessment']
    ]),
    SE('Scheduled vs Event-Driven Reviews','Scheduled reviews occur at planned intervals. Event-driven reviews occur when something significant happens. The best advisors use both \u2014 they do not wait for the annual review if a major risk event happens today.'),
    T('The Five Review Questions',['Question','Purpose'],[
      ['What has changed?','Identify differences since last review'],
      ['What is new?','Discover new assets, activities, exposures'],
      ['What has been implemented?','Track recommendation progress'],
      ['What has gone wrong?','Learn from incidents and near misses'],
      ['What are you planning next?','Anticipate future risk changes']
    ]),
    SE('Monitoring Protection Gaps','Every recommendation should have a status: Open, In Progress, Implemented, Declined, or No Longer Applicable. This prevents important recommendations from disappearing into old files.'),
    C('A risk profile is a snapshot. A risk relationship is continuous.')
  ],[
    'Risk monitoring uses three layers: Monitor, Review, and Reassess',
    'Not every change requires reassessment \u2014 judgement determines the response',
    'Scheduled reviews and event-driven reviews are both essential',
    'Protection gaps must be tracked until resolved'
  ]),
  hQuiz([
    Q('What is the purpose of portfolio monitoring?',['To replace client communication','To identify meaningful changes in client risk environments','To automatically increase premiums','To avoid assessments'],1,'Monitoring identifies meaningful changes.'),
    Q('What is the difference between a review and reassessment?',['They are exactly the same','A review explores changes, while reassessment updates the profile when material change exists','A reassessment only happens after claims','A review only happens at renewal'],1,'A review explores changes; reassessment updates the profile.'),
    Q('Which event most likely requires a full reassessment?',['A minor office supply purchase','A major business expansion','A routine staff meeting','A small administrative change'],1,'Major business expansion typically requires full reassessment.'),
    Q('What should an advisor do when a risk alert appears?',['Immediately sell a policy','Ignore it','Investigate the signal and determine the appropriate response','Delete the alert'],2,'Investigate the signal and determine the appropriate response.'),
    Q('Which is an event-driven review trigger?',['A major acquisition','A scheduled calendar reminder','A routine monthly report','An unchanged policy'],0,'A major acquisition is an event-driven review trigger.'),
    Q('Should every client be reviewed at the same frequency?',['Yes','No \u2014 frequency should reflect risk complexity, change, and client needs','Only large clients need reviews','Only new clients need reviews'],1,'Frequency should reflect risk complexity and client needs.'),
    Q('Which question is particularly useful during a risk review?',['Do you want another policy?','What are you planning over the next six to twelve months?','Can you pay today?','Are you satisfied with your premium?'],1,'Asking about future plans is powerful.'),
    Q('Why should reviews be documented?',['For continuity, accountability, and professional record-keeping','To create unnecessary paperwork','To replace client meetings','To avoid reassessments'],0,'Documentation ensures continuity and accountability.')
  ]),
  hScript('Risk Reviews, Reassessments and Portfolio Monitoring',[
    'Welcome to Lesson 4 of CCA 107. Managing a portfolio is not simply about keeping client records \u2014 it is about keeping those records current. Risk changes. Businesses grow. Assets increase. When the client\'s risk environment changes, the advisor must respond.',
    'Imagine completing an assessment in January. Twelve months later, the company has opened a warehouse, doubled inventory, and purchased new machinery. The original assessment was accurate when conducted but may no longer represent current reality. The problem is that the risk environment changed.',
    'The CoverScore monitoring cycle has three stages. Monitor \u2014 watch for signals that the risk environment has changed. Review \u2014 speak with the client to understand the significance. Reassess \u2014 if changes are material, update the risk profile.',
    'A risk review is a structured conversation about what has changed. It does not mean starting the entire assessment again. The advisor explores key questions: What has changed? What is new? What has grown? What incidents have occurred?',
    'Not every change requires a full reassessment. Small changes may simply be monitored. Moderate changes may require a focused review. Significant changes \u2014 major expansion, new facility, acquisition, serious loss \u2014 may require a full reassessment.',
    'Professional monitoring uses both scheduled and event-driven reviews. The best advisors do not wait for the annual review if a major risk event happens today.',
    'The five review questions: What has changed? What is new? What has been implemented? What has gone wrong? What are you planning next? The final question is particularly powerful \u2014 anticipate the client\'s future, not just respond to their past.',
    'The professional CoverScore Advisor understands that risk management is continuous. Monitor the client. Identify change. Review when necessary. Reassess when material. Update recommendations. Support implementation. Continue monitoring. The best advisors act before the gap becomes a crisis.'
  ]),
  hWorkbook([
    {t:'Risk Change Triage Challenge',i:'Classify each scenario as Monitor, Focused Review, or Full Reassessment and explain your reasoning.',p:['Scenario 1: An SME hires 5 new employees but operations remain unchanged.','Scenario 2: A manufacturing company opens a second factory.','Scenario 3: A church acquires a new sound system.','Scenario 4: A hospital opens a new surgical unit.','Scenario 5: An SME experiences a minor change in supplier.','Scenario 6: A manufacturing company experiences a major fire.','Scenario 7: A church constructs a new auditorium significantly increasing occupancy.']},
    {t:'Review Schedule Design',i:'Design a 12-month review schedule for three different client types and explain your approach.',p:['Client A: Large manufacturing company with multiple facilities \u2014 review frequency?','Client B: Medium-sized hospital with moderate risk complexity \u2014 review frequency?','Client C: Small stable retail business \u2014 review approach?']}
  ]),
  hCase('The Changing Manufacturer','You completed a CoverScore Assessment for PrimeSteel Manufacturing 18 months ago. At the time: 1 factory, 80 employees, 10 delivery vehicles, 1,000 tonnes annual production, no exports. Today: 2 factories, 180 employees, 25 delivery vehicles, 3,000 tonnes annual production, exports to two countries, new automated machinery, increased inventory, new warehouse.',[
    'Identify all major risk changes.',
    'Which changes require immediate attention?',
    'Focused review or full reassessment \u2014 which is appropriate and why?',
    'What risk objects need to be revisited?',
    'What new protection gaps likely exist?',
    'Prepare five questions for the client.',
    'Create a 30-day action plan.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Risk Review vs Reassessment Decision Guide',description:'Flowchart for determining whether to monitor, review, or reassess'},
    {url:'#',type:'doc',title:'Client Review Conversation Template',description:'Structured template for conducting client risk review meetings'}
  ])
);

C7[6] = L(
  hContent('Client Documentation, CRM and Advisory Records',[
    'Explain why documentation is essential to professional risk advisory',
    'Understand the difference between client information and advisory intelligence',
    'Identify the minimum information that should be captured in a client record',
    'Understand the role of CRM in managing the CoverScore client journey',
    'Maintain accurate and current client records',
    'Document client conversations and advisory decisions',
    'Record risk assessments and protection gaps',
    'Track recommendations and action items',
    'Maintain claims and incident records',
    'Create effective follow-up tasks and reminders',
    'Understand the importance of data accuracy and record integrity',
    'Apply appropriate confidentiality and access controls',
    'Build a complete client advisory record',
    'Use CRM data to improve portfolio monitoring and client service'
  ],[
    SE('The Risk Advisor\'s Memory','As a professional CoverScore Advisor, you will manage multiple clients, risks, recommendations, and follow-ups. You cannot rely on memory or WhatsApp conversations alone. Professional advisory requires a reliable system of record \u2014 your CRM.'),
    T('The CoverScore Documentation Model',['Layer','Content','Purpose'],[
      ['Identity','Client name, contacts, decision-makers','Who is the client?'],
      ['Context','Business activities, operating environment','What does the client do?'],
      ['Risk','Risk objects, pillars, scores, exposures','What risks do they face?'],
      ['Protection','Existing insurance, policies, limits, gaps','What protection exists?'],
      ['Advisory','Recommendations, rationale, priority, status','What was recommended?'],
      ['Activity','Meetings, calls, assessments, reviews, follow-ups','What interactions occurred?'],
      ['History','Changes, claims, incidents, decisions over time','What has happened?']
    ]),
    SE('The Single Source of Truth','The goal of CRM discipline is to create a reliable source of truth. The official client record should contain client identity, risk assessment, recommendations, policies, claims, conversations, tasks, and reviews. The advisor should not search five different places to understand the client\'s current position.'),
    T('The Four-Question CRM Note Standard',['Question','Why It Matters'],[
      ['What happened?','Captures the key event or conversation'],
      ['What changed?','Identifies developments affecting the risk profile'],
      ['What was decided?','Records client choices and commitments'],
      ['What happens next?','Creates clear next actions and ownership']
    ]),
    SE('The Art of Writing a Good CRM Note','Avoid vague statements like "Spoke with client" or "Client interested." Document what happened, what changed, what was discussed, what was decided, what action is required, who owns it, and when it should happen. A good note allows another advisor to understand without needing to ask.'),
    SE('Recommendations Become Actions','If something requires action, create a task with a responsible person, due date, and priority. "The client will send the asset register" is not enough. Create: "Follow up with client for updated asset register \u2014 due 15 July."'),
    SE('Data Quality and Record Integrity','Incorrect data creates incorrect conclusions. Outdated client information, duplicate records, incorrect risk scores, missing documents can lead to poor client service and missed risks. The professional advisor maintains data accuracy.'),
    SE('Confidentiality and Access Control','Risk advisory involves sensitive information. Access should be limited to authorised individuals. Records should be stored securely. Professionalism includes protecting the information clients trust us to manage.'),
    C('Your CRM is not just where you store client names. It is where you preserve the client\'s risk journey.')
  ],[
    'Documentation creates continuity, accountability, and institutional memory',
    'The Documentation Model has seven layers from Identity to History',
    'Good CRM notes answer: What happened, what changed, what was decided, what happens next',
    'Data quality, confidentiality, and task management are essential CRM disciplines'
  ]),
  hQuiz([
    Q('Why is documentation important?',['It creates unnecessary paperwork','It preserves client knowledge and creates continuity','It replaces client meetings','It eliminates risk'],1,'Documentation preserves client knowledge and creates continuity.'),
    Q('What is the purpose of a CRM?',['To store names only','To manage and preserve client relationship and advisory information','To replace advisors','To automatically guarantee sales'],1,'CRM manages and preserves client advisory information.'),
    Q('Which is part of the CoverScore Documentation Model?',['Identity','Context','Risk','All of the above'],3,'All layers are part of the Documentation Model.'),
    Q('Which is the best CRM note?',['Spoke with client','Client interested','Client confirmed new warehouse is operational; updated asset info due 15 July; advisor to review exposures','Follow up'],2,'The best note clearly documents what happened, what changed, and next steps.'),
    Q('What should happen to an important recommendation?',['Remain in the advisor\'s memory','Be converted into a tracked action','Be deleted','Nothing'],1,'Recommendations should become tracked actions.'),
    Q('Why should claims be linked to the client record?',['To preserve risk history and support post-loss learning','To automatically deny future claims','To increase premiums','To replace the claims department'],0,'Claims preserve risk history and support post-loss learning.'),
    Q('What should a CRM task contain?',['Action','Owner','Due date','All of the above'],3,'A task should contain action, owner, and due date.'),
    Q('How should client information be handled?',['Shared freely','Stored and accessed appropriately with confidentiality respected','Posted publicly','Sent to anyone who asks'],1,'Client information must be handled with appropriate confidentiality.')
  ]),
  hScript('Client Documentation, CRM and Advisory Records',[
    'Welcome to Lesson 6 of CCA 107. As a professional advisor, you will manage multiple clients, risks, recommendations, and follow-ups. You cannot rely on memory. Professional advisory requires a reliable system of record \u2014 your CRM.',
    'Imagine working with a client for two years and then leaving the organisation. If the knowledge exists only in your memory, it leaves with you. Documentation creates continuity and protects both client and advisor.',
    'The CoverScore Documentation Model has seven layers: Identity, Context, Risk, Protection, Advisory, Activity, and History. Together, they create a complete advisory picture.',
    'A good CRM note answers four questions: What happened? What changed? What was decided? What happens next? Avoid vague statements. Document clearly so another advisor can understand without needing to ask.',
    'One of the biggest weaknesses in client management is relying on memory for follow-ups. If something requires action, create a task with a responsible person and due date. This dramatically improves advisory consistency.',
    'The quality of your advisory decisions depends on the quality of your information. Outdated data, duplicate records, incorrect risk scores \u2014 these are not small administrative problems. They lead to poor service and missed risks.',
    'Risk advisory involves sensitive client information. The advisor must treat data as confidential. Access should be limited to authorised individuals. Professionalism includes protecting client information.',
    'When documentation is strong, the advisor sees the full picture. Better data creates better decisions. Better decisions create better outcomes. Good documentation creates continuity and institutional intelligence.'
  ]),
  hWorkbook([
    {t:'CRM Clean-Up Challenge',i:'You inherit the following client record. Identify at least 10 weaknesses and create a recovery plan.',p:['Client: ABC Manufacturing, Phone: 0803XXXXXXX, Last Contact: "Spoke with client.", Risk Score: 62, Assessment Date: 18 months ago, Policies: Fire, Motor, Claim: Fire claim last year, Recommendation: "Client needs more cover.", Next Follow-Up: None, Protection Gaps: Unknown']},
    {t:'CRM Note Rewriting',i:'Rewrite each poor note using the Four-Question CRM Note Standard.',p:['"Met with client. Good meeting. Needs insurance." \u2014 Rewrite','"Client interested in review." \u2014 Rewrite','"Follow up later." \u2014 Rewrite','"Spoke about renewal. Client wants to think." \u2014 Rewrite','"Everything is fine." \u2014 Rewrite']}
  ]),
  hCase('The Client Who Changed Advisors','You inherit a manufacturing client from another advisor. You find policies, two claims, old risk reports, WhatsApp conversations, an incomplete CRM record, no current risk score, no documented gap analysis, and no outstanding recommendation record. The client has recently opened a second factory, increased employees from 100 to 250, purchased new machinery, started exporting, and increased turnover significantly.',[
    'What information should you collect first?',
    'What records should you verify?',
    'What should be entered into the CRM?',
    'Which historical records should be preserved?',
    'What risk changes should trigger reassessment?',
    'What tasks should be created?',
    'What should the next client meeting accomplish?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'CRM Note-Writing Reference Card',description:'Guide to the Four-Question CRM Note Standard with examples'},
    {url:'#',type:'doc',title:'Client Advisory Record Template',description:'Template for building a complete client record using the seven-layer model'}
  ])
);

C7[7] = L(
  hContent('Measuring Client Value and Advisor Performance',[
    'Explain the difference between sales performance and advisory performance',
    'Define client value from a CoverScore perspective',
    'Identify meaningful client value indicators',
    'Measure protection gap closure',
    'Measure client engagement and advisory activity',
    'Understand client retention and relationship depth',
    'Measure risk review and reassessment performance',
    'Track recommendations from identification to implementation',
    'Understand leading vs lagging indicators',
    'Build a balanced advisor performance scorecard',
    'Use CRM data to monitor advisory performance',
    'Identify clients at risk of disengagement',
    'Connect advisory activity to commercial outcomes',
    'Avoid vanity metrics and misleading performance measures',
    'Build a personal CoverScore Advisor Performance Dashboard'
  ],[
    SE('What Does Success Look Like?','How do you know whether you are a successful CoverScore Advisor? Is it the number of policies you sell? The premium? These are important but do not tell the whole story. A professional advisor must also ask: Did my clients become more risk-aware? Did protection gaps reduce? Did I help clients make better decisions?'),
    T('From Sales to Advisory Performance',['Traditional Metrics','CoverScore Advisory Metrics'],[
      ['Premium generated','Risk assessments completed'],
      ['Policies sold','Protection gaps identified and closed'],
      ['New clients','Client reviews completed on schedule'],
      ['Revenue','Recommendations implemented'],
      ['Commission','Client retention and referrals']
    ]),
    T('The Four Dimensions of Client Value',['Dimension','Question','Indicators'],[
      ['Risk Value','Did the client gain better risk understanding?','Assessment completed, awareness increased'],
      ['Protection Value','Did protection improve?','Gaps closed, recommendations implemented'],
      ['Relationship Value','Did trust and engagement increase?','Retention, referrals, review participation'],
      ['Business Value','Was sustainable commercial value created?','Revenue, growth, referral business']
    ]),
    SE('Protection Gap Closure Rate','Addressed Gaps \u00f7 Identified Gaps \u00d7 100. If 20 gaps identified and 12 addressed, the rate is 60%. The purpose is to measure progress, not to pressure clients into buying unnecessary insurance.'),
    T('Leading vs Lagging Indicators',['Leading (Activities)','Lagging (Results)'],[
      ['Assessments completed','Revenue generated'],
      ['Client meetings','Premium written'],
      ['Risk reviews performed','Client retention rate'],
      ['Follow-ups completed','Referrals received'],
      ['Recommendations presented','Claims experience']
    ]),
    T('CoverScore Advisor Performance Scorecard',['Dimension','What It Measures'],[
      ['Client Coverage','How actively is the portfolio managed?'],
      ['Advisory Activity','How consistently is advisory work performed?'],
      ['Protection Impact','Is client protection improving?'],
      ['Relationship Health','Are clients engaged and retained?'],
      ['Commercial Performance','Is sustainable business value created?'],
      ['Professional Discipline','Are records, tasks, reviews properly managed?']
    ]),
    SE('Measuring Portfolio Health','Active clients, overdue reviews, outdated assessments, unresolved gaps, inactive clients, at-risk relationships. Portfolio health allows proactive rather than reactive management.'),
    SE('Recommendation Implementation Rate','Tracking from recommendation to implementation helps understand where advisory value becomes action. A low rate may reveal affordability, timing, communication gaps, or mismatched priorities.'),
    C('What gets measured gets managed. What gets managed gets improved.')
  ],[
    'Advisory performance measures risk understanding, protection improvement, and relationship value',
    'The four client value dimensions are Risk, Protection, Relationship, and Business Value',
    'Leading indicators predict; lagging indicators confirm',
    'A balanced scorecard includes six dimensions of performance'
  ]),
  hQuiz([
    Q('What distinguishes advisory performance from sales performance?',['Nothing','Advisory performance also measures client risk and protection impact','Advisory is only about premium','Sales does not matter'],1,'Advisory performance measures client risk and protection impact.'),
    Q('Which is a dimension of client value?',['Risk Value','Protection Value','Relationship Value','All of the above'],3,'All four are dimensions of client value.'),
    Q('What does Protection Gap Closure Rate measure?',['Policies sold','Identified gaps that have been addressed','Claims rejected','Clients contacted'],1,'It measures addressed gaps against identified ones.'),
    Q('Which is a leading indicator?',['Revenue','Retention','Risk assessments completed','Annual profit'],2,'Risk assessments are a leading indicator.'),
    Q('Which is a lagging indicator?',['Client meeting','Risk assessment','Follow-up task','Revenue'],3,'Revenue is a lagging indicator.'),
    Q('Why track recommendation implementation?',['To understand whether insights translate to action','To force purchases','To replace discussions','To eliminate risk'],0,'It reveals whether insights translate into action.'),
    Q('Which indicates relationship value?',['Retention','Referrals','Engagement','All of the above'],3,'All indicate relationship value.'),
    Q('What does high premium with low retention suggest?',['Ignore retention','Short-term results without sustainable value','This is best performer','Nothing'],1,'High premium with low retention may indicate short-term results without sustainable value.')
  ]),
  hScript('Measuring Client Value and Advisor Performance',[
    'Welcome to Lesson 7 of CCA 107. How do you measure success? Is it the number of policies sold? The amount of premium? These are important but do not tell the whole story. A professional risk advisor also measures client risk understanding, protection improvement, and relationship strength.',
    'Traditional insurance performance focuses on production. The CoverScore Advisor adds advisory metrics: risk assessments completed, protection gaps identified and closed, reviews completed on schedule, recommendations implemented, client retention, and referrals.',
    'Client value has four dimensions. Risk Value \u2014 did the client gain better understanding? Protection Value \u2014 did protection improve? Relationship Value \u2014 did trust and engagement increase? Business Value \u2014 was sustainable commercial value created?',
    'Protection Gap Closure Rate measures progress: addressed gaps divided by identified gaps times one hundred. The purpose is not to pressure clients but to track whether the client\'s risk position is improving over time.',
    'Track both leading and lagging indicators. Leading indicators \u2014 assessments, meetings, reviews, follow-ups \u2014 influence future outcomes. Lagging indicators \u2014 revenue, retention, referrals \u2014 measure past results. If you only measure lagging indicators, you discover problems too late.',
    'The CoverScore Advisor Performance Scorecard measures six areas: Client Coverage, Advisory Activity, Protection Impact, Relationship Health, Commercial Performance, and Professional Discipline. This creates a balanced view.',
    'An advisor\'s performance is also measured by portfolio health. How many clients are active? How many are overdue for review? How many have outdated assessments? Portfolio health enables proactive management.',
    'The most important principle: measure what matters. Create more client value. Build stronger relationships. Improve protection outcomes. Create sustainable business performance. What gets measured gets managed. What gets managed gets improved.'
  ]),
  hWorkbook([
    {t:'Advisor Scorecard Challenge',i:'You manage 50 clients. Analyse your performance metrics.',p:['Active clients: 42 of 50 \u2014 what is the active client rate?','Protection gaps: 60 identified, 36 addressed \u2014 what is the gap closure rate?','Recommendations: 40 made, 25 implemented \u2014 what is the implementation rate?','Overdue reviews: 8 clients \u2014 what percentage is overdue?','Referrals: 4 received \u2014 what does this suggest?','Identify your top 3 strengths and top 3 improvement areas.']},
    {t:'Client Value Assessment',i:'Choose a client you have worked with. Assess the value you created across all four dimensions.',p:['Risk Value: What risk awareness did the client gain?','Protection Value: What protection improvements were made?','Relationship Value: How has the relationship deepened?','Business Value: What sustainable value was created for both parties?']}
  ]),
  hCase('The High-Performing Advisor Losing Clients','An advisor generated 35% premium growth, acquired 40 new clients \u2014 but has a 68% retention rate, 25% protection gap closure, 45% review completion, only 2 referrals, and 55% CRM completeness. Management considers them a top performer due to strong sales.',[
    'Is this advisor truly high-performing?',
    'What does the retention rate tell us?',
    'What does low gap closure suggest?',
    'What does low review completion suggest?',
    'What does low referrals suggest?',
    'What does CRM quality tell us?',
    'What interventions would you recommend?'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Advisor Performance Scorecard Reference',description:'Guide to the six dimensions of the CoverScore Advisor Performance Scorecard'},
    {url:'#',type:'doc',title:'Client Value Assessment Template',description:'Template for measuring client value across all four dimensions'}
  ])
);

C7[8] = L(
  hContent('Professional Practice Simulation and Module Assessment',[
    'Demonstrate professional CoverScore advisory behaviour',
    'Manage a complete client relationship',
    'Identify and prioritise client risks',
    'Maintain an accurate client risk portfolio',
    'Conduct periodic risk reviews',
    'Respond professionally to claims and incidents',
    'Conduct post-loss advisory conversations',
    'Update client risk profiles following material changes',
    'Document advisory interactions correctly',
    'Use CRM data to manage client relationships',
    'Track outstanding recommendations',
    'Monitor protection gaps',
    'Measure client value and advisor performance',
    'Develop a structured client action plan',
    'Demonstrate ethical and professional judgement',
    'Build a sustainable long-term advisory relationship'
  ],[
    SE('The Professional CoverScore Advisor Standard','A professional CoverScore Advisor operates according to seven principles: Client-centric \u2014 prioritise actual risk needs. Risk-led \u2014 recommendations begin with identified risks. Proactive \u2014 anticipate changes. Documented \u2014 record important interactions. Data-informed \u2014 use assessments and CRM data. Relationship-focused \u2014 manage beyond the initial sale. Continuous \u2014 risk advisory is an ongoing process.'),
    SE('Simulation Overview','You will now step into the role of a professional CoverScore Advisor managing a real-world client scenario. Your client is Adeola Foods and Distribution Limited \u2014 a food manufacturing and distribution company in Lagos with 85 employees, NGN 1.2 billion turnover, and existing policies for Fire and Special Perils, Group Life, Motor, Goods in Transit, and Public Liability.'),
    T('Original Client Risk Profile',['Risk Area','Initial Level'],[
      ['Property','High'],
      ['Business Interruption','Moderate'],
      ['Motor Fleet','High'],
      ['Employee Accident','Moderate'],
      ['Product Liability','High'],
      ['Cyber','High'],
      ['Key Person','Moderate']
    ]),
    SE('Initial Recommendations and Client Response','Recommendations were made for property review, BI assessment, motor fleet review, GPA review, product liability review, cyber assessment, key-person review, and annual risk review cycle. The client accepted property, motor fleet, and product liability reviews. Deferred cyber, key-person, and BI. Declined additional GPA.'),
    T('Changes Discovered 12 Months Later',['Change','Details','Risk Implication'],[
      ['New Warehouse','NGN 250M inventory, not on property policy','Property sum insured severely inadequate'],
      ['Fleet Expansion','12 vehicles to 28 vehicles','Fleet and motor liability exposure grown significantly'],
      ['New Distribution Model','40% via third-party logistics','Third-party liability and contract exposures'],
      ['New Product Line','Frozen food, distributed nationwide','Product liability exposure increased significantly'],
      ['Cyber Incident','Email compromise, unauthorised access, disruption','Cyber protection gap confirmed; incident costs incurred'],
      ['Employee Accident','Factory worker injury, claim settled, no post-loss review','Missed learning opportunity; risk controls not reviewed'],
      ['Management Change','Operations Director resigned, replacement inexperienced','Key-person vulnerability'],
      ['Customer Concentration','35% of revenue from one supermarket chain','Business continuity and dependency risk']
    ]),
    SE('Post-Loss Advisory Principles','A claim is not only a financial event \u2014 it is a risk intelligence event. Every significant claim should trigger: What happened? What was the immediate and underlying cause? What controls failed? What was the financial, operational, and reputational impact? What lessons were learned? What should change?'),
    T('The 90-Day Action Plan',['Phase','Actions'],[
      ['Days 1-30','Update property/inventory exposure; review fleet insurance; conduct cyber assessment; review product liability; document cyber incident lessons'],
      ['Days 31-60','Complete BI assessment; review key-person exposure; review third-party logistics; review customer concentration; implement agreed recommendations'],
      ['Days 61-90','Conduct implementation review; recalculate protection gaps; update risk profile; review recommendations; schedule next portfolio review']
    ]),
    SE('Measuring Client Value at End of Period','Risk Value: Did the client identify new risks? Did management understand changing exposures? Protection Value: How many gaps were addressed? Relationship Value: Did engagement increase? Business Value: Was appropriate additional business generated and the relationship strengthened?'),
    C('The ultimate measure of advisory success: "Before I make an important decision, I should speak to my risk advisor."')
  ],[
    'A professional advisor manages the complete client risk relationship, not just policies',
    'Material changes in the client\'s business require prompt reassessment and response',
    'Claims provide risk intelligence \u2014 every significant claim deserves a post-loss review',
    'Client value is measured across risk, protection, relationship, and business dimensions'
  ]),
  hQuiz([
    Q('What is the primary responsibility of a professional CoverScore Advisor?',['Sell as many policies as possible','Manage the client\'s ongoing risk and protection journey','Process claims only','Focus exclusively on renewals'],1,'The advisor manages the ongoing risk and protection journey.'),
    Q('When should a risk profile be reassessed?',['Only at expiry','Only after a claim','When material changes occur and at appropriate review intervals','Never'],2,'Reassess when material changes occur and at appropriate intervals.'),
    Q('Which event should trigger a risk reassessment?',['New warehouse','Major acquisition','New product line','All of the above'],3,'All of these may trigger a reassessment.'),
    Q('What is the purpose of a post-loss risk review?',['To blame the client','To identify lessons and reduce future losses','To cancel the policy','To avoid documentation'],1,'Post-loss reviews identify lessons and reduce future losses.'),
    Q('Which shows good CRM discipline?',['Recording only sales','Maintaining current client, risk, recommendation, and follow-up information','Keeping all info in memory','Updating records once a year'],1,'Good CRM means maintaining current and complete client information.'),
    Q('Why track recommendations?',['To monitor progress from advice to action','To pressure clients','To increase paperwork','To replace communication'],0,'Tracking monitors progress from advice to action.'),
    Q('What best reflects the CoverScore philosophy?',['Products drive the assessment','Risk understanding drives protection recommendations','Premium is the primary objective','Clients should buy every product'],1,'Risk understanding drives protection recommendations.'),
    Q('A CoverScore Advisor\'s responsibility ends when the policy is issued. True or false?',['True','False'],1,'The advisor\'s responsibility continues after policy issuance.'),
    Q('What should happen after a significant client claim?',['Ignore it once settled','Conduct a post-loss risk review','Terminate the relationship','Wait until renewal'],1,'A post-loss risk review should follow significant claims.'),
    Q('How should you respond when a client says they already have insurance?',['List more products','Explain how their risk profile may have changed and review whether protection is still appropriate','End the meeting','Tell them they are underinsured'],1,'Explain how the risk profile may have changed and review appropriateness of existing protection.')
  ]),
  hScript('Professional Practice Simulation and Module Assessment',[
    'Welcome to the final lesson of CCA 107. Throughout this module, you have learned to manage the client journey, build a risk portfolio, conduct reviews, maintain CRM records, and measure value. Now we bring it all together in a comprehensive professional practice simulation.',
    'Your client is Adeola Foods and Distribution Limited \u2014 a food manufacturer with 85 employees and NGN 1.2 billion turnover. You completed their initial CoverScore Assessment twelve months ago. Now the client has requested a review. A lot has changed in their business.',
    'Before the meeting, prepare. Review current policies, limits, claims history, open recommendations, previous assessment data, risk score, outstanding tasks, renewal dates, and previous meeting notes. Never enter a client review meeting unprepared.',
    'During the meeting, ask effective questions. What new assets? Have property values changed? Has the workforce changed? Have production processes changed? Have new products been introduced? Have cyber incidents occurred? What incidents led to claims?',
    'The client reveals significant changes: a new warehouse with NGN 250 million inventory, fleet expanded from 12 to 28 vehicles, 40% of deliveries via third-party logistics, a new frozen food product distributed nationwide, a cyber incident, an employee injury, a departing Operations Director, and 35% revenue concentrated on one customer.',
    'Identify the new or changed risk objects and understand their relationships. New warehouse plus large inventory equals increased property exposure. New product plus nationwide distribution equals increased product liability. Cyber incident confirms the cyber protection gap. These are not isolated risks \u2014 they are interconnected.',
    'Prioritise the protection gaps. Critical: property review for the new warehouse, fleet review for new vehicles, cyber risk assessment. High: BI assessment, product liability review, key-person assessment. Strategic: customer concentration, supply chain dependency, third-party logistics.',
    'Prepare a 90-day action plan. Days 1-30: update property exposure, review fleet, conduct cyber assessment. Days 31-60: complete BI assessment, review key-person exposure, review logistics arrangements. Days 61-90: implementation review, recalculate gaps, schedule next review.',
    'Conduct a post-loss review for both the employee injury and cyber incident. Every significant claim provides risk intelligence. What happened? What controls failed? What lessons were learned? Update the risk profile accordingly.',
    'Document everything in the CRM. The client record should capture the updated profile, new risk objects, protection gaps, recommendations, follow-up tasks, and next review date. If it is not documented, it is difficult to manage, monitor, or prove.',
    'At the end of the 90-day period, measure the client value created. Risk Value \u2014 did the client understand new exposures? Protection Value \u2014 were gaps addressed? Relationship Value \u2014 did engagement increase? Business Value \u2014 was appropriate additional business generated?',
    'The ultimate measure of your success is not how many policies you sold. It is whether the client thinks: "Before I make an important decision, I should speak to my risk advisor." That is the standard of the Professional CoverScore Advisor.'
  ]),
  hWorkbook([
    {t:'The Professional CoverScore Advisor Challenge',i:'You are assigned a new client with 120 employees, three locations, recent competitor acquisition, doubled fleet, two new products, one major claim, no formal annual review process, outdated policies, and multiple unresolved protection gaps. Prepare a complete advisory plan.',p:['Client Preparation Plan \u2014 what information will you review?','Discovery Plan \u2014 what questions will you ask?','Risk Object Identification \u2014 identify at least 15 likely risk objects','Risk Prioritisation \u2014 identify the top 10 risks','Protection Gap Analysis \u2014 identify at least 5 likely gaps','Advisory Recommendations \u2014 risk control, insurance, financial resilience, business continuity','90-Day Implementation Plan \u2014 detailed client action plan','CRM Documentation Plan \u2014 what should be recorded?','12-Month Review Schedule \u2014 design the complete review cycle','KPIs \u2014 define at least 10 to measure client value and advisor performance']},
    {t:'Role-Play: Client Objection',i:'The client CEO says: "I am not convinced we need to review everything again. We already did this last year." Prepare your response for each stage of information revealed.',p:['Stage 1: The warehouse has expanded','Stage 2: The fleet has doubled','Stage 3: A cyber incident occurred','Stage 4: A new product was launched','Stage 5: A major customer represents 35% of revenue','Stage 6: The Operations Director resigned','For each, explain the risk implication and professional response']}
  ]),
  hCase('Adeola Foods Capstone Simulation','Adeola Foods and Distribution Limited \u2014 85 employees, NGN 1.2 billion turnover, existing insurance for Fire, Group Life, Motor, Goods in Transit, and Public Liability. Initial assessment 12 months ago identified high property, moderate BI, high motor, moderate employee accident, high product liability, high cyber, and moderate key-person exposures. Now: new warehouse (NGN 250M inventory), fleet 12 to 28 vehicles, 40% third-party logistics, new frozen food product nationwide, cyber incident, employee injury, departing Operations Director, 35% revenue concentration on one customer.',[
    'Identify all risk changes and their interconnections.',
    'Determine which changes require immediate attention vs which can be staged.',
    'Decide focused review vs full reassessment and why.',
    'Identify protection gaps and classify by priority (Critical, High, Moderate).',
    'Prepare a prioritised recommendation strategy covering risk control and insurance.',
    'Conduct a post-loss review for the cyber incident and employee injury.',
    'Document the updated CRM record with all required information.',
    'Create a 90-day action plan with clear phases and deliverables.',
    'Measure the client value created across all four dimensions.',
    'Define KPIs to track both client value and your advisor performance.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Professional Practice Simulation Brief',description:'Complete Adeola Foods case study with all client data and risk details'},
    {url:'#',type:'doc',title:'Advisory Plan Template',description:'Comprehensive template for creating professional CoverScore advisory plans'},
    {url:'#',type:'doc',title:'90-Day Action Plan Template',description:'Structured template for implementing client recommendations over 90 days'}
  ])
);

C8[1] = L(
  hContent('Capstone Orientation & the Complete CoverScore Advisory Cycle',[
    'Explain the purpose and role of CCA 108 as the final integrated capstone',
    'Explain how CCA 101-107 contribute to professional CoverScore advisory competence',
    'Describe the Complete CoverScore Advisory Cycle 12-stage model',
    'Distinguish between insurance selling and professional risk advisory',
    'Explain why risk assessment must precede protection recommendations',
    'Identify the major stages of an integrated advisory engagement',
    'Explain how Risk Objects, Risk Relationships, risk scores and protection gaps connect',
    'Understand the expectations of the final capstone assessment',
    'Recognise the professional and ethical standards required for CCA certification',
    'Apply the five questions of the professional CoverScore Advisor'
  ],[
    P('Welcome to the final course of the CoverScore Academy. You have completed the journey from understanding risk and insurance to developing the knowledge, mindset, methodology, advisory skills, business development capabilities, and professional practice required of a CoverScore Risk Advisor. Now everything comes together. CCA 108 is not about learning another theory. It is about demonstrating that you can integrate everything and perform as a professional CoverScore Risk Advisor in a realistic client environment.'),
    C('CCA 108 answers: Can the learner independently perform as a professional CoverScore Risk Advisor in a complex, realistic client environment?'),
    T('The CoverScore Academy Journey',['Course','Question','Focus'],[
      ['CCA 101','What is risk and how does insurance help manage it?','Foundations of Risk & Insurance'],
      ['CCA 102','How does the Nigerian insurance market operate?','Market & Regulatory Environment'],
      ['CCA 103','How do we systematically assess risk?','CoverScore Risk Assessment Methodology'],
      ['CCA 104','How should a risk advisor think and behave?','The Risk Advisor Mindset'],
      ['CCA 105','How do we apply the methodology with a client?','Practical Risk Advisory & Client Assessment'],
      ['CCA 106','How do we build a sustainable advisory practice?','Business Development & Client Growth'],
      ['CCA 107','How do we remain valuable throughout the client journey?','Professional Practice & Portfolio Management'],
      ['CCA 108','Can we integrate everything and perform independently?','Capstone: Integrated Advisory Simulation & Assessment']
    ]),
    SE('The Complete CoverScore Advisory Cycle','The central framework for CCA 108: a 12-stage cycle describing the professional advisor\'s responsibility from the first engagement through ongoing risk management.'),
    T('The 12-Stage Cycle',['Stage','Core Question'],[
      ['Prepare','What do I already know and what do I need to discover?'],
      ['Discover','What is the client\'s reality?'],
      ['Identify','What can be exposed to loss?'],
      ['Map','If one Risk Object is affected, what else could be affected?'],
      ['Assess','How serious is this risk given current controls?'],
      ['Score','What does the CoverScore reveal?'],
      ['Interpret','What does the score mean for the client?'],
      ['Identify Gaps','What protection is missing?'],
      ['Strategise','What is the most appropriate risk response?'],
      ['Advise','How do we help the client decide?'],
      ['Implement','What will be done, by whom, and when?'],
      ['Monitor','What has changed since the last review?']
    ]),
    SE('From Insurance Seller to Risk Advisor','The insurance seller thinks "what policy can I sell?" and ends when the policy is issued. The CoverScore Risk Advisor thinks "what risks does this client face?" and begins with understanding the client\'s operations. The relationship continues through assessment, strategy, implementation and continuous review.'),
    T('The Five Levels of Advisory Thinking',['Level','Focus'],[
      ['Level 1','Risk identification — what can go wrong?'],
      ['Level 2','Impact analysis — what happens if it goes wrong?'],
      ['Level 3','Root-cause analysis — why could it happen?'],
      ['Level 4','Control analysis — what controls exist today?'],
      ['Level 5','Advisory strategy — what should the client do about it?']
    ]),
    SE('The Capstone Client — Nexora Integrated Industries','A simulated complex organisation: manufacturing and industrial distribution in Nigeria, 420 employees, 80 contract workers, 35 field sales staff, approximately $7.5M revenue. Operations include manufacturing, warehousing, distribution, logistics, imported raw materials, and regional sales. Growth plan: expansion into two additional Nigerian states.'),
    SE('The Client\'s Opening Statement','The CEO says: "We have insurance. I don\'t want another insurance sales presentation. I want to know what could seriously hurt this business, how exposed we are, and what we should do about it." This establishes that the engagement is not "what policy can I sell?" but "what risks does this business face and how should management respond?"'),
    SE('The Professional Advisor\'s Golden Rule','Never recommend before you understand. Follow: Understand, Assess, Interpret, Advise. Never: Sell, Justify, Defend.'),
    T('What the Learner Must Not Do',['Category','Examples'],[
      ['Product-first','Start with product recommendations; treat policy issuance as the end'],
      ['Assessment errors','Assume existing insurance is adequate; treat every risk equally'],
      ['Manipulation','Manipulate risk scores; exaggerate or minimise risks'],
      ['Non-insurance','Ignore non-insurance solutions; present technical info without business context']
    ]),
    T('What the Learner Must Do',['Action','Why'],[
      ['Prepare thoroughly','Intelligent questions require informed preparation'],
      ['Ask and listen','Risk signals emerge through active listening'],
      ['Identify Risk Objects','Understanding what is exposed is foundational'],
      ['Understand relationships','Rarely do risks exist in isolation'],
      ['Evaluate controls','Controls affect the risk score and gap analysis'],
      ['Apply methodology','Consistency produces defensible results'],
      ['Prioritise','Not every risk requires the same response'],
      ['Communicate clearly','Executives need business language, not insurance jargon']
    ]),
    T('The Five Dimensions of Professional Competence',['Dimension','Assessment Question'],[
      ['Technical','Can the advisor correctly apply the CoverScore methodology?'],
      ['Advisory','Can the advisor help the client understand and respond to uncertainty?'],
      ['Commercial','Can the advisor create sustainable value while developing a viable advisory relationship?'],
      ['Professional','Can the advisor demonstrate discipline, documentation, communication and accountability?'],
      ['Ethical','Can the advisor protect the client\'s interests when commercial pressure creates temptation?']
    ]),
    T('Capstone Assessment Framework',['Competency','Weight'],[
      ['Client Preparation & Discovery','10%'],
      ['Risk Intelligence & Risk Object Identification','10%'],
      ['CoverScore Assessment Application','15%'],
      ['Risk Fingerprint & Protection Gap Analysis','10%'],
      ['Protection Strategy','15%'],
      ['Advisory Communication','10%'],
      ['Business & Commercial Judgment','10%'],
      ['Client Portfolio & Relationship Strategy','5%'],
      ['Ethics & Professional Judgment','10%'],
      ['Professional Documentation','5%']
    ]),
    T('Performance Levels',['Score','Level','Meaning'],[
      ['90-100%','CCA Professional Mastery','Exceptional professional capability'],
      ['80-89%','CCA Professional Competence','Strong capability, minor development areas'],
      ['70-79%','CCA Competent','Acceptable professional capability'],
      ['60-69%','CCA Developing','Requires targeted remediation'],
      ['Below 60%','CCA Not Yet Competent','Requires reassessment']
    ]),
    SE('Critical Professional Failure','A learner fails regardless of score if they: fabricate client information, manipulate assessment results, knowingly recommend unsuitable protection, deliberately conceal material risks, breach confidentiality, misrepresent coverage, or prioritise commission over client interests. Professional competence without integrity is not professional competence.'),
    SE('The Five Questions of the Professional CoverScore Advisor','Before making a recommendation: 1. What can go wrong? 2. What would happen if it did? 3. What controls exist today? 4. What remains exposed? 5. What is the most appropriate response?'),
    SE('The Advisor\'s Decision Filter','Before recommending any action: Client Need (does this solve a genuine problem?), Risk Relevance (is this connected to an identified risk?), Adequacy (is the level appropriate?), Affordability (is it financially realistic?), Suitability (is it appropriate for the circumstances?), Ethics (would I still recommend this if I earned nothing from it?).'),
    C('The final professional standard: Understand the risk. Make it visible. Assess it intelligently. Identify the gap. Recommend responsibly. Guide the decision. Stay accountable.')
  ],[
    'CCA 108 is the final integrated capstone — it answers: "Can the learner independently perform as a professional CoverScore Risk Advisor?"',
    'The Complete CoverScore Advisory Cycle has 12 stages: Prepare, Discover, Identify, Map, Assess, Score, Interpret, Identify Gaps, Strategise, Advise, Implement, Monitor',
    'Never recommend before you understand — the professional advisor starts with the client\'s risk environment, not with a product',
    'Five dimensions of professional competence: Technical, Advisory, Commercial, Professional, and Ethical'
  ]),
  hQuiz([
    Q('What is the primary purpose of CCA 108?',['Learn more insurance products','Learn how to calculate commission','Demonstrate integrated professional advisory competence','Learn how to sell motor insurance'],2,'The purpose is to demonstrate integrated professional advisory competence.'),
    Q('What should the advisor do first when engaging a complex client?',['Recommend insurance','Ask for the client\'s budget','Understand the client\'s context and risk environment','Prepare a quotation'],2,'Understanding the client\'s context must precede any recommendation.'),
    Q('What is the primary purpose of the Risk Fingerprint?',['Calculate commission','Visualise and communicate the client\'s risk profile','Replace the client conversation','Determine the insurer\'s profit'],1,'The Risk Fingerprint visualises and communicates the risk profile.'),
    Q('Which statement best describes insurance within risk management?',['Insurance is the entire risk management strategy','Insurance is one potential component of a broader risk management strategy','Insurance is always the best response','Risk management eliminates the need for insurance'],1,'Insurance is one component of a broader risk management strategy.'),
    Q('What should a CoverScore Advisor do when commercial pressure conflicts with assessment integrity?',['Change the assessment','Maintain professional integrity and report the risk accurately','Increase the risk score','Recommend more policies'],1,'The advisor must maintain professional integrity and report the risk accurately.'),
    Q('What is the correct sequence for advisory engagement?',['Sell-Quote-Assess-Discover','Discover-Identify-Assess-Interpret-Advise','Quote-Sell-Review-Discover','Recommend-Assess-Discover-Score'],1,'The correct sequence is Discover-Identify-Assess-Interpret-Advise.'),
    Q('Why are Risk Relationships important?',['They determine commission','They show how one risk can create consequences across multiple parts of an organisation','They replace risk assessment','They determine premiums automatically'],1,'Risk Relationships show how one risk can create consequences across multiple areas.'),
    Q('What should happen after a client implements a protection strategy?',['The relationship ends','The advisor stops communicating','The advisor continues monitoring, reviewing and reassessing the risk environment','The client only contacts the advisor at renewal'],2,'The advisor continues monitoring, reviewing and reassessing.'),
    Q('Which best represents the CoverScore Advisor mindset?',['"I sell policies"','"I maximise premium"','"I help clients understand and manage risk"','"I always recommend comprehensive insurance"'],2,'The CoverScore Advisor helps clients understand and manage risk.'),
    Q('What ultimately determines readiness to become a professional CoverScore Advisor?',['Ability to memorise insurance definitions','Ability to quote many products','Ability to integrate knowledge, methodology, judgment, communication, ethics and professional practice','Ability to generate the highest premium'],2,'The ability to integrate all professional capabilities determines readiness.')
  ]),
  hScript('Capstone Orientation & the Complete CoverScore Advisory Cycle',[
    'Welcome to CCA 108 — the final course of the CoverScore Academy. This is not another theory module. This is where you demonstrate that you can integrate everything you have learned and perform as a professional risk advisor in a realistic client environment.',
    'You have completed the journey: foundations of risk and insurance, the Nigerian market, the CoverScore methodology, the advisor mindset, practical advisory, business development, and professional portfolio management. Now everything comes together.',
    'The Complete CoverScore Advisory Cycle has 12 stages: Prepare, Discover, Identify, Map, Assess, Score, Interpret, Identify Gaps, Strategise, Advise, Implement, Monitor. You must be able to move through this entire cycle with a client.',
    'Your capstone client is Nexora Integrated Industries — a manufacturing and distribution company with complex operations, multiple stakeholders, and an ambitious growth plan. The CEO will not ask for a product. He will ask you to understand his business and tell him what could seriously hurt it.',
    'The professional advisor does not begin with a policy. The advisor begins with the risk. Insurance is one component of a broader protection strategy, not the automatic answer to every exposure.',
    'Throughout CCA 108, you will face simulations that test your judgement, your ability to ask the right questions, and your willingness to make ethical decisions under pressure.',
    'Remember the golden rule: Never recommend before you understand. The five questions of the professional advisor are: What can go wrong? What would happen? What controls exist? What remains exposed? What is the appropriate response?',
    'The final standard is simple: Understand the risk. Make it visible. Assess it intelligently. Identify the gap. Recommend responsibly. Guide the decision. Stay accountable.'
  ]),
  hWorkbook([
    {t:'The 60-Second Advisor Challenge',i:'A client says: "We already have insurance. Why do we need a risk assessment?" Write your response in 60 seconds.',p:['Your opening statement','How you explain the purpose of risk assessment','How you differentiate from a product sales pitch','How you invite the next conversation']},
    {t:'Map the Academy Journey',i:'List the 7 previous CCA courses. For each, write the one key capability you gained and how it contributes to the CCA 108 capstone.',p:['CCA 101 — key capability and how it contributes','CCA 102 — key capability and how it contributes','CCA 103 — key capability and how it contributes','CCA 104 — key capability and how it contributes','CCA 105 — key capability and how it contributes','CCA 106 — key capability and how it contributes','CCA 107 — key capability and how it contributes']},
    {t:'The Advisor\'s Decision Filter',i:'Apply the six-question decision filter to each scenario.',p:['A client asks for the cheapest possible policy despite a known gap','A colleague suggests manipulating a risk score to close a sale','A client wants to hide a material fact from the assessment','Management pressures you to recommend a product that is not the best fit']},
    {t:'The Five Questions in Practice',i:'For a manufacturing client, apply the five questions of the professional advisor.',p:['What can go wrong? — identify 5 specific risks','What would happen? — describe the consequences','What controls exist? — list likely current controls','What remains exposed? — identify the protection gaps','What is the appropriate response? — recommend actions']}
  ]),
  hCase('Nexora Integrated Industries — The Capstone Client','Nexora Integrated Industries Limited is a Nigerian manufacturing and industrial distribution company with 420 employees, 80 contract workers, 35 field sales staff, and approximately $7.5M equivalent annual revenue. Operations include manufacturing, warehousing, distribution, logistics, imported raw materials, and regional sales. The company plans expansion into two additional Nigerian states. The CEO has approached the CoverScore Advisor saying: "We have insurance. But I am not convinced we are adequately protected." Seven stakeholders have been identified: CEO, CFO, COO, HR Director, IT Manager, Procurement Director, and Head of Logistics. Each has different concerns — from growth and profitability to operational resilience, employee welfare, cybersecurity, supply chain security, and fleet management.',[
    'Identify at least 15 potential Risk Objects across the Nexora ecosystem',
    'Identify at least 10 potential risk relationships (how different risks interconnect)',
    'Determine what management needs to know before making protection decisions',
    'Explain how you would position the first engagement — what would you say to the CEO?',
    'Prepare the five most important discovery questions you would ask in the first meeting',
    'Create a preliminary risk hypothesis list — areas requiring validation through assessment'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Complete CoverScore Advisory Cycle Reference Guide',description:'Summary of all 12 stages, key questions, and the professional advisor\'s golden rule'},
    {url:'#',type:'doc',title:'Capstone Assessment Framework',description:'Full competency model, performance levels, and assessment criteria for the CCA 108 capstone'},
    {url:'#',type:'pdf',title:'Nexora Client Intelligence Brief',description:'Pre-engagement intelligence on Nexora Integrated Industries including business model, stakeholders, and known risk signals'}
  ])
);


C8[2] = L(
  hContent('Integrated Client Engagement Simulation',[
    'Prepare effectively for a complex client engagement',
    'Conduct pre-engagement research and develop a client intelligence brief',
    'Identify key client stakeholders and map their interests and influence',
    'Prepare a structured discovery plan with high-value questions',
    'Open a professional risk conversation and ask effective discovery questions',
    'Listen for explicit and hidden risk signals',
    'Distinguish symptoms from underlying risks',
    'Identify preliminary Risk Objects and recognise early Risk Relationships',
    'Develop preliminary risk hypotheses without presenting them as facts',
    'Transition the client from discovery to formal CoverScore assessment',
    'Avoid premature recommendations before sufficient understanding'
  ],[
    P('In Lesson 1 you learned the Complete CoverScore Advisory Cycle. Now you will put that principle into practice by entering your first full Integrated Client Engagement Simulation. You will assume the role of a CoverScore Risk Advisor engaged by Nexora Integrated Industries Limited — a growing Nigerian manufacturing and distribution business with complex operations, multiple stakeholders, significant assets, a growing workforce, technology dependencies, supply-chain exposures and an ambitious expansion strategy. You will not receive all the information at once. You must earn it through preparation, questioning, listening, observation, critical thinking and stakeholder engagement.'),
    C('The quality of your assessment can never be better than the quality of your discovery.'),
    T('The Seven Stages of the Simulation',['Stage','Focus'],[
      ['Stage 1 — Pre-Engagement Intelligence','What do you know before meeting the client?'],
      ['Stage 2 — Engagement Preparation','What do you need to discover?'],
      ['Stage 3 — Stakeholder Mapping','Who needs to be involved?'],
      ['Stage 4 — Discovery Conversation','What questions should you ask?'],
      ['Stage 5 — Risk Signal Detection','What is the client really telling you?'],
      ['Stage 6 — Initial Risk Mapping','What Risk Objects and Relationships are emerging?'],
      ['Stage 7 — Engagement Transition','Is the client ready for a formal CoverScore assessment?']
    ]),
    SE('Stage 1 — Pre-Engagement Intelligence','Before the first meeting, investigate: what does Nexora do? How does it make money? Who are its customers and what operations are critical? What industry risks apply? Where are major sites and critical assets? Who are critical employees? Where do raw materials come from? Which systems are critical? What creates revenue and major costs? What will expansion change?'),
    SE('Stage 2 — Engagement Preparation','Meeting objectives: understand the business, management\'s concerns, major risk areas, existing controls, and stakeholders. Determine whether a formal CoverScore assessment is appropriate. Propose an agenda: Introduction, Business Overview, Strategic Priorities, Risk Discussion, Existing Risk Management, Existing Protection, Key Concerns, Next Steps.'),
    T('Stage 3 — Stakeholder Map',['Stakeholder','Primary Concern','Advisor Priority'],[
      ['CEO','Growth, profitability, strategic risk','Understand strategic risk appetite'],
      ['CFO','Cost, cash flow, insurance spend, financial exposure','Understand financial impact and protection adequacy'],
      ['COO','Production, downtime, business continuity','Identify critical operational dependencies'],
      ['HR Director','Employee welfare, retention, talent','Understand people-related exposures'],
      ['IT Manager','Cybersecurity, data, systems','Understand technology dependencies'],
      ['Procurement Director','Suppliers, imports, raw materials','Identify supplier concentration and interruption risks'],
      ['Head of Logistics','Fleet, transportation, goods in transit','Understand transportation and logistics exposures']
    ]),
    SE('Stage 4 — The First Discovery Meeting','The CEO opens: "We have insurance. But we have grown significantly, and I\'m not sure our risk management has grown with us. I want to understand where we are vulnerable." The advisor\'s first question should be: "Can you walk me through how Nexora creates value and what could prevent the business from achieving its objectives?" NOT "What insurance policies do you have?"'),
    SE('The Golden Discovery Question','One of the most powerful questions: "What would happen if this stopped tomorrow?" Apply to: a factory, a key machine, a supplier, a technology system, a key employee, a vehicle fleet, a major customer. This moves the conversation from description to consequence.'),
    T('Risk Signal Types',['Signal Type','Description','Example'],[
      ['Explicit','What the client directly says','"We are becoming more dependent on technology"'],
      ['Hidden','What the statement implies','Increased tech dependency may increase cyber and BI exposure'],
      ['Emerging','What future changes could create','Expansion may increase geographic and regulatory exposure'],
      ['Connected','Risks that interact with one another','Technology failure leads to production interruption leads to customer loss']
    ]),
    SE('Stage 5 — Risk Signal Detection','The advisor should listen across four signal types and explore six dimensions: Business (what keeps the business running?), People (who is critical?), Assets (what would cause greatest disruption?), Dependencies (what external parties are depended on?), Finance (what creates greatest financial shock?), Change (what is changing that could change the risk profile?).'),
    SE('Discovery Simulation — Operations','Advisor asks COO: "What would happen if your main production line stopped tomorrow?" COO: "We would lose production capacity." Advisor: "How quickly would that affect customers?" COO: "Within 3-5 days." Advisor: "What happens after that?" COO: "Some customers could source from competitors." This identifies: Machinery Failure leads to Production Interruption leads to Delivery Delay leads to Customer Loss leads to Revenue Impact.'),
    SE('Discovery Simulation — Supply Chain','Advisor asks Procurement Director: "How dependent are you on individual suppliers?" Procurement Director: "For some imported materials, we have one main supplier." Advisor: "What happens if that supplier cannot deliver?" Response: "Alternative qualification could take several weeks." This identifies: Single Supplier leads to Supply Disruption leads to Raw Material Shortage leads to Production Interruption leads to Customer Delay.'),
    SE('Discovery Simulation — Technology','Advisor asks IT Manager: "What happens if critical systems become unavailable?" IT Manager: "We could continue for a short period, but manual processes would quickly become difficult. Probably two to three days." This identifies: Technology Dependency leads to System Failure leads to Operational Disruption leads to Business Interruption.'),
    SE('The First Risk Object Map','From discovery, the advisor identifies People (key employees, technical specialists, general workforce, contract workers), Property (factory, warehouse, office facilities), Equipment (production machinery, critical equipment, IT infrastructure), Technology (ERP, production planning, accounting/logistics systems, data), Supply Chain (raw materials, imported goods, key suppliers), Logistics (fleet, transportation, goods in transit), Operations (production, warehousing, distribution), Customers (major accounts, contracts, delivery commitments), Financial (revenue, cash flow, BI exposure), Reputation (customer confidence, market reputation), Strategic (expansion, geographic growth, operational scaling).'),
    SE('The Most Important Discovery','The CEO reveals: "I don\'t think we know exactly how long we could survive a major interruption." This is the most important discovery — the client\'s real concern is not "do we have insurance?" but "do we understand our resilience?" This becomes a central theme of the formal assessment.'),
    SE('Stage 6 — Initial Risk Hypotheses','From discovery, the advisor develops preliminary hypotheses requiring validation: 1) Nexora may have significant BI exposure. 2) Supply chain concentration risk exists. 3) Technology dependency exceeds current controls. 4) Rapid growth may have created gaps between asset values and protection. 5) Key-person dependency creates operational vulnerability. 6) Expansion introduces new geographical and operational risks. 7) The existing insurance programme may not reflect the current risk profile.'),
    SE('Stage 7 — Transition to Formal Assessment','The advisor explains: What will be assessed (the complete risk environment), Why (to map Risk Objects and identify gaps), How (stakeholder interviews, data collection, CoverScore methodology), Who needs to participate, When the assessment will occur, and What the client will receive (Risk Fingerprint, Protection Gap Analysis, Protection Strategy, Executive Risk Report).'),
    C('You cannot assess what you have not discovered. You cannot advise what you have not understood. And you cannot protect what you have not properly identified.')
  ],[
    'The quality of your assessment can never be better than the quality of your discovery',
    'The most powerful question: "What would happen if this stopped tomorrow?"',
    'The advisor must listen for explicit, hidden, emerging and connected risk signals',
    'Develop preliminary risk hypotheses — but never present them as established facts'
  ]),
  hQuiz([
    Q('What is the primary purpose of the first client engagement?',['Sell insurance','Collect premium','Understand the client\'s business and risk environment','Prepare a quotation'],2,'The purpose is to understand the client\'s business and risk environment.'),
    Q('Why should the advisor research the client before the meeting?',['To impress the client','To reduce the need for questions','To develop informed hypotheses and ask better questions','To prepare a sales pitch'],2,'Pre-engagement research enables better questions.'),
    Q('What is the difference between a Risk Object and a Risk Relationship?',['A Risk Object is an exposed entity; a Risk Relationship shows how risks affect connected entities','They mean the same thing','Risk Objects are insurance policies','Risk Relationships are financial products'],0,'Risk Objects are exposed entities; Risk Relationships show connections.'),
    Q('The client says: "We have never experienced a major loss." What should the advisor do?',['Conclude the client is low risk','Accept the risk is insignificant','Explore whether absence of past loss creates false security','Recommend more insurance immediately'],2,'Explore whether the absence of past loss creates a false sense of security.'),
    Q('What is the best response to "We already have insurance"?',['"Then you don\'t need an assessment"','"Let\'s sell you additional policies"','"Let\'s assess whether your protection reflects your actual risk profile"','"Your insurer should handle everything"'],2,'Assess whether protection reflects the current risk profile.'),
    Q('Why move from "What do you have?" to "What happens if it fails?"',['To make the meeting longer','To understand consequences and risk relationships','To increase premium','To avoid discussing insurance'],1,'Understanding consequences and risk relationships is the objective.'),
    Q('Which statement represents a risk hypothesis?',['"Nexora definitely has inadequate insurance"','"Nexora may have a significant BI exposure requiring validation"','"Nexora needs a new policy"','"The CFO should buy more insurance"'],1,'A hypothesis is an interpretation requiring validation.'),
    Q('When should the advisor recommend specific insurance products?',['Before meeting the client','At the beginning of discovery','After sufficient understanding, assessment and gap analysis','Before identifying Risk Objects'],2,'Recommendations come after understanding, assessment and gap analysis.'),
    Q('A client says: "Our data is backed up." What should the advisor ask next?',['"Great"','"How much did the backup cost?"','"How quickly can you restore critical systems?"','"Do you have cyber insurance?"'],2,'The follow-up should explore recovery capability, not just existence of backups.'),
    Q('What is the most important outcome of successful discovery?',['A quotation','A policy sale','Clear understanding of the client\'s risk environment and agreement on next steps','A premium payment'],2,'Clear understanding and agreement on next steps is the goal.')
  ]),
  hScript('Integrated Client Engagement Simulation',[
    'You are now entering your first full Integrated Client Engagement Simulation. Your client is Nexora Integrated Industries — a growing Nigerian manufacturing and distribution business with complex operations.',
    'Before the first meeting, prepare. Investigate what Nexora does, how it makes money, who its customers are, what operations are critical. The quality of your preparation determines the quality of your questions.',
    'Seven stakeholders are involved: the CEO focused on growth, the CFO on cost, the COO on production, the HR Director on people, the IT Manager on technology, the Procurement Director on supply chain, and the Head of Logistics on transport. Each holds a piece of the risk puzzle.',
    'When you enter the boardroom, the CEO will tell you: "We have insurance. But I\'m not sure our risk management has grown with us." Your first question should be about how the business creates value — not about what insurance they hold.',
    'Throughout the discovery conversation, listen for four types of risk signals: explicit signals in what the client says directly, hidden signals in what their words imply, emerging signals in what future changes could create, and connected signals in how risks interact.',
    'Apply the golden discovery question: "What would happen if this stopped tomorrow?" Ask it about the factory, the key machine, the main supplier, the critical system, the key employee. The answers will reveal risk relationships.',
    'By the end of discovery, you should have a preliminary Risk Object map and a set of risk hypotheses. These are not conclusions — they are areas requiring validation through the formal assessment.',
    'The transition to formal assessment should include: what will be assessed, why it is necessary, how information will be collected, who needs to participate, and what the client will receive. Never move to recommendations until the assessment is complete.'
  ]),
  hWorkbook([
    {t:'Build Your Pre-Engagement Brief',i:'Prepare a one-page Nexora Client Intelligence Brief covering the following areas:',p:['Business Summary — what does Nexora do?','Operating Model — how does it create value?','Key Risk Assumptions — what risks do you hypothesise?','Potential Risk Objects — list at least 10','Key Unknowns — what don\'t you know yet?','Stakeholders to Engage — who and why?','Initial Discovery Questions — 10 questions','Areas Requiring Evidence — what must be validated?']},
    {t:'Ask the Next Question',i:'For each client statement, identify the hidden risk signal and write your follow-up question.',p:['"We\'ve never had a major fire."','"Our main supplier has never failed us."','"Our systems are backed up."','"Our key engineer has been with us for 18 years."','"We have insurance for business interruption."']},
    {t:'Build Your Discovery Plan',i:'Create 15 questions for the Nexora engagement covering:',p:['Business questions (3)','Risk questions (3)','Financial questions (2)','People questions (2)','Technology questions (2)','Supply-chain questions (2)','Growth questions (1)']},
    {t:'The Hidden Dependency Case Study',i:'70% of production depends on one specialised machine. The machine is 9 years old. The manufacturer has no local service centre. A critical replacement component takes 8-12 weeks to import. The sum insured was based on original purchase price. No formal BI analysis in 3 years. The CFO says "the machine is insured, so we\'re protected." Write your response.'}
  ]),
  hCase('Nexora Discovery Simulation','Nexora Integrated Industries — 420 employees, 80 contract workers, 35 field sales staff, approximately $7.5M revenue, manufacturing and industrial distribution. The CEO has invited the CoverScore Advisor for an initial meeting. Existing insurance includes Fire & Special Perils, Business Interruption, Group Life, Group Personal Accident, Motor, Goods in Transit, Public Liability and Marine Cargo. The CEO\'s opening statement: "We have insurance. I don\'t want another insurance sales presentation. I want to know what could seriously hurt this business."',[
    'Prepare a pre-engagement intelligence brief',
    'Create a stakeholder map identifying all seven stakeholders, their concerns, and your information priority for each',
    'Write your opening question — the first thing you say after the CEO\'s opening statement',
    'Identify at least 10 risk signals from the CEO\'s statement that the company has grown rapidly and systems may not be ready',
    'Map the likely Risk Objects and Risk Relationships you expect to find',
    'Develop a discovery plan with questions for each stakeholder',
    'Write your transition statement — how you move the client from discovery to formal assessment'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Client Intelligence Brief Template',description:'Template for pre-engagement research and preparation'},
    {url:'#',type:'doc',title:'Discovery Question Bank',description:'60+ discovery questions across all six dimensions of client risk exploration'},
    {url:'#',type:'pdf',title:'Risk Signal Detection Guide',description:'Framework for identifying explicit, hidden, emerging and connected risk signals'}
  ])
);


C8[3] = L(
  hContent('Complex Risk Intelligence & CoverScore Assessment',[
    'Explain the difference between information, evidence and risk intelligence',
    'Validate client information before using it in an assessment',
    'Identify and classify Risk Objects across the client ecosystem',
    'Map Risk Objects to appropriate Risk Pillars',
    'Identify relationships between interconnected risks',
    'Distinguish direct risks from cascading risks',
    'Identify risk concentration, dependency and systemic risk',
    'Assess likelihood, severity, control effectiveness, concentration and recovery resilience',
    'Apply the CoverScore Risk Scoring Framework consistently',
    'Interpret a CoverScore assessment beyond the headline score',
    'Construct a meaningful Risk Fingerprint for the client',
    'Prepare the assessment for Protection Gap Analysis'
  ],[
    P('In Lesson 2 you conducted the initial discovery conversation and developed preliminary risk hypotheses. Now the engagement moves to the next stage: turning raw client information into structured, defensible risk intelligence. Your job is to validate the discovery findings and apply the CoverScore methodology systematically. The objective is not simply to produce a score — it is to create an accurate, defensible picture of the client\'s risk environment that drives appropriate action.'),
    C('A score is not the conclusion. A score is a signal that helps the advisor understand where attention is required.'),
    T('The CoverScore Risk Intelligence Model — Seven Questions',['Question','Purpose'],[
      ['What is exposed?','Identify the Risk Object'],
      ['What can happen?','Identify the risk event'],
      ['Why can it happen?','Identify causes and vulnerabilities'],
      ['What would happen?','Identify consequences'],
      ['What controls exist?','Identify prevention and mitigation measures'],
      ['How effective are the controls?','Evaluate control strength'],
      ['What remains exposed?','Determine residual risk']
    ]),
    SE('Facts, Assumptions and Hypotheses','A professional advisor must distinguish: Fact (supported by evidence, e.g. "the main production line accounts for 70% of capacity"), Assumption (believed true but unverified, e.g. "the BI sum insured may be inadequate"), and Hypothesis (a professional interpretation requiring testing, e.g. "Nexora may have significant BI concentration because several Risk Objects could cause the same operational outcome"). Never present a hypothesis as an established fact.'),
    SE('The First Data Conflict','Insurance schedule states: main production machinery value $4M. Asset register states: current replacement value $6.5M. CFO explains: "The machinery was purchased for $4M." The advisor must identify potential issues: underinsurance, valuation basis, replacement cost, inflation, import costs, duties, installation, and specification changes. This is a data validation issue that may become a protection gap.'),
    T('Risk Pillar Classification',['Pillar','Description'],[
      ['People Risk','Risks affecting employees, management and human capability'],
      ['Property & Asset Risk','Risks affecting physical assets and infrastructure'],
      ['Operational Risk','Risks affecting processes and day-to-day operations'],
      ['Financial Risk','Risks affecting revenue, costs, liquidity and financial resilience'],
      ['Liability Risk','Risks from legal responsibilities to employees, customers and third parties'],
      ['Technology & Cyber Risk','Risks affecting systems, data and digital infrastructure'],
      ['Supply Chain Risk','Risks from dependencies on suppliers and external partners'],
      ['Logistics Risk','Risks associated with transportation and movement of goods'],
      ['Strategic Risk','Risks from business decisions, growth and strategic direction'],
      ['Reputational Risk','Risks that damage stakeholder trust and brand reputation'],
      ['Regulatory & Compliance Risk','Risks from legal, regulatory and contractual obligations']
    ]),
    SE('Multi-Pillar Exposure','One Risk Object may create exposure across multiple pillars. A machinery failure creates: Property & Asset Risk leads to Operational Risk leads to Financial Risk leads to Customer Risk leads to Reputational Risk. The advisor must avoid thinking "this is just a machinery risk" and instead recognise it as a multi-pillar exposure.'),
    T('Cascading vs Isolated Risk',['Type','Description','Example'],[
      ['Isolated Risk','Limited consequences outside immediate area','Minor office equipment damage'],
      ['Cascading Risk','Triggers consequences across multiple areas','Cyber incident leads to system failure leads to production disruption leads to delivery delays leads to contractual consequences leads to revenue loss leads to reputational damage']
    ]),
    SE('Risk Concentration at Nexora','Assessment reveals: 70% of production depends on one production line. 60% of a critical raw material from one supplier. 80% of logistics depends on one third-party provider. 40% of revenue from five major customers. Critical technical processes depend on a small number of specialists. The advisor should ask: "How many independent failure points could produce a major business interruption?" The answer: more than management initially realised.'),
    SE('The Single-Point-of-Failure Test','For every critical Risk Object ask: "If this failed tomorrow, could the organisation continue operating?" If yes, how long? If partially, what functions continue? If no, what is the estimated recovery time? Then ask: "What other Risk Objects would be affected?"'),
    T('CoverScore Risk Scoring Dimensions',['Dimension','1 (Very Low)','5 (Very High)'],[
      ['Likelihood','Remote probability','Almost certain'],
      ['Impact','Negligible consequences','Catastrophic consequences'],
      ['Control Effectiveness','Strong, tested controls','No effective controls'],
      ['Concentration','Fully diversified','Complete dependency'],
      ['Recovery Resilience','Rapid recovery planned','Extended recovery impossible']
    ]),
    T('Example — Machinery Dependency Assessment',['Dimension','Score','Rationale'],[
      ['Likelihood','3 (Moderate)','Ageing machine, moderate maintenance frequency'],
      ['Impact','5 (Very High)','70% of production capacity dependent on this machine'],
      ['Control Effectiveness','2 (Weak)','No redundancy, limited spare parts'],
      ['Concentration','5 (Very High)','Single machine carries majority of production'],
      ['Recovery Resilience','2 (Weak)','Extended replacement lead time, no contingency']
    ]),
    SE('The Critical Insight — Systemic Risk','The advisor notices that several risks converge on the same outcome: Machinery Failure leads to Production Interruption. Supplier Failure leads to Production Interruption. Technology Failure leads to Production Interruption. Key Person Loss leads to Production Interruption. BUSINESS INTERRUPTION IS A SYSTEMIC RISK. The client may have multiple apparently separate risks, but they share one major consequence: loss of operational continuity.'),
    SE('The Compound Risk Scenario','The advisor asks: "What happens if two risks occur at the same time?" Consider: Supplier disruption combines with Machine failure leads to Production stops leads to Recovery delayed leads to Business Interruption extends. The advisor should ask: "Which of these risks can be mitigated before the event occurs?" This shifts the discussion from insurance to resilience.'),
    T('Preliminary Nexora Risk Fingerprint',['Exposure Level','Risk Areas'],[
      ['Very High','Business continuity, asset concentration, technology dependency'],
      ['High','Supply chain, key person, strategic expansion, customer concentration'],
      ['Moderate','Logistics, fleet']
    ]),
    SE('The Risk Fingerprint is Not a Report Card','A Risk Fingerprint does not tell the client "you are a bad business." It tells them: "This is where your risk is concentrated." The purpose is prioritisation — determining what needs immediate attention, what requires deeper analysis, what can be monitored, and what controls should be improved.'),
    SE('The Assessment Conversation','CEO: "So you\'re saying our biggest risk isn\'t fire?" Advisor: "Fire remains important, but the assessment suggests your greatest exposure may be the concentration of multiple risks around business continuity. The key question is whether Nexora can remain resilient when one or more of these events occur." This is the moment the advisor moves from insurance analysis to risk intelligence.'),
    SE('The CFO Challenge','CFO: "We already spend a lot on insurance. Are you saying we need to spend even more?" Advisor: "Not necessarily. The assessment identifies where your greatest exposures are. Some may require stronger controls, some contingency planning, some diversification, some financial reserves, some insurance. The purpose is to determine the most appropriate response for each risk."'),
    C('Data quality is part of risk quality. An impressive-looking assessment is professionally weak if built on outdated values, incomplete information, unsupported assumptions, or inaccurate data.')
  ],[
    'The CoverScore Risk Intelligence Model asks seven questions for every significant exposure',
    'Distinguish facts, assumptions and hypotheses — never present a hypothesis as established fact',
    'Multiple independent risks may converge on one systemic outcome — identify the common consequence',
    'The Risk Fingerprint prioritises attention — it does not judge the client'
  ]),
  hQuiz([
    Q('What is the primary purpose of risk intelligence?',['To sell more insurance','To convert information into actionable understanding of risk','To calculate commission','To replace client discussions'],1,'Risk intelligence converts information into actionable understanding.'),
    Q('What is the difference between a fact and a risk hypothesis?',['They are identical','A fact is supported by evidence; a hypothesis is an interpretation requiring validation','A hypothesis is always correct','Facts are opinions'],1,'Facts are evidence-based; hypotheses require validation.'),
    Q('Why map Risk Objects to Risk Pillars?',['To increase premium','To organise and understand the dimensions of exposure','To eliminate the need for assessment','To determine commission'],1,'Mapping organises and clarifies the dimensions of exposure.'),
    Q('What is a cascading risk?',['A risk with no consequences','A risk whose consequences spread across multiple connected areas','A minor risk','An insurance product'],1,'Cascading risks spread consequences across connected areas.'),
    Q('Why is concentration risk important?',['It makes insurance cheaper','It increases vulnerability when critical activities depend on one source','It eliminates business interruption','It guarantees a claim'],1,'Concentration increases vulnerability to single-point failure.'),
    Q('What is the purpose of the Risk Fingerprint?',['Calculate commission','Visually communicate where risk is concentrated','Replace risk assessment','Determine insurer profit'],1,'The Risk Fingerprint visually communicates risk concentration.'),
    Q('What should the advisor do when two documents contain conflicting information?',['Choose whichever supports the recommendation','Ignore the conflict','Validate and determine which is accurate and relevant','Use the newest document automatically'],2,'Validate conflicting information to determine accuracy.'),
    Q('What does a high risk score mean?',['The client must buy insurance','The risk requires attention and further interpretation','The advisor should increase commission','The client has failed'],1,'A high score signals attention is needed, not a specific solution.'),
    Q('Why examine compound risks?',['Risks always occur independently','Multiple risks can interact and create significantly greater consequences','Compound risks are easier to insure','They eliminate the need for controls'],1,'Compound risks can create greater consequences than individual risks.'),
    Q('Which best represents professional risk intelligence?',['"Nexora needs more insurance"','"Nexora has high risk"','"Several independent Risk Objects could cause BI, suggesting a systemic resilience exposure"','"The client has too many policies"'],2,'Professional intelligence identifies systemic exposures with nuanced interpretation.')
  ]),
  hScript('Complex Risk Intelligence & CoverScore Assessment',[
    'You have conducted discovery and developed preliminary risk hypotheses. Now you must turn that raw information into structured, defensible risk intelligence. This is where the CoverScore methodology becomes operational.',
    'The advisor\'s role changes at this point. During discovery you asked "what is happening?" Now you ask "what does it mean?" You are moving from statement to evidence, from evidence to risk, from risk to impact, from impact to intelligence.',
    'For every significant exposure, answer seven questions: What is exposed? What can happen? Why can it happen? What would happen? What controls exist? How effective are the controls? What remains exposed?',
    'One of the most important skills is distinguishing facts from assumptions from hypotheses. A hypothesis is not a conclusion — it is a professional interpretation that must be tested. Never present a hypothesis as an established fact.',
    'A single Risk Object can create exposure across multiple Risk Pillars. A machinery failure is not just a property risk — it is an operational risk, a financial risk, a customer risk, and a reputational risk. See the ecosystem, not just the individual risk.',
    'The critical insight for Nexora is that several independent risks — machinery dependency, supplier concentration, technology dependency, key-person dependency — all converge on the same outcome: business interruption. This is a systemic risk.',
    'The Risk Fingerprint communicates where risk is concentrated. It is not a report card. It tells the client where to focus attention first. The score is a signal, not the conclusion.',
    'When challenged by the CFO about cost, explain: the assessment does not automatically lead to more insurance. It identifies where the greatest exposures are and helps determine the most appropriate response for each.'
  ]),
  hWorkbook([
    {t:'Fact or Hypothesis?',i:'Classify each statement about Nexora as Fact, Assumption, or Hypothesis.',p:['"Nexora has $4M of machinery insurance"','"Nexora is underinsured"','"The current replacement value is $6.5M"','"The insurance programme will fully replace the machinery"','"The machinery valuation should be reviewed"','"Nexora may have unvalidated BI exposure"']},
    {t:'Build the Risk Intelligence Matrix',i:'Complete for at least 10 Risk Objects across the Nexora ecosystem.',p:['Risk Object identified','Risk event description','Root cause analysis','Impact analysis','Existing controls identified','Control gaps identified','Related risks mapped','Priority level assigned']},
    {t:'The Single-Point-of-Failure Analysis',i:'Apply the single-point-of-failure test to Nexora\'s critical dependencies.',p:['Main production machine — what happens if it fails?','Single key supplier — what if they cannot deliver?','ERP system — what if it becomes unavailable?','Technical specialist — what if they leave?','Major customer — what if they switch suppliers?']},
    {t:'Risk Fingerprint Interpretation',i:'Nexora\'s preliminary assessment shows Very High exposure in business continuity and asset concentration, High in supply chain and key person. Write an executive summary explaining what this means in business language and what priorities it suggests.'}
  ]),
  hCase('Nexora CoverScore Assessment','Nexora Integrated Industries has provided additional documents: insurance schedule, asset register, supplier list, fleet schedule, employee summary, business continuity document, IT disaster recovery policy, claims history, expansion plan, and management risk questionnaire. Key findings: machinery insured for $4M but replacement value is $6.5M. 70% of production depends on one machine with 8-12 week replacement lead time. 60% of critical raw material from one supplier. Technology dependency increasing rapidly with limited recovery testing. Business continuity plan untested for 2 years. Cyber controls still developing.',[
    'Validate the information — identify data conflicts and areas requiring clarification',
    'Identify and classify at least 15 Risk Objects across all relevant Risk Pillars',
    'Map at least 10 Risk Relationships showing cascading and interconnected exposures',
    'Assess the critical machinery exposure across all five scoring dimensions',
    'Identify the systemic risk(s) — what common outcome do multiple risks share?',
    'Construct a preliminary Risk Fingerprint for Nexora',
    'Write a two-minute executive explanation of the assessment results',
    'Prepare for the CFO challenge: "We already spend a lot on insurance"'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'CoverScore Risk Scoring Framework Reference',description:'Scoring dimensions, criteria, and interpretation guide for the CoverScore Risk Scoring Framework'},
    {url:'#',type:'doc',title:'Risk Intelligence Matrix Template',description:'Structured template for building a complete risk intelligence assessment'},
    {url:'#',type:'pdf',title:'Risk Fingerprint Construction Guide',description:'How to build and interpret the client\'s Risk Fingerprint for executive communication'}
  ])
);


C8[4] = L(
  hContent('Protection Strategy & Executive Advisory Simulation',[
    'Explain the purpose and methodology of Protection Gap Analysis',
    'Identify gaps between risk exposure and existing protection',
    'Distinguish a risk gap from an insurance gap',
    'Determine when insurance is the appropriate response',
    'Apply the CoverScore Risk Response Framework with eight treatment options',
    'Design integrated protection strategies combining multiple responses',
    'Evaluate insurance adequacy across the portfolio',
    'Build a phased protection roadmap with clear priorities',
    'Present recommendations to senior management in business language',
    'Defend recommendations under executive challenge',
    'Secure management agreement on implementation priorities'
  ],[
    P('In Lesson 3 you transformed Nexora\'s raw information into structured risk intelligence. Now you face the most important advisory question: "Now that we understand the risks, what should the client do about them?" This lesson moves you from risk intelligence through Protection Gap Analysis to an integrated Protection Strategy. The professional advisor does not ask "what policy can I sell?" The advisor asks "what is the most appropriate way to protect the client\'s objectives against this exposure?"'),
    C('Do not use insurance to solve a problem that should first be solved through risk control. Insurance is most effective when it complements strong risk management.'),
    T('The CoverScore Risk Response Framework — Eight Options',['Response','When to Use'],[
      ['Avoid','Stop the activity creating unacceptable exposure'],
      ['Reduce','Lower the likelihood or severity of the event'],
      ['Control','Introduce stronger preventive or corrective measures'],
      ['Diversify','Reduce dependency on a single source or asset'],
      ['Retain','Accept the risk within the organisation\'s risk appetite'],
      ['Finance','Set aside financial resources for expected or retained losses'],
      ['Transfer','Shift financial responsibility through contracts or other mechanisms'],
      ['Insure','Transfer defined financial consequences to an insurer']
    ]),
    SE('Protection Gap Analysis Defined','A protection gap exists when the client\'s actual exposure exceeds the level of protection available. Protection includes risk controls, business continuity plans, financial reserves, diversification, contracts, insurance, alternative suppliers, redundancy, and emergency response. Protection is broader than insurance — this distinction is fundamental to CoverScore advisory practice.'),
    T('Risk Gap vs Insurance Gap',['Gap Type','Definition','Example'],[
      ['Risk Gap','Exposure not adequately controlled or managed','Nexora depends on one critical machine without contingency plan — solution includes maintenance, spare parts, redundancy, BCP'],
      ['Insurance Gap','Risk exists but existing insurance does not adequately respond','Nexora\'s machinery insured at outdated value — solution includes updated valuation, revised sum insured, correct policy basis']
    ]),
    SE('Nexora\'s Top Five Priorities','Based on the Lesson 3 assessment: Priority 1 — Business Continuity & Operational Resilience (multiple independent risks converge on BI). Priority 2 — Critical Asset Concentration (70% production on one machine). Priority 3 — Technology Dependency & Cyber Resilience. Priority 4 — Supply Chain Concentration. Priority 5 — People & Key-Person Dependency.'),
    T('Priority 1 — Business Continuity Strategy',['Layer','Actions'],[
      ['Risk Control','Develop comprehensive BCM framework, improve preventive maintenance'],
      ['Risk Resilience','Define recovery time objectives, create critical spare-parts inventory'],
      ['Financial Resilience','Review financial reserves for uninsured interruption period'],
      ['Risk Transfer','Review BI coverage, Machinery Breakdown, relevant extensions']
    ]),
    T('Priority 2 — Critical Asset Strategy',['Layer','Actions'],[
      ['Risk Control','Strengthen preventive maintenance, implement condition monitoring'],
      ['Risk Resilience','Stock critical replacement components, develop alternative production'],
      ['Financial Resilience','Emergency reserves for extended downtime'],
      ['Risk Transfer','Review Machinery Breakdown, Fire & Special Perils, All Risks, BI']
    ]),
    T('Priority 3 — Technology & Cyber Strategy',['Layer','Actions'],[
      ['Risk Control','Strengthen cybersecurity, implement MFA, conduct vulnerability assessments'],
      ['Risk Resilience','Test system recovery, develop incident response procedures'],
      ['Financial Resilience','Budget for incident response and recovery costs'],
      ['Risk Transfer','Evaluate Cyber Insurance where appropriate']
    ]),
    T('Priority 4 — Supply Chain Strategy',['Layer','Actions'],[
      ['Risk Control','Qualify alternative suppliers, increase strategic inventory buffers'],
      ['Risk Resilience','Create alternative logistics routes, monitor supplier financial health'],
      ['Financial Resilience','Financial contingency for supply disruption'],
      ['Risk Transfer','Review Goods in Transit, Marine Cargo, contingent BI']
    ]),
    T('Priority 5 — People Strategy',['Layer','Actions'],[
      ['Risk Control','Cross-train employees, document critical processes, develop succession plans'],
      ['Risk Resilience','Improve employee retention, create knowledge transfer systems'],
      ['Financial Resilience','Benefits and compensation programmes'],
      ['Risk Transfer','Review Group Life, GPA, evaluate Key Person protection']
    ]),
    SE('Executive Advisory Simulation','The CEO says: "Don\'t give us a 100-page report. Tell us our top risks, biggest gaps, what to do first, and how much it will cost." The advisor must deliver an executive-level presentation covering: executive message, top 3-5 priorities, protection gaps, strategic response, priorities, investment, roadmap, and management decisions required.'),
    T('Executive Presentation Structure',['Section','Content'],[
      ['Executive Message','One clear summary of risk position and recommended path forward'],
      ['Top Risks','Three to five priorities with rationale'],
      ['Protection Gaps','Where current protection is insufficient'],
      ['Strategic Response','What should change and why'],
      ['Priorities','What should happen first, second, third'],
      ['Investment','What resources may be required'],
      ['Roadmap','When actions should happen across four phases'],
      ['Decision','What management needs to approve']
    ]),
    SE('Executive Challenge — "How Much Will It Cost?"','CFO asks about cost. Professional response: "The investment depends on the final scope of improvements and restructuring. I recommend prioritising the highest-impact actions first, obtaining validated implementation costs, and comparing those against the potential financial consequences of the exposures. We should distinguish between one-time investments, recurring costs and insurance premiums."'),
    SE('Executive Challenge — "We Can\'t Do Everything"','COO says they cannot implement all recommendations at once. Advisor responds: "Agreed. The objective is to prioritise based on risk significance, urgency, cost and feasibility. I propose immediate actions, 90-day actions and longer-term resilience initiatives."'),
    SE('Executive Challenge — "Why Not Just Buy More Insurance?"','CEO asks why not simply increase insurance. Advisor: "Insurance addresses financial consequences but cannot eliminate the underlying dependency. If the business remains dependent on one machine or supplier, additional insurance does not make the business more resilient. Our strategy reduces the likelihood and duration of disruption while ensuring remaining financial consequences are appropriately transferred."'),
    T('Phased Protection Roadmap',['Phase','Timing','Focus'],[
      ['Phase 1','0-30 days','Validate critical asset values, BI values, dependencies, recovery capability'],
      ['Phase 2','30-90 days','Strengthen maintenance, test DR, improve cyber controls, identify alternative suppliers'],
      ['Phase 3','90-180 days','Diversify suppliers, develop alternative production, implement formal BCM'],
      ['Phase 4','180-365 days','Complete insurance restructuring, implement ongoing risk monitoring, annual reassessment']
    ]),
    C('The strongest advisors do not ask "what product can I sell?" They ask "what combination of actions will best protect this client\'s people, assets, operations, finances and future?"')
  ],[
    'Protection is broader than insurance — it includes controls, resilience, financial preparedness and risk transfer',
    'Eight risk responses are available — insurance is one option, not the automatic answer',
    'Every significant risk should be addressed through a layered strategy combining multiple responses',
    'Executive communication must translate technical risk language into business decisions'
  ]),
  hQuiz([
    Q('What is the primary purpose of Protection Gap Analysis?',['To sell more policies','To identify where actual risk exposure exceeds existing protection','To reduce all insurance premiums','To replace the CoverScore assessment'],1,'Protection Gap Analysis identifies where exposure exceeds protection.'),
    Q('Which is the best response to a critical machinery dependency?',['Buy insurance only','Ignore the dependency','Combine maintenance, resilience, redundancy and appropriate insurance','Increase premium immediately'],2,'The best response combines multiple approaches — controls, resilience, redundancy and insurance.'),
    Q('What is the difference between a risk gap and an insurance gap?',['There is no difference','A risk gap reflects inadequate risk management; an insurance gap reflects inadequate financial risk transfer','An insurance gap is always more serious','A risk gap only applies to property'],1,'Risk gaps involve overall risk management; insurance gaps involve financial risk transfer.'),
    Q('What is the primary purpose of risk control?',['To increase premium','To reduce likelihood or severity','To replace insurance completely','To increase commissions'],1,'Risk control reduces likelihood or severity of loss.'),
    Q('What is the best response to "We need cheaper insurance"?',['Automatically reduce coverage','Find the cheapest insurer','Optimise the programme while maintaining appropriate protection','Cancel policies without assessment'],2,'Optimise the programme while maintaining appropriate protection.'),
    Q('Why should insurance not be the first response to every risk?',['Insurance is never useful','Some risks are better managed through avoidance, controls, diversification or resilience','Insurance is illegal','Clients should never buy insurance'],1,'Insurance is one of many responses — others may be more appropriate.'),
    Q('What makes a protection strategy integrated?',['Many insurance products','Combination of risk control, resilience, financial preparedness and risk transfer','Highest premium','Eliminating every possible risk'],1,'An integrated strategy combines all four layers of protection.'),
    Q('What should an executive presentation focus on?',['Technical policy wording','Every minor risk','Risks that matter, consequences, gaps and recommended decisions','Insurance product features only'],2,'Executive presentations focus on material risks, consequences and decisions.'),
    Q('What should the advisor do when management cannot implement all recommendations?',['Insist everything be done immediately','Prioritise based on risk significance, urgency, cost and feasibility','Recommend nothing','Focus only on insurance'],1,'Prioritisation enables realistic implementation.'),
    Q('What is the ultimate objective of a CoverScore Protection Strategy?',['Maximise premium','Eliminate all risk','Align treatment and protection with client objectives, risk appetite and resilience needs','Sell every available policy'],2,'The objective is alignment with the client\'s objectives and risk appetite.')
  ]),
  hScript('Protection Strategy & Executive Advisory Simulation',[
    'Now that we understand Nexora\'s risks, we must answer: "What should the client do about them?" This is where risk intelligence becomes action. The advisor must design a protection strategy that is technically sound, commercially realistic and genuinely valuable to the client.',
    'The first step is Protection Gap Analysis. For each significant risk, ask: what controls exist? What insurance exists? What is the gap between the exposure and the protection? Remember that protection is broader than insurance.',
    'The CoverScore Risk Response Framework offers eight options: Avoid, Reduce, Control, Diversify, Retain, Finance, Transfer, Insure. These are not mutually exclusive. A sophisticated strategy often combines several responses for each risk.',
    'For Nexora, the top priority is business continuity. Several independent risks — machinery failure, supplier disruption, cyber incident, key-person loss — all converge on the same outcome: business interruption. The strategy must address all of these through an integrated approach.',
    'The protection strategy has four layers: Risk Control to prevent the event, Risk Resilience to continue operating, Financial Resilience to absorb losses, and Risk Transfer including insurance where appropriate. Each major risk needs all four layers considered.',
    'When presenting to executives, do not give them a 100-page report. Give them: the executive message, top 3-5 risks, biggest gaps, strategic response, priorities, investment outline, roadmap, and decisions needed. Use business language, not insurance jargon.',
    'Expect challenges: "How much will it cost?" "We can\'t do everything." "Why not just buy more insurance?" "We\'ve never had a major loss." Each challenge must be answered professionally with evidence and client focus.',
    'The strongest advisors do not sell policies. They design protection strategies that combine risk control, resilience, financial preparedness and appropriate risk transfer for the client\'s specific reality.'
  ]),
  hWorkbook([
    {t:'Build a Protection Gap Analysis',i:'Select five significant Nexora risks. For each, identify:',p:['The specific risk exposure','Existing controls and their effectiveness','Existing insurance and its adequacy','The protection gap (what remains exposed)','Recommended response (from eight options)','Responsible stakeholder','Priority level','Target completion date']},
    {t:'Design a Four-Layer Strategy',i:'For each of these four scenarios, design a complete four-layer protection strategy covering risk control, resilience, financial resilience, and risk transfer.',p:['Machinery failure at Nexora','Cyber incident at Nexora','Key person loss at Nexora','Supply chain disruption at Nexora']},
    {t:'Executive Pitch — Five Minutes',i:'Prepare and deliver a five-minute pitch answering "Why should Nexora invest in improving its protection strategy?" Include current risk environment, key exposure, consequences, protection gaps, recommended actions, and business value.'},
    {t:'The Executive Objection Simulator',i:'Respond professionally to each objection:',p:['"We cannot afford this"','"We\'ve never had a major loss"','"Our current insurer already covers us"','"Why do we need another assessment?"','"Can\'t our internal team handle this?"']}
  ]),
  hCase('Nexora Executive Advisory Simulation','The advisor has completed the CoverScore assessment and Protection Gap Analysis. Top five priorities identified: Business Continuity & Resilience (critical), Critical Asset Concentration (critical), Technology & Cyber (critical), Supply Chain (high), Key-Person Dependency (high). The CEO invites the advisor to present to the executive committee. The CFO is concerned about cost. The COO wants practical solutions. The CEO asks: "What three things should we do this year?"',[
    'Prepare a 10-slide executive presentation following the recommended structure',
    'Write the executive message — one paragraph summarising the current position and path forward',
    'Develop the phased roadmap covering 0-30 days, 30-90 days, 90-180 days, and 180-365 days',
    'Prepare responses to each executive challenge: cost, feasibility, insurance-only, past loss experience',
    'Recommend the three most important actions for the first year — and defend your prioritisation',
    'Create a Protection Strategy Scorecard with objectives, current state, target, owner, and timeline'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Protection Gap Analysis Template',description:'Structured template for identifying gaps between risk exposure and existing protection'},
    {url:'#',type:'doc',title:'Integrated Protection Strategy Framework',description:'Guide to building four-layer protection strategies combining control, resilience, financial preparedness and risk transfer'},
    {url:'#',type:'pdf',title:'Executive Risk Presentation Template',description:'10-slide executive presentation template with structure and content guidance'}
  ])
);


C8[5] = L(
  hContent('Business Development, Conversion & Client Growth Simulation',[
    'Identify genuine commercial opportunities from a CoverScore assessment',
    'Translate risk findings into client value propositions',
    'Build a Business Opportunity Map distinguishing immediate, strategic and relationship opportunities',
    'Structure an advisory-led conversion conversation',
    'Handle procurement and price pressure without discounting value prematurely',
    'Respond to the "cheapest quote" challenge professionally',
    'Manage multiple decision-makers with stakeholder-specific value communication',
    'Build a client growth roadmap based on evolving risk needs',
    'Identify ethical cross-sell and expansion opportunities',
    'Measure client lifetime value and portfolio performance',
    'Generate referrals through delivered value'
  ],[
    P('The CoverScore Advisor is not only a risk analyst. The advisor is responsible for turning professional risk insight into sustainable client relationships and measurable business growth. However, CoverScore Academy does not teach product selling as the primary objective. It teaches: Risk Intelligence creates Advisory Value creates Client Trust creates Protection Strategy creates Business Conversion creates Long-Term Relationship. The learner must answer: "How do you turn advisory value into a sustainable client relationship without compromising professional integrity?"'),
    C('The CoverScore Advisor does not begin with "what product can I sell?" The advisor begins with "what problem does the client need solved?"'),
    T('The CoverScore Growth Cycle',['Stage','Focus'],[
      ['Risk Discovery','What is the client\'s risk environment?'],
      ['Risk Intelligence','What does the risk information mean?'],
      ['Protection Gap','What protection is missing?'],
      ['Advisory Insight','What should the client do?'],
      ['Client Decision','Will the client act?'],
      ['Protection Strategy','What is the appropriate response?'],
      ['Business Conversion','How do we implement?'],
      ['Relationship Expansion','What additional needs exist?'],
      ['Client Retention','How do we maintain value?'],
      ['Referral','Who else would benefit?']
    ]),
    T('Nexora Commercial Opportunity Map',['Risk Insight','Client Need','Opportunity Type','Priority'],[
      ['Machinery concentration','Asset and income resilience','Immediate protection','Critical'],
      ['BI exposure','Financial resilience','Immediate protection','Critical'],
      ['Cyber dependency','Technology resilience','Strategic protection','High'],
      ['Supplier dependency','Supply chain protection','Strategic protection','High'],
      ['Key-person dependency','People continuity','Strategic protection','Medium'],
      ['Employee welfare','Workforce protection','Relationship expansion','Medium'],
      ['Liability exposure','Third-party protection','Relationship expansion','Medium'],
      ['Ongoing risk change','Continuous advisory','Relationship opportunity','High']
    ]),
    SE('The CoverScore Value Proposition','Weak answer: "We offer competitive insurance premiums." Stronger: "We provide a broad range of insurance products." CoverScore answer: "We help organisations understand their risk exposure, identify protection gaps and build integrated protection strategies that evolve as their business changes." The differentiation is based on: understanding the client\'s business, understanding the risk ecosystem, designing appropriate responses, executing the strategy, and maintaining continuity.'),
    SE('The Conversion Moment','CEO says: "Your assessment makes sense. What happens next?" The advisor should not immediately say "let me send you a quotation." Instead: "I recommend we begin with the three highest-priority areas. We can validate the detailed requirements and develop a protection programme aligned with your priorities, budget and risk appetite. We can also establish an ongoing CoverScore review process so the programme evolves as your business changes." This moves the conversation from quotation to engagement.'),
    T('The CoverScore Conversion Framework',['Step','Action'],[
      ['1','Confirm the client\'s priorities'],
      ['2','Validate willingness to act'],
      ['3','Agree on the first action'],
      ['4','Define information required'],
      ['5','Agree on decision-makers'],
      ['6','Set a timeline'],
      ['7','Confirm the next meeting'],
      ['8','Document the commitment']
    ]),
    SE('The Procurement Challenge','Procurement Director: "We normally send requirements to three brokers and select the lowest quotation. Can you simply send us your best price?" Strong CoverScore response: "We are happy to participate in your procurement process. However, we believe the value extends beyond a premium quotation. Our assessment has identified areas where the programme structure may need review. We would like to ensure the requirements being priced accurately reflect the risks we have identified, allowing Nexora to compare not only premium but also scope, adequacy, structure and advisory value."'),
    SE('The Price Objection','CFO: "Your proposal is 15% more expensive." Advisor should not immediately discount. Response: "Before we discuss price, let\'s compare the proposals on an equivalent basis. Are the sums insured the same? Indemnity periods? Exclusions? Deductibles? Extensions? If the scope is equivalent, we can have a meaningful discussion about cost." This is value-based negotiation.'),
    SE('The Discount Trap','Client: "If you reduce your fee by 20%, we will proceed." Professional response: "We are willing to explore ways to optimise the cost structure. Rather than simply discounting, I would prefer to look at the scope — phased implementation, service levels or timing. That way we preserve quality while finding a structure that works for Nexora." Trade scope, timing or structure — not professional value.'),
    T('Multi-Stakeholder Value Communication',['Stakeholder','Message Focus'],[
      ['CEO','"This strategy protects business continuity and strategic growth"'],
      ['CFO','"This aligns protection with financial exposure and risk appetite"'],
      ['COO','"This improves operational resilience"'],
      ['HR Director','"This protects people and critical human capability"'],
      ['IT Manager','"This strengthens cyber and technology resilience"'],
      ['Procurement','"This enables transparent comparison of scope, value and cost"']
    ]),
    SE('Risk-Led Relationship Expansion','After successfully completing the first engagement, the advisor identifies additional needs in a natural sequence: Phase 1 — Machinery + BI. Phase 2 — Cyber + Technology. Phase 3 — Supply Chain + Marine/GIT. Phase 4 — Employee + Key Person. Phase 5 — Liability + Governance. Phase 6 — Annual CoverScore Risk Review. This is not random cross-selling — it is risk-led relationship expansion. Never ask "what else can I sell this client?" Ask "what other significant risks have we not yet addressed?"'),
    T('The Annual Client Growth Cycle',['Period','Activity'],[
      ['Months 1-3','Risk Review — what has changed?'],
      ['Months 4-6','Protection Gap Analysis'],
      ['Months 7-9','Strategic Risk Advisory'],
      ['Months 10-11','Protection Programme Review'],
      ['Month 12','Renewal and Reassessment']
    ]),
    SE('The Claims Moment — A Critical Relationship Event','When a client experiences a loss, the advisor must: respond quickly, confirm immediate needs, help preserve evidence, coordinate claims notification, engage relevant experts, communicate with the insurer, track progress, keep management informed, support business continuity, and conduct a post-loss review. The claims experience should not be treated as a transaction — it is a learning opportunity for the client\'s future risk strategy.'),
    SE('The Client Growth Equation','Client Growth = Value Delivered x Trust x Relevance x Continuity. High value + low trust = the client may not buy. High trust + low relevance = the client may like you but not need your services. High relevance + low continuity = the relationship remains transactional. High value + trust + relevance + continuity = the relationship becomes strategic.'),
    C('The most powerful business development question is not "what else can I sell?" It is "what important risk has the client not yet addressed?"')
  ],[
    'Commercial opportunity emerges from genuine client need — never manufacture risks to create sales',
    'The CoverScore conversion framework moves from insight to action through structured, value-based conversations',
    'Protect advisory value during negotiation — trade scope and timing, not professional integrity',
    'Client growth should follow the client\'s evolving risk profile, driven by risk-led relationship expansion'
  ]),
  hQuiz([
    Q('What should drive CoverScore business development?',['Product availability','Commission','Client risk intelligence and genuine protection needs','Competitor activity'],2,'Client risk intelligence and genuine needs drive CoverScore business development.'),
    Q('What is the best starting point for a commercial conversation?',['Premium','Product list','Client risk and protection gap','Commission'],2,'Start with the client\'s risk and protection gap.'),
    Q('What is risk-led cross-selling?',['Selling every available product','Identifying additional solutions based on genuine client risk needs','Selling the highest-commission product','Selling products the client does not need'],1,'Risk-led cross-selling identifies solutions based on genuine client needs.'),
    Q('What should an advisor do when a competitor offers a lower price?',['Immediately discount','Criticise the competitor','Compare the total scope and value of the proposals','Withdraw'],2,'Compare total scope and value before discussing price.'),
    Q('What is the purpose of a client growth roadmap?',['Maximise sales pressure','Plan how to continuously create value as client needs evolve','Sell every product','Replace client service'],1,'The roadmap plans how to create continuous value.'),
    Q('When is the best time to request a referral?',['Before providing any value','After a meaningful value milestone','During the first introduction','After rejecting a claim'],1,'Referrals are best requested after delivering measurable value.'),
    Q('What is the best way to respond to a request for a 20% discount?',['Automatically agree','Refuse aggressively','Explore scope, timing and structure before reducing value','Cancel the relationship'],2,'Explore scope, timing and structure adjustments.'),
    Q('What is the purpose of annual CoverScore reassessment?',['Create unnecessary work','Identify changes in risk profile and adjust protection accordingly','Increase premiums automatically','Replace claims management'],1,'Annual reassessment identifies risk profile changes.'),
    Q('Which metric best reflects long-term advisory success?',['Premium alone','Commission alone','Client value, retention, protection improvement and relationship growth','Number of quotations sent'],2,'Long-term success is measured by client value, retention and protection improvement.'),
    Q('What is the CoverScore commercial philosophy?',['Sell more policies','Win every price competition','Convert risk intelligence into client value and sustainable relationships','Maximise commission'],2,'Convert risk intelligence into client value and sustainable relationships.')
  ]),
  hScript('Business Development, Conversion & Client Growth Simulation',[
    'You have identified Nexora\'s risks, built their risk profile, and developed a protection strategy. Now comes the commercial question: how do you turn this advisory value into a sustainable client relationship without compromising professional integrity?',
    'The CoverScore commercial philosophy is simple: commercial opportunity emerges from genuine client need. Never manufacture risks to create sales. Never recommend a solution that does not address a real, identified exposure.',
    'The Nexora Commercial Opportunity Map shows eight potential areas of need, from immediate protection (BI, machinery) through strategic protection (cyber, supply chain) to relationship expansion (employee protection, ongoing advisory).',
    'When the CEO asks "what happens next?" do not send a quotation. Propose a phased engagement starting with the highest-priority areas. Move the conversation from quotation to ongoing advisory relationship.',
    'You will face procurement challenges and price pressure. The response is not to discount. Compare scope, identify differences, defend value, offer alternatives. Trade scope and timing — not professional value.',
    'Different stakeholders need different messages. The CEO cares about growth and continuity. The CFO cares about cost and financial exposure. The COO cares about operational resilience. Tailor your communication to each person\'s priorities.',
    'After the first engagement, the relationship should expand naturally as the client\'s risk profile evolves. Never ask "what else can I sell?" Ask "what important risk has the client not yet addressed?"',
    'The ultimate measure of commercial success is not premium volume. It is whether the client trusts you enough to call you before making an important decision. That trust is earned through consistent value delivery.'
  ]),
  hWorkbook([
    {t:'Build the Business Opportunity Map',i:'Using the Nexora case, identify:',p:['5 immediate protection opportunities with risk insight and next step','5 strategic protection opportunities with risk insight and next step','5 relationship opportunities with risk insight and next step','For each: identify decision-maker, urgency, and commercial potential']},
    {t:'Build the Conversion Plan',i:'Create a conversion plan for Nexora including:',p:['Objective — what do you want the client to decide?','Value — why should the client act?','Stakeholders — who must be involved?','Objections — what resistance is likely?','Evidence — what supports your recommendation?','Next Step — what specific action should be agreed?','Timeline — when will the decision happen?']},
    {t:'The Executive Conversion Simulation',i:'The CEO asks: "Why should we choose your organisation to implement this?" Respond in 3 minutes covering differentiation, value, capability, implementation and continuity.'},
    {t:'The Procurement Negotiation',i:'Respond to: "Your competitor is 20% cheaper." Demonstrate that you can protect commercial value without becoming defensive or discounting prematurely.'}
  ]),
  hCase('Nexora Business Development Simulation','Nexora has accepted the CoverScore assessment and protection strategy. The CEO has asked: "What happens next?" The advisor must now convert this advisory insight into a phased business development plan. The CFO is price-sensitive and has indicated they normally choose the cheapest option. The Procurement Director wants a competitive tender. The COO is supportive but wants to see practical results quickly. The CEO values the relationship but needs to see business value.',[
    'Build a phased Business Opportunity Map prioritising immediate, strategic and relationship opportunities',
    'Prepare a value proposition that differentiates the CoverScore approach from standard insurance broking',
    'Write the conversion conversation — what you say when the CEO asks "what happens next?"',
    'Prepare responses to procurement challenges: cheapest quote, competitive tender, 20% cheaper competitor',
    'Stakeholder-specific value messages for each of the five key stakeholders',
    'A 12-month Client Growth Roadmap showing phased expansion based on risk needs',
    'A referral strategy — when and how to ask Nexora for introductions to their network'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Business Opportunity Map Template',description:'Template for mapping risk insights to commercial opportunities across immediate, strategic and relationship categories'},
    {url:'#',type:'doc',title:'Value-Based Proposal Guide',description:'Structure and content guidance for CoverScore advisory proposals that lead with value, not product'},
    {url:'#',type:'pdf',title:'Client Growth Roadmap Template',description:'24-month client growth planning template based on evolving risk needs'}
  ])
);


C8[6] = L(
  hContent('Professional Practice, Portfolio Management & Risk Review Simulation',[
    'Manage a structured client risk portfolio covering all significant exposures',
    'Monitor changes in client risk exposure across multiple dimensions',
    'Conduct periodic risk reviews and determine when reassessment is required',
    'Respond professionally to client incidents and claims',
    'Conduct post-loss risk reviews that convert loss events into intelligence',
    'Manage the annual renewal as a strategic risk review opportunity',
    'Maintain accurate CRM and advisory records',
    'Track outstanding recommendations and ensure follow-through',
    'Communicate risk changes to management through executive briefings',
    'Demonstrate professional judgement throughout the client lifecycle',
    'Measure and demonstrate client value beyond premium'
  ],[
    P('Winning a client is not the end of the CoverScore advisory process — it is the beginning of the professional relationship. This lesson moves you from "I have won the client" to "I can professionally manage the client\'s entire risk relationship." You will participate in a simulated 12-month client portfolio management cycle involving routine monitoring, a major business expansion, a machinery incident, a claims event, a policy renewal, a change in senior management, an emerging cyber risk, and a new subsidiary.'),
    C('Don\'t manage the policy. Manage the risk relationship.'),
    T('The Professional CoverScore Client Lifecycle',['Stage','Focus'],[
      ['Prospect','Identify potential client'],
      ['Discover','Understand the client\'s reality'],
      ['Assess','Apply the CoverScore methodology'],
      ['Score','Generate risk intelligence'],
      ['Profile','Build the Risk Fingerprint'],
      ['Analyse','Interpret the results'],
      ['Recommend','Advise on appropriate responses'],
      ['Convert','Move from insight to action'],
      ['Implement','Execute the protection strategy'],
      ['Manage','Maintain the relationship and portfolio'],
      ['Monitor','Detect changes in the risk environment'],
      ['Review','Conduct periodic reassessments'],
      ['Reassess','Update the Risk Fingerprint'],
      ['Optimise','Improve the protection strategy'],
      ['Renew','Renew as a strategic risk review'],
      ['Grow','Expand where genuine needs exist']
    ]),
    T('Client Management vs Portfolio Management',['Aspect','Client Management','Portfolio Management'],[
      ['Focus','Relationship, communication, meetings, satisfaction','Risk exposure, protection structure, policies, gaps'],
      ['Activities','Stakeholder management, service delivery','Risk register, limits, deductibles, claims, renewal dates'],
      ['Output','Client satisfaction and retention','Risk visibility, gap closure, protection adequacy']
    ]),
    SE('The Client Risk Portfolio','For Nexora, the portfolio may include: Property (factory, warehouse, office, machinery, equipment), Business Continuity (BI, dependency risks, supply-chain exposure), Transportation (Goods in Transit, Marine Cargo), People (Group Life, GPA, Key Person), Liability (Public, Products, Employers), Technology (Cyber, electronic equipment, data dependency), Financial (Money, Fidelity Guarantee, credit exposures), Governance (D&O, Professional Indemnity), Strategic (new subsidiaries, expansion, acquisitions).'),
    T('Review Frequencies',['Frequency','Activities'],[
      ['Continuous','Market changes, regulatory changes, claims, incidents, major news'],
      ['Monthly','Open actions, claims, critical risks, policy changes'],
      ['Quarterly','Risk portfolio review, emerging risks, management changes, business changes'],
      ['Bi-annually','Protection adequacy review, strategic risk discussion'],
      ['Annually','Full CoverScore reassessment, Risk Fingerprint update, Protection Gap Analysis'],
      ['Event-triggered','Immediate reassessment after: new facility, acquisition, major loss, regulatory change, new product, management change']
    ]),
    SE('The Event-Triggered Reassessment Principle','A reassessment should occur not only at renewal but when something materially changes. Triggers include: new factory, warehouse or acquisition, new subsidiary, product or market, major revenue or asset increase, significant staff growth, new technology, cyber incident or major claim, regulatory change, change in ownership or key management, major supplier change or contract, business restructuring. When the client\'s risk environment changes materially, the Risk Fingerprint must be reconsidered.'),
    T('The 12-Month Nexora Simulation',['Month','Event','Advisor Action'],[
      ['Month 1','Portfolio handover from previous advisor','30-day stabilisation plan, critical risk identification'],
      ['Month 2','Executive review — CEO asks "what has improved?"','Present risk improvement metrics'],
      ['Month 3','New production facility announced','Trigger targeted risk reassessment'],
      ['Month 4','New facility risk review','Update Risk Objects, scores, Fingerprint, gaps'],
      ['Month 5','Major machinery breakdown — 6 days downtime','Immediate response, claims coordination'],
      ['Month 6','Post-loss review','Update risk register, identify lessons'],
      ['Month 7','New CFO appointed','New CFO risk briefing to ensure continuity'],
      ['Month 8','Suspected phishing attack — near miss','Recommend cyber risk review'],
      ['Month 9','Renewal approaches — client wants automatic renewal','Explain why reassessment is necessary'],
      ['Month 10','Renewal review — compare last year vs current','Strategic protection optimisation'],
      ['Month 11','Executive risk briefing requested','One-page risk position summary'],
      ['Month 12','Annual CoverScore reassessment','Full cycle complete, new Fingerprint']
    ]),
    SE('Post-Loss Advisory Principles','A claim is not only a financial event — it is a risk intelligence event. Every significant claim should trigger: What happened? What was the immediate and underlying cause? What controls failed? What was the financial, operational, and reputational impact? What lessons were learned? What should change? The advisor should never say "we told you so." Instead: "Let\'s understand what happened and identify what we can learn from it."'),
    SE('The Renewal as Advisory Event','The client says: "Nothing has changed. Just renew everything." The advisor should respond: "We can review the existing programme, but the business has changed significantly since the last assessment — new facility, machinery incident, cyber event, management change, business growth. I recommend we reassess the relevant areas before renewal so the programme reflects your current risk profile."'),
    T('The CoverScore Risk Review Model',['Step','Action'],[
      ['1 — Review','What has changed since the last assessment?'],
      ['2 — Reassess','How has the risk profile changed?'],
      ['3 — Re-score','What is the new risk position?'],
      ['4 — Identify','What new gaps exist?'],
      ['5 — Prioritise','What matters most now?'],
      ['6 — Recommend','What should the client do?'],
      ['7 — Implement','What action should be taken?'],
      ['8 — Monitor','How will progress be tracked?']
    ]),
    T('The CoverScore Portfolio Health Check',['Dimension','Question'],[
      ['Risk Visibility','Do we understand the client\'s current risks?'],
      ['Protection Adequacy','Is protection aligned with exposure?'],
      ['Implementation','Have agreed recommendations been executed?'],
      ['Monitoring','Are changes being detected?'],
      ['Governance','Are reviews documented?'],
      ['Relationship','Are key stakeholders engaged?']
    ]),
    SE('The CoverScore Client Value Report','At least annually, demonstrate: Risk Improvement (what risks have been reduced), Protection Improvement (what gaps have been addressed), Incident Response (how effectively losses were managed), Financial Protection (how the programme has evolved), Advisory Activity (what has been done), and Emerging Risk (what management should consider next). This proves the advisor delivers value beyond transactions.'),
    C('The ultimate measure of advisory success: "Before I make an important decision, I should speak to my risk advisor."')
  ],[
    'Winning the client is not the end — it is the beginning of the professional advisory relationship',
    'A reassessment should occur at scheduled intervals AND when material changes occur',
    'A claim is a risk intelligence event — every significant claim deserves a post-loss review',
    'The annual renewal should be treated as a strategic risk review, not an automatic transaction'
  ]),
  hQuiz([
    Q('When should a CoverScore client be reassessed?',['Only at renewal','Only after a claim','When material changes occur or at scheduled review intervals','Only when the client requests it'],2,'Reassess when material changes occur or at scheduled intervals.'),
    Q('What is the primary purpose of a Risk Portfolio Register?',['Track sales commissions','Maintain visibility of risks, gaps, actions and reviews','Replace insurance policies','Generate invoices'],1,'The register maintains visibility of risks, gaps, actions and reviews.'),
    Q('A major new facility opens. What should the advisor do?',['Wait until renewal','Ignore it','Trigger a targeted risk reassessment','Sell every available policy'],2,'A new facility triggers a targeted reassessment.'),
    Q('What should happen after a major claim?',['Close the relationship','Conduct a post-loss risk review','Immediately increase every policy','Do nothing'],1,'A post-loss review converts the claim into risk intelligence.'),
    Q('What is the purpose of an annual CoverScore reassessment?',['Automatically increase premiums','Update the understanding of risk and protection needs','Replace the client relationship','Generate commissions'],1,'The reassessment updates understanding of risk and protection needs.'),
    Q('Which is an event-triggered reassessment?',['New factory','Major acquisition','Cyber incident','All of the above'],3,'All are events that should trigger reassessment.'),
    Q('What should an advisor do with unresolved recommendations?',['Ignore them','Track them through an action register','Delete them','Wait for the client to remember'],1,'Track them through an action register.'),
    Q('What is the difference between client management and portfolio management?',['There is no difference','Client management focuses on relationships; portfolio management focuses on risk and protection','Portfolio management is only about sales','Client management is only about claims'],1,'Client management = relationships; portfolio management = risk and protection.'),
    Q('What is the correct response to a cyber near miss?',['Ignore it because no money was lost','Treat it as risk intelligence and review the exposure','Immediately cancel all policies','Blame the IT department'],1,'A near miss is risk intelligence requiring review.'),
    Q('What is the ultimate purpose of professional portfolio management?',['Sell more products','Maintain continuous alignment between changing risks and protection strategy','Reduce meetings','Eliminate all risk'],1,'The purpose is continuous alignment between risks and protection.')
  ]),
  hScript('Professional Practice, Portfolio Management & Risk Review Simulation',[
    'You have won the Nexora engagement. The CoverScore assessment is complete. The initial protection strategy has been implemented. Now the real work begins — managing the client relationship over time.',
    'Professional portfolio management means maintaining visibility across all dimensions of the client\'s risk and protection environment. You need a structured Risk Portfolio Register tracking every risk, its status, actions required, and review dates.',
    'Risk is dynamic. The client\'s business changes. Assets change. People change. Technology changes. Regulations change. Your risk intelligence must change with them. A reassessment should occur not only at renewal but whenever something materially changes.',
    'Over the next 12 months with Nexora, you will face: a new facility opening, a machinery breakdown, a new CFO, a cyber near miss, renewal pressure, and the need to demonstrate value. Each event tests your ability to manage rather than react.',
    'When a claim occurs, respond immediately. Establish facts. Identify business impact. Coordinate claims support. Then — and this is the critical step — conduct a post-loss review. What happened? What failed? What lessons apply? Update the risk profile accordingly.',
    'The renewal conversation should not start with "your policies are due." It should start with "since our last review, significant changes have occurred. Let\'s reassess before we renew." Turn renewal from a transaction into an advisory event.',
    'At the end of each year, produce a Client Value Report demonstrating risk improvement, protection improvement, incident response, financial protection evolution, and advisory activity. Prove value beyond transactions.',
    'The ultimate measure of your success is not policy count or premium volume. It is whether your client thinks: "Before I make an important decision, I should speak to my risk advisor."'
  ]),
  hWorkbook([
    {t:'The Client Portfolio Triage',i:'You inherit the Nexora account. Issues: 3 overdue risk actions, 2 policies renewing in 45 days, 1 unresolved claim, 1 new warehouse, 1 new CFO, 1 cyber incident, 2 missing asset schedules. You have 7 days to stabilise the account.',p:['Prioritise the 8 issues from most urgent to least urgent','For each, explain why that priority','Who should be contacted?','What action is required?','What is the risk of delay?']},
    {t:'The Risk Review Simulation',i:'Conduct a 15-minute risk review with the Nexora CEO covering:',p:['Review of changes since last assessment','New Risk Objects identified','Lessons from recent incidents','Emerging risks to monitor','Protection gaps remaining','Recommendations for reassessment','Agreed next actions']},
    {t:'The Renewal Challenge',i:'The client says "Nothing has changed. Just renew everything." Write your response, referencing specific changes: new facility, machinery incident, cyber event, management change, business growth.'},
    {t:'The Post-Loss Review',i:'A machine breakdown resulted in 6 days downtime, emergency repairs, customer delays, additional logistics costs, temporary outsourcing. Conduct a post-loss review identifying:',p:['Immediate risk impact','Insurance implications','Business continuity implications','Risk control improvements','Protection gap implications','Risk Fingerprint changes','Future advisory recommendations']}
  ]),
  hCase('Nexora 12-Month Portfolio Management Simulation','You are the Lead CoverScore Advisor for Nexora. It is Month 1 and you have just inherited the account. Current state: CoverScore assessment complete, priority gaps identified, protection strategy implemented, key stakeholders mapped. Over the next 12 months: a new production facility opens (Month 3), a critical machine breaks down causing 6 days downtime (Month 5), the CFO resigns (Month 7), a phishing attack occurs (Month 8), renewal approaches (Month 9), and the CEO requests a year-end review (Month 12).',[
    'Create the 30-day client portfolio stabilisation plan',
    'Prepare the Month 2 executive review — what has improved since the initial assessment?',
    'Conduct the Month 3-4 new facility targeted risk reassessment',
    'Respond to the Month 5 machinery breakdown — immediate actions and claims coordination',
    'Conduct the Month 6 post-loss review — what lessons are learned and what changes?',
    'Manage the Month 7 new CFO briefing to ensure relationship continuity',
    'Respond to the Month 8 cyber near miss professionally',
    'Handle the Month 9 renewal challenge — client wants automatic renewal',
    'Prepare the Month 11 one-page executive risk position briefing',
    'Conduct the Month 12 annual CoverScore reassessment — compare Year 1 vs Year 2 Risk Fingerprint'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Client Risk Portfolio Register Template',description:'Structured register for tracking all client risks, protection gaps, actions and review dates'},
    {url:'#',type:'doc',title:'Post-Loss Risk Review Template',description:'Framework for conducting post-loss reviews that convert claim events into risk intelligence'},
    {url:'#',type:'pdf',title:'Executive Risk Briefing Template',description:'One-page executive briefing format for communicating risk position to senior management'}
  ])
);


C8[7] = L(
  hContent('Ethics, Professional Judgment & Difficult Advisory Decisions',[
    'Recognise ethical and professional dilemmas in risk advisory practice',
    'Separate legitimate client advocacy from inappropriate influence or misrepresentation',
    'Assess competing interests before making an advisory decision',
    'Protect client confidentiality and handle information responsibly',
    'Identify and appropriately manage conflicts of interest',
    'Professionally challenge clients, colleagues and senior stakeholders when necessary',
    'Decline inappropriate requests without unnecessarily damaging the relationship',
    'Know when an issue requires escalation to management, compliance or legal channels',
    'Create a clear written record of material professional decisions',
    'Apply the CoverScore Ethical Decision Framework to difficult situations',
    'Demonstrate professional courage under commercial pressure'
  ],[
    P('A CoverScore Advisor operates in an environment where decisions are rarely simple. Clients may ask for advice that is commercially attractive but professionally questionable. Management may pressure the advisor to prioritise revenue over client needs. A client may want to conceal information. A claim may create pressure to interpret facts favourably. In these situations, technical insurance knowledge alone is not enough. The professional CoverScore Advisor must demonstrate integrity, independence of judgement, confidentiality, accountability, transparency, fairness, courage, and respect for regulatory requirements.'),
    C('Professional competence without integrity is not professional competence.'),
    SE('The CoverScore Professional Judgment Principle','Before every difficult decision, ask: Is it legal? Is it ethical? Is it client-centred? Is it professionally defensible? Would I be comfortable explaining this decision later? If the answer to any question is "no," stop and reconsider. When in doubt, do not hide the dilemma — surface it, analyse it, document it and escalate it when necessary.'),
    T('Ethics vs Compliance',['Concept','Question'],[
      ['Compliance','"Is this allowed?" — focuses on rules and regulations'],
      ['Ethics','"Is this right?" — focuses on professional responsibility and integrity']
    ]),
    T('The CoverScore Ethical Decision Framework',['Step','Action'],[
      ['1 — Stop','Do not make a rushed decision'],
      ['2 — Identify','What exactly is the dilemma?'],
      ['3 — Gather','What facts are known?'],
      ['4 — Separate','What are facts, assumptions and opinions?'],
      ['5 — Check','What laws, policies and standards apply?'],
      ['6 — Identify Interests','Who could be affected?'],
      ['7 — Test','Would the decision be fair, transparent and defensible?'],
      ['8 — Consider Options','What legitimate alternatives exist?'],
      ['9 — Consult','Who should be involved?'],
      ['10 — Document','What was decided and why?'],
      ['11 — Act','Implement the appropriate decision'],
      ['12 — Review','Was the outcome appropriate?']
    ]),
    T('The Four Professional Red Lines',['Never Knowingly','Examples'],[
      ['Misrepresent','Provide false or misleading information to clients, insurers or regulators'],
      ['Conceal','Deliberately hide material information from an assessment or report'],
      ['Manipulate','Distort analysis to produce a desired commercial outcome'],
      ['Fabricate','Create evidence, documents or findings that do not exist']
    ]),
    T('The Professional Judgment Triangle',['Dimension','Question'],[
      ['Client Interest','What is best for the client?'],
      ['Professional Duty','What does professional responsibility require?'],
      ['Commercial Reality','What are legitimate business considerations?']
    ]),
    SE('Difficult Decision 1 — "Make the Score Look Better"','A senior colleague says: "This score is too harsh. The client will never buy from us." They suggest increasing scores slightly. Correct response: verify the assessment, confirm the evidence, correct genuine errors, keep accurate scores, explain findings constructively, focus on improvement. "If there are genuine data errors we should correct them. If the risk is genuinely high, we should help the client understand why and what can be done."'),
    SE('Difficult Decision 2 — "Don\'t Include That in the Report"','The client asks to omit relevant information because "it will make us look bad." The advisor should explain why accurate information matters, clarify how it will be used, maintain confidentiality, and avoid knowingly omitting material information. "I understand your concern. The assessment must accurately reflect the risk environment. We can discuss how the issue is presented and what actions can reduce the exposure."'),
    SE('Difficult Decision 3 — "Just Give Me the Cheapest Option"','The client does not care about the gap. The advisor should not simply provide the cheapest policy. Instead: explain what the option covers and does not cover, the consequences of the gap, alternatives, and the client\'s financial exposure. Enable informed choice, then document the client\'s decision.'),
    SE('Difficult Decision 4 — Commercial Pressure','A manager says: "This is a big account. Don\'t ask too many questions. Just get the business." The professional response: "I understand the importance of the opportunity. However, we need sufficient information to provide competent advice. I would rather take the necessary steps now than create a larger problem later." Urgency does not eliminate professional responsibility.'),
    SE('Difficult Decision 5 — Conflict of Interest','The client asks which insurer to choose. The advisor has a commercial relationship with one insurer. The advisor must recognise the conflict, disclose it where appropriate, follow organisational requirements, base recommendations on legitimate needs, and avoid misleading the client. Trust depends on transparency.'),
    SE('Difficult Decision 6 — "Can You Guarantee the Claim Will Be Paid?"','Never guarantee what you do not control. Correct: "I cannot guarantee the outcome of a claim. Coverage and settlement depend on the policy terms, circumstances of the loss and the claims assessment. I can support you through the process and help coordinate the required documentation."'),
    SE('Difficult Decision 7 — The Uncomfortable Truth','The client has significant underinsurance and the CEO becomes defensive: "Your report is making us look bad." The advisor must not retreat. Reframe: "The purpose is not to judge the business. It is to identify where you may be financially vulnerable so management can make informed decisions." Be honest without being confrontational.'),
    SE('Difficult Decision 8 — The Claims Misrepresentation','Client: "Tell the insurer this happened differently, otherwise they won\'t pay." The advisor must not assist in misrepresentation or fraud. "I understand your concern about the outcome. All information submitted must be accurate and truthful. We can present the facts clearly and provide the necessary documentation." If appropriate, escalate internally.'),
    SE('Difficult Decision 9 — Client Confidentiality','A competitor asks: "What insurance problems do Nexora have?" The advisor must not disclose confidential information. "I\'m unable to discuss confidential information about any client." Client information is not a business asset to be casually shared.'),
    SE('Difficult Decision 10 — Internal Pressure','A senior executive says: "I know there is a gap, but don\'t put it in the report. We don\'t want to scare them." The advisor should remain professional, explain the concern, maintain factual accuracy, document the issue, and escalate appropriately if necessary. Never knowingly create a misleading professional record.'),
    SE('The "Would I Sign It?" Test','Before finalising a major recommendation, ask: Would I be comfortable signing this? Explaining it to the client? To my manager? To a regulator? In court? Seeing it published publicly? If the answer is no, pause. The decision may require reconsideration or escalation.'),
    SE('Admitting a Mistake','If incorrect information was entered into a client\'s assessment: verify the error, notify the appropriate person, correct the record, assess the impact, inform the client where appropriate, document the correction, and identify how recurrence can be prevented. Not: "Let\'s see if anyone notices." But: "Let\'s correct it before it becomes a bigger problem."'),
    T('The Error Recovery Principle',['Step','Action'],[
      ['Recognise','Identify the error and its potential impact'],
      ['Report','Notify appropriate parties'],
      ['Correct','Fix the error in the record'],
      ['Communicate','Inform affected parties appropriately'],
      ['Learn','Identify how the error occurred'],
      ['Prevent','Improve processes to avoid recurrence']
    ]),
    SE('Professional Courage','Professional courage is the ability to tell the truth respectfully, challenge incorrect assumptions, raise uncomfortable risks, refuse inappropriate requests, admit mistakes, escalate concerns, protect client interests, and accept commercial consequences when necessary. It does not mean being confrontational — it means doing the right thing professionally even when it is uncomfortable.'),
    C('The advisor who tells clients only what they want to hear may win a transaction. The advisor who tells them what they need to know can build a relationship that lasts.')
  ],[
    'The CoverScore Ethical Decision Framework: Stop, Identify, Gather, Separate, Check, Identify Interests, Test, Consider Options, Consult, Document, Act, Review',
    'Four professional red lines: never knowingly misrepresent, conceal, manipulate, or fabricate',
    'Professional courage means doing what is right even when it is uncomfortable',
    'Know when to resolve, when to consult, when to escalate, and when to stop'
  ]),
  hQuiz([
    Q('What should an advisor do if asked to manipulate a risk score?',['Manipulate it','Refuse and maintain assessment integrity','Delete the assessment','Ignore the request'],1,'Maintain assessment integrity.'),
    Q('What is the difference between ethics and compliance?',['They are identical','Compliance asks what is permitted; ethics considers what is right and professionally responsible','Ethics only applies to managers','Compliance is optional'],1,'Compliance = what is permitted; ethics = what is right.'),
    Q('A client asks you to provide false information on a claim. What should you do?',['Help the client','Refuse to participate in misrepresentation and provide legitimate assistance','Ignore the claim','Change the information slightly'],1,'Refuse misrepresentation and provide legitimate assistance.'),
    Q('What should you do when you do not know the answer to a technical question?',['Guess','Pretend to know','Verify the answer or consult a specialist','Give the most optimistic answer'],2,'Verify the answer or consult an appropriate specialist.'),
    Q('When should an advisor escalate an issue?',['Only when in trouble','When it exceeds authority, competence or involves significant ethical, legal or client risk','Never','Only after a claim'],1,'Escalate when the issue exceeds authority or involves significant risk.'),
    Q('What is the correct response to a request for confidential client information?',['Share it if the person is a friend','Share it if it helps win business','Protect confidentiality','Share only part of it'],2,'Protect confidential client information.'),
    Q('What should an advisor do when they discover a material mistake?',['Hide it','Correct it and follow appropriate reporting procedures','Blame someone else','Wait for the client to discover it'],1,'Correct it and follow appropriate procedures.'),
    Q('What is professional courage?',['Being confrontational','Doing what is professionally right even when uncomfortable','Ignoring management','Refusing every commercial opportunity'],1,'Professional courage means doing what is right even when uncomfortable.'),
    Q('What should an advisor do when a client wants the cheapest option?',['Give the cheapest option without explanation','Explain coverage, limitations, gaps and alternatives for informed choice','Refuse to help','Recommend the most expensive option'],1,'Enable informed choice by explaining all implications.'),
    Q('What is the most important principle in professional CoverScore advisory?',['Maximise every sale','Avoid difficult conversations','Provide honest, competent, transparent and client-centred advice','Always agree with management'],2,'The most important principle is honest, competent, transparent and client-centred advice.')
  ]),
  hScript('Ethics, Professional Judgment & Difficult Advisory Decisions',[
    'Throughout your career as a CoverScore Advisor, you will face situations where easy answers are not the right answers. Technical insurance knowledge alone will not guide you — you need professional judgment and ethical clarity.',
    'The CoverScore Ethical Decision Framework gives you a structured approach: Stop, Identify, Gather, Separate, Check, Identify Interests, Test, Consider Options, Consult, Document, Act, Review.',
    'Four things you must never do: misrepresent, conceal, manipulate, or fabricate. These are professional red lines. Crossing them destroys trust, credibility and your professional standing.',
    'When someone asks you to "make the score look better," verify the assessment, correct genuine errors, but never change an accurate result. When a client asks you to omit information, explain why accuracy matters. When a manager pressures you to skip steps, remember that urgency does not eliminate professional responsibility.',
    'If you do not know the answer, say so. Promise to verify and come back with a confirmed response. Professional competence includes knowing the limits of your knowledge.',
    'If you discover a mistake, correct it immediately. Inform the appropriate parties. Learn how to prevent recurrence. Covering up a small error can turn it into a much larger problem.',
    'If the commercial pressure feels wrong, apply the "Would I Sign It?" test. Would you be comfortable seeing this decision explained to your manager, a regulator, or in court? If not, pause, reconsider, and escalate if needed.',
    'Professional courage is not about being confrontational. It is about doing what is professionally right even when doing so is uncomfortable. The advisor who does what is right builds a reputation that lasts a career.'
  ]),
  hWorkbook([
    {t:'The Score Manipulation Challenge',i:'Your manager asks you to reduce a client\'s CoverScore from 82 to 65 to make them more comfortable. Write your response covering: accuracy, client communication, commercial pressure, professional integrity, and escalation if necessary.'},
    {t:'The Confidentiality Challenge',i:'A competitor asks you to tell them "the biggest risks you found at Nexora." Write your two-sentence professional response.'},
    {t:'The Difficult Truth',i:'The client has a major protection gap. The recommended solution is expensive. The client asks you not to mention the gap in the report. Role-play the conversation where you acknowledge concern, explain the importance of accuracy, present the risk objectively, and offer prioritisation options without being confrontational.'},
    {t:'The Claims Pressure Test',i:'A client asks you to omit a material fact from a claim notification. Respond professionally, refusing to participate in misrepresentation while remaining calm and supportive.'},
    {t:'The "I Don\'t Know" Test',i:'A client asks a complex technical insurance question that you cannot answer confidently. Respond without guessing, overpromising, or giving false certainty. Demonstrate professional humility.'}
  ]),
  hCase('The Five-Day Ethics Challenge — Nexora','You are the Lead CoverScore Advisor for Nexora. Over five days, you face: Day 1 — The CEO asks you to improve the client\'s risk score. Day 2 — A competitor requests confidential information. Day 3 — The client asks you to omit a fact from a claim. Day 4 — Management pressures you to close the account before all risk information is collected. Day 5 — You discover a junior advisor made a material error in the assessment.',[
    'Day 1 — Respond to the CEO\'s request to improve the score. Explain professionally, offer constructive alternatives.',
    'Day 2 — Respond to the competitor\'s request for confidential information.',
    'Day 3 — Respond to the client\'s request to omit a fact from the claim. Offer legitimate alternatives.',
    'Day 4 — Respond to management pressure. Explain the professional risk and propose a practical path forward.',
    'Day 5 — Handle the junior advisor\'s error — correct, report, coach, and improve the process.',
    'Document each decision in the Professional Decision Log with issue, facts, risk, interests, options, decision, and rationale.'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'CoverScore Ethical Decision Framework Guide',description:'Complete 12-step framework for ethical decision-making in risk advisory practice'},
    {url:'#',type:'doc',title:'Professional Decision Log Template',description:'Structured template for documenting material professional decisions and their rationale'},
    {url:'#',type:'pdf',title:'Escalation Matrix Reference',description:'Guidelines for determining when to resolve, consult, escalate or stop on professional issues'}
  ])
);


C8[8] = L(
  hContent('Final Integrated Advisory Simulation & Professional Assessment',[
    'Identify a commercially viable client opportunity using risk intelligence signals',
    'Prepare and conduct a complete professional CoverScore engagement',
    'Conduct discovery conversations that uncover both explicit and hidden risks',
    'Identify and classify the client\'s complete Risk Object ecosystem',
    'Apply the CoverScore Risk Scoring Framework to produce a defensible assessment',
    'Interpret complex risk information and prioritise material exposures',
    'Identify Protection Gaps and build an integrated Protection Strategy',
    'Present recommendations to executive decision-makers and handle objections',
    'Convert advisory insight into legitimate business opportunities',
    'Manage the long-term client relationship through monitoring, review and post-loss advisory',
    'Exercise ethical and professional judgement throughout the engagement',
    'Demonstrate the complete capability of a professional CoverScore Advisor'
  ],[
    P('This is the final lesson of the CoverScore Academy. The journey to becoming a Certified CoverScore Advisor does not end with knowing insurance products or understanding risk. A professional CoverScore Advisor must be able to bring everything together: find the right client, start the right conversation, discover real-world risks, identify Risk Objects, collect and validate information, build the risk profile, interpret the assessment, identify Protection Gaps, design a Protection Strategy, communicate risk to decision-makers, handle objections, convert insight into action, build and manage the client relationship, monitor changing risks, respond to incidents, exercise ethical judgement, and demonstrate professional leadership. This final assessment brings all these competencies together in one integrated simulation.'),
    C('The final question: Can this learner independently perform as a professional CoverScore Advisor in a realistic client environment?'),
    SE('The Final CCA Competency Model','The assessment evaluates eight integrated competencies: 1) Risk Intelligence — can the advisor identify meaningful risk opportunities? 2) Risk Advisory — can the advisor diagnose the client\'s actual risk environment? 3) CoverScore Methodology — can the advisor correctly apply the system? 4) Protection Strategy — can the advisor translate findings into appropriate recommendations? 5) Business Development — can the advisor convert insight into sustainable business? 6) Client Management — can the advisor build and manage long-term relationships? 7) Professional Judgement — can the advisor make ethical and defensible decisions? 8) Professional Mastery — can the advisor integrate all competencies independently?'),
    SE('The Final Capstone Client — Nexora Industrial Systems','Nexora manufactures and distributes specialised industrial equipment. 420 employees, $48M revenue. Operations: head office, manufacturing plant, warehouse, regional distribution network, fleet of delivery vehicles, technical service division, digital customer portal. Recent growth: expanded manufacturing facility, new machinery, significantly increased inventory, launched digital portal, increased fleet, hired 100 additional employees, minor warehouse fire 6 months ago, planning second manufacturing location. The board is increasingly concerned about operational disruption, fire, equipment breakdown, cyber incidents, supply chain disruption, employee injuries, fleet accidents, liability exposures, underinsurance, and business interruption.'),
    T('Capstone Stage 1 — Prospecting & Opportunity Identification',['Signal','Risk Implication'],[
      ['Expanded manufacturing facility','Increased property and asset exposure'],
      ['New machinery acquired','Machinery breakdown and BI exposure'],
      ['Significantly increased inventory','Property, stock, BI exposure'],
      ['Launched digital customer portal','Cyber, data, technology dependency'],
      ['Increased delivery fleet','Motor fleet, logistics, GIT exposure'],
      ['Hired 100 additional employees','Employee accident, welfare, benefits exposure'],
      ['Minor warehouse fire 6 months ago','Fire risk, control adequacy, BCP exposure'],
      ['Planning second manufacturing location','Construction, expansion, new operational risks']
    ]),
    T('Capstone Stages 2-4: Discovery, Assessment & Risk Intelligence',['Stage','Deliverable'],[
      ['Stage 2 — Client Engagement Plan','Objectives, risk hypotheses, stakeholders, discovery questions, documents requested'],
      ['Stage 3 — Discovery Conversation','Risk signals identified, preliminary Risk Object map, stakeholder insights'],
      ['Stage 4 — CoverScore Assessment','Complete assessment across all Risk Pillars with scoring and interpretation']
    ]),
    SE('Assessment Results — Nexora Industrial Systems','Property & Assets: 74. Business Continuity: 81. Machinery & Equipment: 78. Supply Chain: 76. Fleet & Transport: 64. Employee Risk: 58. Liability: 62. Cyber Risk: 84. Financial Resilience: 71. Governance & Risk Management: 73. Overall CoverScore: 74/100 — HIGH RISK EXPOSURE.'),
    SE('Critical Discovery — The Machinery Valuation Gap','Production manager reveals: "The critical machine is insured based on its original purchase price." CFO adds: "We haven\'t updated the sum insured since acquisition." The machine is now worth significantly more to replace. But the real value extends beyond the physical equipment — it also affects production capacity, revenue, customer contracts, employee productivity, and supply commitments. The machine is both a physical asset and a Business Continuity Risk Object.'),
    T('Capstone Stage 5 — Protection Gap Analysis',['Gap','Priority'],[
      ['Potential property underinsurance','Critical'],
      ['Machinery breakdown exposure','Critical'],
      ['Business interruption exposure','Critical'],
      ['Cyber risk exposure','Critical'],
      ['Supply chain dependency','High'],
      ['Fleet expansion not fully reflected','High'],
      ['Employee accident exposure','High'],
      ['Liability exposure','Moderate'],
      ['Unvalidated Business Continuity Plan','High'],
      ['Inadequate risk monitoring framework','Moderate']
    ]),
    T('Capstone Stage 6 — Protection Strategy',['Risk Area','Recommended Response'],[
      ['Property','Fire & Special Perils, Industrial All Risks, Electronic Equipment, asset revaluation'],
      ['Machinery','Machinery Breakdown, Business Interruption, contingency planning'],
      ['Business Continuity','BI insurance, BCP development, supply chain contingency'],
      ['Supply Chain','Alternative suppliers, contractual risk transfer, appropriate insurance'],
      ['Fleet','Motor Fleet, Goods in Transit, third-party liability'],
      ['People','Group Life, GPA, health insurance'],
      ['Liability','Public Liability, Employers Liability, Product Liability'],
      ['Cyber','Cyber risk assessment, controls, cyber insurance where appropriate']
    ]),
    T('Capstone Stage 7 — Executive Presentation',['Slide','Content'],[
      ['1','Executive Summary'],
      ['2','Business Risk Landscape'],
      ['3','Top Five Risk Exposures'],
      ['4','CoverScore Assessment'],
      ['5','Key Protection Gaps'],
      ['6','Immediate Priorities'],
      ['7','Protection Strategy'],
      ['8','Risk Improvement Roadmap'],
      ['9','Recommended Next Steps'],
      ['10','Ongoing Advisory Framework']
    ]),
    SE('Executive Challenges','During the presentation: CEO interrupts — "This is too much. We already have insurance." CFO says — "We don\'t have the budget for all of this." COO says — "Our biggest concern is keeping the factory running." CIO says — "Cybersecurity is an IT issue, not an insurance issue." The learner must respond to each challenge professionally, demonstrating objection handling, executive communication, prioritisation, risk reasoning, and commercial judgement.'),
    T('Capstone Stage 8 — Business Conversion',['Phase','Focus'],[
      ['Immediate','Property review, Machinery review, Business Interruption review'],
      ['Secondary','Fleet, Group Life, GPA, Health'],
      ['Strategic','Cyber, Supply Chain Risk, Enterprise Risk Review']
    ]),
    SE('When the Client Says No','The CFO says: "We are not ready to buy anything." Professional response: "I understand. The purpose is not to pressure you. Our objective is to help management understand the risk position and prioritise actions that make sense. If you are comfortable, we can agree on next steps and review priorities when the timing is right." Patience, professionalism and long-term thinking.'),
    T('Capstone Stage 9 — The Incident & Post-Loss Review',['Action','Detail'],[
      ['1','Remain calm and establish facts'],
      ['2','Identify immediate business impact'],
      ['3','Coordinate appropriate claims support'],
      ['4','Review business interruption implications'],
      ['5','Document the incident'],
      ['6','Conduct post-loss review'],
      ['7','Update Risk Fingerprint and Protection Gap Analysis'],
      ['8','Recommend improvements']
    ],'After 6 months: major equipment breakdown. Production disrupted. Advisor must respond.'),
    SE('Capstone Stage 10 — Ethical Challenge','The CEO says: "The new score is worse. Don\'t show that to the board." The correct professional position: "The assessment should accurately reflect the current risk position. We can explain why the score changed, identify the factors driving the change, and recommend actions to improve it. However, the score should not be altered to create a more favourable picture." Integrity, professional courage, and ethical judgement.'),
    T('Final Assessment Components & Weights',['Component','Weight'],[
      ['Risk Intelligence & Opportunity Identification','10%'],
      ['Discovery & Risk Assessment','15%'],
      ['Risk Analysis & CoverScore Interpretation','15%'],
      ['Protection Strategy & Advisory','15%'],
      ['Business Development & Client Growth','10%'],
      ['Executive Communication & Objection Handling','10%'],
      ['Client Portfolio & Relationship Management','10%'],
      ['Ethics & Professional Judgement','10%'],
      ['Documentation & Professional Practice','5%']
    ]),
    T('Certification Standards',['Score','Level','Meaning'],[
      ['90-100%','CCA Professional Mastery','Exceptional professional readiness'],
      ['80-89%','CCA Competent','Strong professional competence'],
      ['75-79%','CCA Pass','Minimum professional standard'],
      ['60-74%','Development Required','Targeted remediation needed'],
      ['Below 60%','Not Yet Competent','Must repeat assessment components']
    ]),
    SE('Critical Failure Conditions','Regardless of total score, the learner cannot be certified if they knowingly: manipulate a CoverScore assessment, fabricate risk information, provide materially misleading advice, assist fraudulent activity, deliberately breach confidentiality, conceal material information, make unauthorised guarantees, ignore a serious ethical concern, misrepresent coverage, or knowingly recommend inappropriate protection for personal gain. Technical competence without professional integrity is not professional mastery.'),
    C('The final standard: Understand the risk. Make it visible. Assess it intelligently. Identify the gap. Recommend responsibly. Guide the decision. Stay accountable.')
  ],[
    'The final CCA assessment evaluates eight integrated competencies — not isolated knowledge',
    'The capstone client (Nexora Industrial Systems) tests every dimension of the Complete CoverScore Advisory Cycle',
    'Technical competence without professional integrity is not professional mastery',
    'The learner must demonstrate the ability to think, diagnose, advise, communicate, convert and manage like a professional risk advisor'
  ]),
  hQuiz([
    Q('What is the overall CoverScore for Nexora Industrial Systems?',['58/100','64/100','74/100','84/100'],2,'The overall CoverScore is 74/100 — HIGH RISK EXPOSURE.'),
    Q('What makes the machinery dependency a multi-pillar exposure?',['It only affects property','It affects production, revenue, customers, contracts and supply commitments — not just the physical asset','It only affects insurance','It is only an engineering issue'],1,'The machinery dependency affects multiple business dimensions beyond the physical asset.'),
    Q('What should the advisor do when the CEO interrupts the presentation saying "this is too much"?',['Stop the presentation','Ignore the comment','Acknowledge the concern and refocus on the top 3-5 priorities','Defend the report aggressively'],2,'Acknowledge the concern and refocus on top priorities.'),
    Q('What is the correct response to the CFO\'s budget concern?',['Discount the price','Say "we can do everything for free"','Propose a phased approach starting with highest-impact actions','Cancel the engagement'],2,'Propose a phased approach prioritising highest-impact actions.'),
    Q('What should the advisor say when the CIO says "cybersecurity is an IT issue"?',['Agree and move on','"Cyber risk affects operations, customers, finances and reputation — it is an enterprise risk"','Ignore the comment','Tell the CIO they are wrong'],1,'Cyber risk is an enterprise risk affecting multiple business dimensions.'),
    Q('What is the correct response when the client says "we are not ready to buy anything"?',['Pressure the client','End the relationship','Respect the decision, suggest next steps when timing is right','Offer a discount'],2,'Respect the decision and maintain the relationship for when timing is right.'),
    Q('What should happen after a major equipment breakdown?',['Only process the claim','Only repair the machine','Respond immediately, coordinate claims, conduct post-loss review, update risk profile','Wait for the client to call'],2,'A complete response includes immediate action, claims coordination, post-loss review and risk profile update.'),
    Q('What should the advisor do when the CEO asks to hide the worse score from the board?',['Agree to hide it','Explain that accuracy must be maintained and offer constructive alternatives','Change the score','Ignore the request'],1,'Maintain accuracy and offer constructive alternatives for improvement.'),
    Q('What is a critical failure condition in the CCA assessment?',['Failing a knowledge check question','Manipulating a CoverScore assessment','Presenting a long report','Asking too many questions'],1,'Manipulating a CoverScore assessment is a critical failure.'),
    Q('What is the final CCA professional declaration about?',['Selling the most policies','Generating the highest premium','Helping clients understand risk, identify vulnerabilities and make informed decisions','Knowing all insurance products by heart'],2,'The declaration affirms the role of helping clients understand risk and make informed decisions.')
  ]),
  hScript('Final Integrated Advisory Simulation & Professional Assessment',[
    'Welcome to the final lesson of the CoverScore Academy. This is the culmination of everything you have learned across CCA 101 through CCA 108. The final assessment is designed to answer one question: can you independently perform as a professional CoverScore Advisor in a realistic client environment?',
    'Your capstone client is Nexora Industrial Systems — a manufacturing and technology company with 420 employees, $48 million in revenue, and significant recent growth. The board is concerned about operational disruption, cyber incidents, underinsurance, and business interruption.',
    'The simulation will take you through the complete advisory journey: from identifying Nexora as a prospect, through discovery and assessment, to protection strategy, executive presentation, business conversion, portfolio management, incident response, and ethical decision-making.',
    'The assessment reveals a key finding: the critical machine is insured at its original purchase price, not its current replacement value. But the real issue goes beyond the physical asset — the machine affects production capacity, revenue, customer contracts, and supply commitments. This is a multi-pillar exposure.',
    'When you present to the executive committee, expect resistance. The CEO will say it is too much. The CFO will question the budget. The COO will focus on keeping the factory running. The CIO will say cyber is an IT issue. Each challenge must be met with professional reasoning and client focus.',
    'Six months into the relationship, a major equipment breakdown occurs. Your response determines whether the relationship strengthens or weakens. Respond immediately, coordinate claims, then conduct a post-loss review that converts the event into risk intelligence.',
    'The final ethical challenge: the CEO asks you not to show the board the new, worse score. Your professional integrity is tested. The assessment must accurately reflect the risk position — explained, not hidden.',
    'Throughout this assessment, you are being evaluated not on what you know, but on what you can do — your judgment, your communication, your ability to handle pressure, and your commitment to professional standards. That is the standard of the Certified CoverScore Advisor.'
  ]),
  hWorkbook([
    {t:'The Complete Advisory Portfolio',i:'Produce a complete CoverScore Client Advisory Portfolio for Nexora Industrial Systems containing:',p:['Executive Risk Summary','Client Profile with business context','Risk Intelligence Report with all findings','Risk Object Map with at least 20 objects','Complete CoverScore Assessment with scores and interpretation','Risk Prioritisation Matrix','Protection Gap Analysis with 10 gaps','Integrated Protection Strategy','Executive Presentation (10-slide minimum)','Business Development Roadmap','Client Advisory Roadmap (12-month)','Claims/Post-Loss Review documentation','Ethical Decision Log']},
    {t:'The Final CCA Interview Preparation',i:'Prepare one-paragraph responses to these interview questions:',p:['What does it mean to be a CoverScore Advisor?','How is a CoverScore Advisor different from a traditional insurance salesperson?','How do you identify a client\'s real risk?','How do you determine which risks deserve priority?','What do you do when the client rejects your recommendation?','What do you do when management pressures you to manipulate an assessment?','How do you balance commercial objectives with client interests?','When should you escalate an issue?','How do you manage a client after a claim?','What does professional integrity mean to you?']},
    {t:'The "First Signal to Strategic Client" Simulation',i:'Take Nexora from first risk signal to long-term strategic client. Demonstrate the entire 18-stage journey: Identify opportunity, Prepare, Discover, Map Risk Objects, Build Risk Profile, Conduct CoverScore Assessment, Interpret risk intelligence, Identify Protection Gaps, Develop Protection Strategy, Present to executives, Handle objections, Convert insight into action, Build advisory roadmap, Manage a claim/incident, Conduct post-loss reassessment, Manage portfolio, Exercise ethical decision-making, Establish next annual review.'}
  ]),
  hCase('Nexora Industrial Systems — Final Capstone Simulation','Nexora Industrial Systems Limited: industrial manufacturing and technology-enabled equipment, 420 employees, $48M annual revenue, head office and manufacturing plant in Lagos, warehouse, regional distribution network, fleet of delivery vehicles, technical service division, digital customer portal. Rapid growth over 5 years with risk management systems not keeping pace. Board concerns: operational disruption, fire, equipment breakdown, cyber, supply chain, employee injuries, fleet accidents, liability, underinsurance, business interruption. Recent events: expanded facility, new machinery, increased inventory, launched digital portal, increased fleet to 70 vehicles, hired 100 employees, minor warehouse fire 6 months ago, planning second manufacturing location. Existing insurance but no comprehensive enterprise-wide risk review in 3 years.',[
    'Complete Stage 1: Identify Nexora as a high-value opportunity — analyse the 8 risk signals and prepare a prospecting briefing',
    'Complete Stage 2: Prepare the client engagement plan with objectives, risk hypotheses, stakeholders, and discovery questions',
    'Complete Stage 3: Conduct the discovery conversation — identify explicit, hidden, emerging and connected risk signals',
    'Complete Stage 4-5: Build the complete CoverScore assessment addressing the machinery valuation gap and multi-pillar exposure',
    'Complete Stage 6: Identify and prioritise all Protection Gaps',
    'Complete Stage 7: Develop the integrated Protection Strategy with four-layer responses',
    'Complete Stage 8: Prepare and deliver the executive presentation — handle CEO, CFO, COO and CIO challenges',
    'Complete Stage 9: Develop the business conversion plan with phased implementation',
    'Complete Stage 10: Handle the "not ready to buy" response professionally',
    'Complete Stage 11: Respond to the equipment breakdown — coordinate claims and conduct post-loss review',
    'Complete Stage 12: Handle the ethical challenge of the CEO asking to hide the worse score',
    'Complete Stage 13-18: Build the long-term portfolio management plan, produce the Client Value Report, and demonstrate the complete CoverScore Advisory Cycle'
  ]),
  hResources([
    {url:'#',type:'pdf',title:'Final CCA Assessment Framework',description:'Complete competency model, assessment criteria, scoring rubric and certification standards for the CCA 108 capstone'},
    {url:'#',type:'doc',title:'Nexora Industrial Systems Full Case Brief',description:'Complete client data including financials, operations, risk profile, stakeholder information and assessment results'},
    {url:'#',type:'pdf',title:'CCA Professional Mastery Interview Guide',description:'Preparation guide for the final professional interview including sample questions and assessment criteria'},
    {url:'#',type:'doc',title:'Complete CoverScore Advisory Portfolio Template',description:'Structured template for producing the complete client advisory portfolio required for CCA certification'}
  ])
);


// ═══════════════════════════════════════════════════════════════════
// COURSES 3-8: Template-based content generator
// ═══════════════════════════════════════════════════════════════════

function genContent(courseId, lessonNum, title, desc) {
  const cn = {
    3:'CoverScore Risk Assessment Methodology',
    4:'Advisory & Client Engagement',
    5:'Practical Risk Advisory & Client Assessment',
    6:'Risk Advisory Practice, Business Development & Client Growth',
     7:'Professional Risk Advisory Practice & Client Portfolio Management',
    8:'Capstone: Integrated Advisory Simulation & Professional Assessment'
  }[courseId];

  const c = hContent(title, [
    `Understand the key concepts of ${title}`,
    `Apply ${title.toLowerCase()} principles in client scenarios`,
    `Demonstrate practical knowledge of ${title.toLowerCase()}`
  ], [
    SE('Introduction',`Welcome to ${title}, part of ${cn}. This lesson covers essential concepts for every CoverScore advisor.`),
    SE('Core Concepts',`In this section, we explore the principles behind ${title.toLowerCase()}. Understanding these concepts enables you to provide better advice and build stronger client relationships.`),
    SE('Practical Application',`Consider how each concept applies to the clients you serve. Think about specific scenarios where this knowledge would improve the quality of advice you deliver.`),
    C(`Remember: The CoverScore approach is always client-centric. As you learn about ${title.toLowerCase()}, keep asking: "How does this help my client?"`),
    SE('Summary',`${title} builds your expertise as a CoverScore advisor. Apply these concepts to real client situations, always connecting learning back to client outcomes.`)
  ], [`${title} builds your CCA expertise`,`Apply these concepts to real client situations`,`Always connect learning back to client outcomes`]);

  const q = hQuiz([
    Q(`What is the primary focus of ${title}?`,[`Understanding and applying ${title.toLowerCase()} principles`,'Administrative tasks','Sales techniques','Marketing strategies'],0,`The primary focus is understanding ${title.toLowerCase()} principles.`),
    Q('How does this knowledge benefit your clients?',['It does not affect clients','It enables better, more informed advice','It only benefits the advisor','It is purely theoretical'],1,'This knowledge enables more informed, professional advice.'),
    Q('What is the CoverScore approach to advisory?',['Product-first','Client-centric, starting with risk assessment','Price-focused','Commission-driven'],1,'CoverScore is client-centric, starting with the client\'s risk profile.'),
    Q('True or False: Knowledge should always connect to client outcomes.',['True','False'],0,'Knowledge is most valuable when applied to improve client outcomes.'),
    Q('What should you ask when learning a new concept?',['How much does this cost?','How does this help my client?','Is this on the exam?','Can I skip this?'],1,'Always connect learning to client outcomes: "How does this help my client?"')
  ]);

  const vs = hScript(title, [
    `Welcome to ${title}, part of ${cn}. This lesson covers essential knowledge for your role as a CoverScore advisor.`,
    `We explore ${title.toLowerCase()} and how it applies to your advisory work. Understanding this topic will help you serve your clients more effectively.`,
    `After completing this lesson, you will have the knowledge and confidence to apply these concepts in real client situations. Let us get started.`
  ]);

  const wb = hWorkbook([
    {t:'Key Concepts Review',i:`Write a summary of the 3 most important concepts from ${title}.`,p:['Concept 1 and why it matters','Concept 2 and how to apply it','Concept 3 and its client impact']},
    {t:'Apply to a Client',i:'Think of a current or past client. How would this lesson change how you advise them?',p:['What would you do differently?','What new questions would you ask?','What additional value could you provide?']}
  ]);

  const cs = hCase(`Case Study: Applying ${title}`,`A client has approached you for advice. Using what you learned in ${title.toLowerCase()}, consider how you would approach this engagement and what recommendations you would make.`,[
    'Identify the key factors relevant to this client\'s situation.',
    'Apply the principles from this lesson to their circumstances.',
    'Develop a recommendation reflecting best practices.',
    'Explain how your approach adds value beyond standard advice.'
  ]);

  const r = hResources([
    {url:'#',type:'pdf',title:`${title} — Quick Reference`,description:'Summary of key concepts from this lesson'},
    {url:'#',type:'doc',title:`${title} — Worksheet`,description:'Practical exercise to reinforce learning'}
  ]);

  return {c, q, vs, wb, cs, r};
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const rows = await A("SELECT id, title, course_id, lesson_number, content FROM academy_modules WHERE id >= 50 AND course_id IS NOT NULL ORDER BY course_id, lesson_number");
  console.log(`Found ${rows.length} CCA modules to update`);

  let updated = 0, skipped = 0;

  for (const mod of rows) {
    let data;

    // Course 1 uses predefined content
    if (mod.course_id === 1 && C1[mod.lesson_number]) {
      data = C1[mod.lesson_number];
    }

    // Course 2 uses predefined content
    if (mod.course_id === 2 && C2[mod.lesson_number]) {
      data = C2[mod.lesson_number];
    }

    // Course 3 uses predefined content for CCA 103 lessons 5-8
    if (mod.course_id === 3 && C3[mod.lesson_number]) {
      data = C3[mod.lesson_number];
    }

    // Course 4 uses predefined content for CCA 104 (The Risk Advisor Mindset)
    if (mod.course_id === 4 && C4[mod.lesson_number]) {
      data = C4[mod.lesson_number];
    }

    // Course 5 uses predefined content for CCA 105 (Practical Risk Advisory & Client Assessment)
    if (mod.course_id === 5 && C5[mod.lesson_number]) {
      data = C5[mod.lesson_number];
    }

    // Course 6 uses predefined content for CCA 106 (Risk Advisory Practice, Business Development & Client Growth)
    if (mod.course_id === 6 && C6[mod.lesson_number]) {
      data = C6[mod.lesson_number];
    }

    // Course 7 uses predefined content for CCA 107 (Professional Risk Advisory Practice & Client Portfolio Management)
    if (mod.course_id === 7 && C7[mod.lesson_number]) {
      data = C7[mod.lesson_number];
    }

    // Course 8 uses predefined content for CCA 108 (Capstone: Integrated Advisory Simulation & Professional Assessment)
    if (mod.course_id === 8 && C8[mod.lesson_number]) {
      data = C8[mod.lesson_number];
    }

    // Courses 3-8 use generated content (fallback)
    if (mod.course_id >= 3 && mod.course_id <= 8 && !data) {
      data = genContent(mod.course_id, mod.lesson_number, mod.title, null);
    }

    if (!data) {
      console.log(`  No content for module ${mod.id}: ${mod.title}`);
      skipped++;
      continue;
    }

    const sets = [], params = [];

    // Always update all fields when data exists (force overwrite existing content)
    if (data.c) { sets.push('content = ?'); params.push(data.c); }
    if (data.q) { sets.push('quiz_data = ?'); params.push(data.q); }
    if (data.vs) { sets.push('video_script = ?'); params.push(data.vs); }
    if (data.wb) { sets.push('workbook_content = ?'); params.push(data.wb); }
    if (data.cs) { sets.push('case_study = ?'); params.push(data.cs); }
    if (data.r) { sets.push('resources = ?'); params.push(data.r); }

    if (sets.length > 0) {
      params.push(mod.id);
      await R(`UPDATE academy_modules SET ${sets.join(', ')} WHERE id = ?`, params);
      console.log(`  ✓ Module ${mod.id}: ${mod.title.slice(0,50)} — ${sets.length} fields`);
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Done! Updated ${updated} modules, skipped ${skipped}.`);
  db.close();
}

main().catch(err => { console.error(err); db.close(); });
