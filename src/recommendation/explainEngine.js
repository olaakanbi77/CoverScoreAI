const EXPLANATION_TEMPLATES = {
  GPA: {
    school: 'Because your school scored {score}% in {pillar}, students and staff may be vulnerable to accidental injuries during school activities. Group Personal Accident insurance provides financial protection for medical expenses and compensation in case of accidental bodily injury, giving parents and the school administration peace of mind.',
    hospital: 'With a patient safety score of {score}%, patients and staff face elevated accident risk. Group Personal Accident cover ensures financial protection for accidental injuries occurring on your premises.',
    sme: 'Your workforce risk score of {score}% indicates employees may be exposed to workplace accidents. Group Personal Accident cover provides compensation for accidental injury or death.',
    church: 'Given your premises safety score of {score}%, congregants and visitors could be at risk. Group Personal Accident cover protects against accidental injuries during church activities.',
    family: 'Your family protection assessment shows a score of {score}%, indicating gaps in financial safety nets. Personal Accident cover provides income replacement if you are unable to work due to injury.',
    default: 'With a {pillar} score of {score}%, there is elevated risk in this area. Group Personal Accident cover is recommended to protect against the financial impact of accidental injuries.',
  },
  FIRE: {
    school: 'School buildings house valuable equipment, records, and irreplaceable teaching materials. With a property protection score of {score}%, the risk of fire-related loss is significant. Fire & Special Perils Insurance covers buildings, contents, and stock against fire, lightning, explosions, and other specified perils.',
    mfg: 'Manufacturing facilities concentrate high-value assets in one location. With a fire risk score of {score}%, the potential loss from a fire event could be catastrophic. Fire & Special Perils Insurance protects factory buildings, machinery, stock, and raw materials.',
    sme: 'Your business assets represent a significant investment. With an asset protection score of {score}%, the risk of fire damage could disrupt your entire operation. Fire & Special Perils Insurance provides comprehensive cover for your premises and contents.',
    church: 'Churches hold both valuable equipment and sentimental community assets. With a property risk score of {score}%, protecting these assets against fire is essential for ministry continuity.',
    default: 'Your {pillar} score of {score}% indicates significant exposure to property damage. Fire & Special Perils Insurance protects buildings, contents, and equipment against fire and related perils.',
  },
  PL: {
    school: 'Schools regularly welcome parents, visitors, and service providers onto their premises. With a student safety score of {score}%, the risk of a third-party incident is elevated. Public Liability Insurance covers legal costs and compensation if a visitor is injured or their property is damaged on school grounds.',
    hospital: 'Hospitals face constant third-party exposure from patients, visitors, and suppliers. With a liability score of {score}%, Public Liability Insurance is essential to protect against compensation claims.',
    sme: 'Your business interacts with customers, suppliers, and the public daily. A legal liability score of {score}% suggests meaningful exposure. Public Liability Insurance protects your business against third-party injury or property damage claims.',
    church: 'With a premises safety score of {score}%, the risk to congregants and visitors is elevated. Public Liability Insurance covers legal liability for injuries on church premises.',
    entrepreneur: 'As an entrepreneur, your business activities create personal liability exposure. Public Liability Insurance separates your business risk from your personal assets.',
    default: 'Your {pillar} score of {score}% indicates liability exposure. Public Liability Insurance protects against the financial consequences of third-party claims.',
  },
  MOTOR: {
    school: 'School buses carry your most important passengers students. With a transport safety score of {score}%, comprehensive motor insurance is essential. It covers damage to or loss of school vehicles and provides third-party liability protection.',
    default: 'Vehicle-related risk is a significant concern with a {pillar} score of {score}%. Comprehensive Motor Insurance protects your vehicles against damage, theft, and third-party liability.',
  },
  BI: {
    school: 'If a fire, flood, or other event forced your school to close temporarily, the financial impact could be severe. With a business continuity score of {score}%, Business Interruption Insurance helps replace lost income and covers ongoing expenses during the recovery period.',
    mfg: 'Production stoppages can be extremely costly. With a business interruption risk of {score}%, this cover replaces lost income and covers fixed expenses while your facility is being repaired.',
    sme: 'Your operations could be disrupted by events beyond your control. With an operations score of {score}%, Business Interruption Insurance helps maintain cash flow during unexpected closures.',
    default: 'Your {pillar} score of {score}% indicates significant operational risk. Business Interruption Insurance protects your income when unexpected events disrupt your operations.',
  },
  TERM_LIFE: {
    family: 'Your family depends on your income for daily living, education, and future goals. With a family protection score of {score}%, Term Life Insurance ensures that your loved ones remain financially secure if you are no longer there to provide for them.',
    default: 'Your {pillar} score of {score}% indicates that your dependents could face financial hardship. Term Life Insurance provides a lump-sum payment to protect those who depend on you.',
  },
  INDIVIDUAL_HEALTH: {
    hlt: 'Access to quality healthcare is fundamental to your wellbeing. With a health security score of {score}%, Individual Health Insurance ensures you can access medical care without the financial strain of out-of-pocket expenses.',
    family: 'Your familys health is priceless. With a health security score of {score}%, health insurance protects both your familys wellbeing and your savings from unexpected medical costs.',
    default: 'Your {pillar} score of {score}% indicates a healthcare coverage gap. Health Insurance protects against the financial impact of medical expenses.',
  },
  PERSONAL_ACCIDENT: {
    inc: 'Your income is your most valuable asset. With an income stability score of {score}%, Personal Accident Insurance provides a financial safety net if an accident prevents you from working.',
    default: 'With a {pillar} score of {score}%, protection against accident-related income loss is important. Personal Accident Insurance provides compensation for accidental injuries.',
  },
  MED_MALPRACTICE: {
    hospital: 'Healthcare providers face unique liability risks. With a clinical liability score of {score}%, Medical Malpractice Insurance is essential to protect your practice, your reputation, and your patients interests in the event of an adverse clinical outcome.',
    default: 'Professional liability exposure is significant with a {pillar} score of {score}%. Medical Malpractice Insurance provides critical protection for healthcare professionals.',
  },
  EE: {
    hospital: 'Modern healthcare depends on sophisticated diagnostic and treatment equipment. With an equipment protection score of {score}%, Electronic Equipment Insurance covers the cost of repair or replacement if your medical devices break down or are damaged.',
    default: 'Your equipment represents a major investment. Electronic Equipment Insurance protects against the cost of breakdown or damage.',
  },
  MB: {
    mfg: 'Production machinery is the heart of your manufacturing operation. With a machinery score of {score}%, a single breakdown could halt production for days or weeks. Machinery Breakdown Insurance covers repair costs and helps you get back into production quickly.',
    default: 'With a {pillar} score of {score}%, your machinery is at risk of costly breakdowns. Machinery Breakdown Insurance protects your production capability.',
  },
  EMPLOYERS_LIABILITY: {
    sme: 'Your employees are your most important asset. With a workforce score of {score}%, Employers Liability Insurance covers your legal obligation to compensate employees who are injured or become ill because of their work.',
    mfg: 'Manufacturing environments present inherent workplace risks. With a workforce safety score of {score}%, Employers Liability cover is both a legal requirement and a moral responsibility.',
    default: 'Workplace injuries can happen in any business. Employers Liability Insurance protects both your employees and your business.',
  },
  FAMILY_HEALTH: {
    hlt: 'Your familys health coverage needs may extend beyond individual plans. With a health access score of {score}%, a Family Health Plan provides comprehensive coverage for every family member under a single policy.',
    family: 'Protecting your entire familys health is a priority. With a health security score of {score}%, a Family Health Plan ensures everyone has access to quality healthcare.',
    default: 'Your {pillar} score of {score}% indicates a family health coverage gap. A Family Health Plan provides coordinated care for all family members.',
  },
  INCOME_PROTECTION: {
    inc: 'Your ability to earn an income is the foundation of your financial life. With an income stability score of {score}%, Income Protection Insurance replaces a portion of your income if illness or injury prevents you from working.',
    entrepreneur: 'As an entrepreneur, your income may be less predictable. With an income volatility score of {score}%, Income Protection provides a safety net for when unexpected health issues affect your ability to earn.',
    default: 'With a {pillar} score of {score}%, your income is at risk. Income Protection Insurance replaces a portion of your earnings during periods of illness or disability.',
  },
  EDUCATION: {
    family: 'Your children education is one of the most important investments you will make. With an education funding score of {score}%, an Education Plan helps ensure that school fees and university costs are covered regardless of what happens.',
    default: 'Education funding is a significant long-term commitment. An Education Plan guarantees funds are available when needed.',
  },
  RETIREMENT: {
    ret: 'Your retirement lifestyle depends on decisions made today. With a retirement savings score of {score}%, starting or increasing your retirement contributions now can significantly improve your future financial security.',
    ypr: 'Time is your greatest advantage in retirement planning. With a financial foundation score of {score}%, starting a Retirement Plan now allows decades of compound growth to work for you.',
    family: 'Your familys long-term financial security includes your own retirement. With a retirement readiness score of {score}%, building retirement savings ensures you will not be a burden on your children.',
    default: 'With a {pillar} score of {score}%, closing the retirement savings gap is important. A Retirement Plan helps build the nest egg you need for a comfortable retirement.',
  },
  CRITICAL_ILLNESS: {
    hlt: 'A critical illness diagnosis can be devastating both emotionally and financially. With a health security score of {score}%, Critical Illness Cover provides a lump-sum payment when you need it most, allowing you to focus on recovery without financial worry.',
    family: 'A serious illness affects the entire family. Critical Illness Cover provides financial support when a covered condition is diagnosed, helping your family navigate a difficult time.',
    default: 'With a {pillar} score of {score}%, the financial impact of a serious illness could be severe. Critical Illness Cover provides a lump sum on diagnosis of a covered condition.',
  },
  CYBER_LIABILITY: {
    sme: 'Small and medium businesses are increasingly targeted by cyber attacks. With a cyber risk score of {score}%, a single data breach could compromise customer trust and result in significant financial loss. Cyber Liability Insurance covers response costs, legal fees, and notification expenses.',
    default: 'With a {pillar} score of {score}%, your digital assets are at risk. Cyber Liability Insurance protects against data breaches, ransomware, and other cyber threats.',
  },
  KEYMAN: {
    sme: 'If a key employee or director were suddenly unable to work, the impact on your business could be severe. Keyman Insurance provides a financial cushion to help the business recruit, train, and stabilize during the transition period.',
    default: 'Your business depends on key individuals. Keyman Insurance protects against the financial loss if a key person is unable to continue in their role.',
  },
  FG: {
    church: 'Churches handle donations, tithes, and offering funds that require careful stewardship. Fidelity Guarantee Insurance protects against financial loss if a trusted employee or volunteer misappropriates church funds.',
    sme: 'Any business that handles cash or financial records faces some risk of employee dishonesty. Fidelity Guarantee Insurance provides protection against financial loss from fraudulent activities.',
    default: 'With a {pillar} score of {score}%, protection against employee dishonesty is worth considering. Fidelity Guarantee Insurance covers financial losses from fraudulent activities.',
  },
  D_O: {
    sme: 'Directors and officers make decisions that can attract legal challenges. Directors & Officers Liability Insurance protects the personal assets of company leaders if they are sued for alleged wrongful acts in managing the company.',
    default: 'Leadership comes with personal liability exposure. D&O Insurance protects directors and officers against claims related to their management decisions.',
  },
  GOODS_IN_TRANSIT: {
    sme: 'If your business ships goods to customers or between locations, those goods are at risk during transportation. Goods in Transit Insurance covers loss or damage to merchandise while being transported.',
    default: 'Goods in transit face risks from accidents, theft, and weather. Goods in Transit Insurance protects your inventory while it is on the move.',
  },
  HOSPITAL_CASH: {
    hlt: 'Even with health insurance, hospitalization often comes with additional costs. Hospital Cash Plan provides a daily cash benefit for each day you are hospitalized, helping cover incidental expenses and lost income.',
    default: 'Hospitalization can create additional financial pressure. Hospital Cash Plan provides daily cash payments to ease the burden.',
  },
};

