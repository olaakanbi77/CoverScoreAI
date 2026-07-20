/**
 * Populate full lesson content for all 60 CCA v3 lessons (modules 50-109).
 * Run: node scripts/populate_cca_content.js
 * Safe to run multiple times — UPDATE only, no INSERT.
 */

const sqlite3 = require('sqlite3');
const path = require('path');
const { promisify } = require('util');
const DB_PATH = path.join(__dirname, '..', 'data', 'coverscore.db');
const db = new sqlite3.Database(DB_PATH);

const R = promisify(db.run.bind(db));
const G = promisify(db.get.bind(db));
const A = promisify(db.all.bind(db));

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
// COURSES 2-8: Template-based content generator
// ═══════════════════════════════════════════════════════════════════

function genContent(courseId, lessonNum, title, desc) {
  const cn = {
    2:'The Nigerian Insurance Market & Regulatory Environment',
    3:'CoverScore Risk Assessment Methodology',
    4:'Advisory & Client Engagement',
    5:'CoverScore Product Suite & Solutions Design',
    6:'Ethics, Compliance & Professional Standards',
    7:'Digital Tools & Technology in Advisory',
    8:'Capstone: Integrated Advisory Simulation & Assessment'
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

    // Courses 2-8 use generated content
    if (mod.course_id >= 2 && mod.course_id <= 8) {
      data = genContent(mod.course_id, mod.lesson_number, mod.title, null);
    }

    if (!data) {
      console.log(`  No content for module ${mod.id}: ${mod.title}`);
      skipped++;
      continue;
    }

    const sets = [], params = [];

    if (data.c && !mod.content) { sets.push('content = ?'); params.push(data.c); }
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