function generateExplanation(productRec, gaps, assessmentType, answers) {
  const code = productRec.productCode;
  const templates = EXPLANATION_TEMPLATES[code];
  if (!templates) {
    return `Based on your ${productRec.severity} priority need "${productRec.needLabel}", ${productRec.productName} is recommended as a strategy to address this risk.`;
  }

  let gap = null;
  if (productRec.matchingGapPillar) {
    gap = gaps.find(g => g.pillarKey === productRec.matchingGapPillar);
  }
  if (!gap) {
    gap = gaps.find(g => productRec.factors.some(f => g.pillarKey && g.pillarKey.includes(f.substring(0, 10))));
  }

  const score = gap ? gap.score : 50;
  const pillar = gap ? gap.label : productRec.needLabel;

  const template = templates[assessmentType.toLowerCase()] || templates[Object.keys(templates).find(k => assessmentType.toLowerCase().startsWith(k))] || templates.default;
  if (!template) {
    return `${productRec.productName} helps address your need to "${productRec.needLabel.toLowerCase()}".`;
  }

  return template.replace(/\{score\}/g, score).replace(/\{pillar\}/g, pillar.toLowerCase());
}

function generateCopilotBrief(gaps, needs, productRecs, categories) {
  const criticalGaps = gaps.filter(g => g.severity === 'critical' || g.severity === 'high');
  const highPriority = productRecs.filter(r => r.priority === 'high');

  const summary = criticalGaps.length > 0
    ? `The client has ${criticalGaps.length} significant risk ${criticalGaps.length === 1 ? 'gap' : 'gaps'} requiring attention across ${criticalGaps.map(g => g.label).join(', ')}.`
    : 'The client shows moderate risk exposure with opportunities for improvement.';

  const suggestedOpening = `Based on your assessment, I have identified several areas where we can strengthen your protection. Specifically, ${criticalGaps.slice(0, 2).map(g => `your ${g.label.toLowerCase()} score is ${g.score}%`).join(' and ')}. Let me walk you through some practical solutions.`;

  return {
    summary,
    keyRisks: criticalGaps.map(g => g.label),
    recommendedProducts: highPriority.map(r => r.productName),
    suggestedOpening,
    likelyObjections: ['Cost of additional premiums', 'Perceived overlaps with existing coverage', 'Timing of policy implementation'],
  };
}

module.exports = { generateExplanation, generateCopilotBrief, EXPLANATION_TEMPLATES };
