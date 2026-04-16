require('dotenv').config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral7b';

const generateRiskReport = async (assessmentData) => {
  const { answers, score, riskLevel, user, entityType = 'business' } = assessmentData;
  const isIndividual = entityType === 'individual';
  
  const { business, assets, liability, staff, insurance, personal, personal_assets, personal_liability, health, personal_insurance } = answers;

  const industry = isIndividual ? 'Individual/Personal' : (business?.industry || 'General Business');

  let prompt = '';
  
  if (isIndividual) {
    prompt = `You are an expert personal risk advisor specializing in Nigerian and African markets. Generate an extremely comprehensive personal risk assessment report for the following individual. Leave no risk unanalyzed.

**Personal Information:**
- Age Range: ${personal?.ageRange || 'Not specified'}
- Employment Status: ${personal?.employment || 'Not specified'}
- Dependents: ${personal?.dependents || 'Not specified'}
- Location Type: ${personal?.locationType || 'Not specified'}
- Monthly Income: ${personal?.income || 'Not specified'}

**Asset Information:**
- Housing Status: ${personal_assets?.housing || 'Not specified'}
- Vehicle Ownership: ${personal_assets?.vehicles || 'Not specified'}
- High-Value Items: ${personal_assets?.highValueItems || 'Not specified'}
- Savings/Investments: ${personal_assets?.savings || 'Not specified'}

**Liability & Lifestyle:**
- Pets: ${personal_liability?.pets || 'Not specified'}
- Domestic Staff: ${personal_liability?.domesticStaff || 'Not specified'}
- Travel Frequency: ${personal_liability?.travel || 'Not specified'}
- Hobbies/Risky Activities: ${personal_liability?.hobbies || 'Not specified'}

**Health:**
- General Health: ${health?.healthStatus || 'Not specified'}
- Pre-existing Conditions: ${health?.preExisting || 'Not specified'}
- Family Health History: ${health?.familyHistory || 'Not specified'}

**Current Insurance:**
- Health Insurance: ${personal_insurance?.health || 'Not specified'}
- Life Insurance: ${personal_insurance?.life || 'Not specified'}
- Motor Insurance: ${personal_insurance?.motor || 'Not specified'}
- Home Insurance: ${personal_insurance?.home || 'Not specified'}

**Risk Score:** ${score} (${riskLevel.toUpperCase()} Risk)

Generate a thorough personal risk assessment report in this exact JSON format with comprehensive, detailed content:
{
  "executiveSummary": "Detailed 4-5 sentence overview of the complete personal risk profile, including main concerns and priority actions",
  "topRisks": [
    { "risk": "Risk name", "description": "Detailed 2-3 sentence explanation of why this risk exists, how it could materialize, and potential consequences", "impact": "High/Medium/Low" }
  ],
  "financialImpact": "Comprehensive analysis with specific Naira amounts for medical emergencies, property loss, income disruption, liability claims. Include best/worst case scenarios.",
  "recommendations": ["Detailed insurance product 1 with rationale", "Product 2 with specific coverage needed", "Product 3 with estimated priority"],
  "urgencyLevel": "Immediate/Short-term/Medium-term with specific reasoning",
  "keyExposures": ["Exposure 1 with explanation", "Exposure 2", "Exposure 3", "Exposure 4", "Exposure 5"],
  "riskMitigationTimeline": { "immediate": "Action items within 30 days", "shortTerm": "Actions within 3 months", "mediumTerm": "Actions within 6-12 months" },
  "nigerianRegulatoryNotes": "Relevant NAICOM requirements, compulsory insurances in Nigeria, regulatory considerations"
}`;
  } else {
    prompt = `You are a senior insurance risk analyst with deep expertise in Nigerian and African business environments. Generate an extremely comprehensive business risk assessment report for the following enterprise. Analyze every risk dimension thoroughly.

**Business Information:**
- Industry/Sector: ${industry}
- Business Structure: ${business?.structure || 'Not specified'}
- Employee Count: ${business?.employees || 'Not specified'}
- Annual Revenue Range: ${business?.revenue || 'Not specified'}
- Location Type: ${business?.locationType || 'Not specified'}
- Years in Operation: ${business?.yearsInBusiness || 'Not specified'}
- Supply Chain Nature: ${business?.supplyChain || 'Not specified'}

**Physical Assets:**
- Equipment Type: ${assets?.equipment || 'Not specified'}
- Total Asset Value: ${assets?.assetValue || 'Not specified'}
- Fire Protection Systems: ${assets?.fireProtection || 'Not specified'}
- Security Systems: ${assets?.security || 'Not specified'}
- Previous Loss History: ${assets?.lossHistory || 'Not specified'}
- Stock/Inventory Value: ${assets?.inventory || 'Not specified'}

**Liability Exposures:**
- Customer Interaction Level: ${liability?.customerInteraction || 'Not specified'}
- Professional Services Provided: ${liability?.professionalServices ? 'Yes - Professional Liability Risk' : 'No'}
- Client Loss History: ${liability?.clientLoss || 'Not specified'}
- Product Liability: ${liability?.productLiability || 'Not specified'}
- Public Access: ${liability?.publicAccess || 'Not specified'}

**Human Resources:**
- Total Staff Count: ${staff?.count || 'Not specified'}
- Risk Exposure Type: ${staff?.riskExposure || 'Not specified'}
- Employee Benefits: ${staff?.benefits || 'Not specified'}
- Training Programs: ${staff?.training || 'Not specified'}
- Remote/Hybrid Work: ${staff?.remoteWork || 'Not specified'}

**Existing Insurance Coverage:**
- Current Policies: ${insurance?.existing || 'Not specified'}
- Last Policy Review: ${insurance?.lastReview || 'Not specified'}
- Coverage Gaps Likely: ${insurance?.gaps || 'Not specified'}

**Risk Score:** ${score} (${riskLevel.toUpperCase()} Risk)

Generate an exhaustive business risk assessment report in this exact JSON format with detailed, thorough content:
{
  "executiveSummary": "Comprehensive 4-5 sentence overview of the business risk profile, major vulnerabilities, and critical priority actions needed",
  "topRisks": [
    { "risk": "Risk name", "description": "Detailed 2-3 sentence analysis of WHY this risk exists for this specific business, HOW it could occur, and WHAT the financial and operational consequences would be", "impact": "High/Medium/Low" }
  ],
  "financialImpact": "Thorough financial impact analysis with specific Naira amounts for different risk scenarios (property damage, business interruption, liability claims, cyber incidents). Include probable maximum loss estimates.",
  "recommendations": ["Specific insurance product name with detailed rationale and suggested coverage limits", "Product 2 with priority ranking", "Product 3", "Product 4", "Product 5", "Product 6", "Risk management measure 1", "Risk management measure 2"],
  "urgencyLevel": "Immediate/Short-term/Medium-term with specific justification based on current risk exposure",
  "keyExposures": ["Detailed exposure 1 with Naira value at risk", "Exposure 2", "Exposure 3", "Exposure 4", "Exposure 5", "Exposure 6", "Exposure 7"],
  "riskMitigationTimeline": { "immediate": "Critical actions within 30 days to reduce exposure", "shortTerm": "Important actions within 3 months", "mediumTerm": "Strategic actions within 6-12 months" },
  "nigerianRegulatoryNotes": "NAICOM compliance requirements, compulsory insurances for this business type in Nigeria (Group Life, Third-Party Motor, etc.), regulatory deadlines, penalties for non-compliance"
}`;
  }

  try {
    const systemPrompt = `You are a senior insurance risk analyst with deep expertise in Nigerian and African insurance markets. You produce extremely comprehensive, detailed risk assessment reports that leave no area underexplored.

For each report you MUST include:
1. A detailed executive summary (4-5 sentences covering the full risk picture)
2. At least 5-7 top risks with thorough descriptions (2-3 sentences each) explaining WHY each risk exists and HOW it could impact the client
3. A comprehensive financial impact analysis with specific Naira amounts and scenarios
4. 6-8 specific, actionable insurance product recommendations with brief rationale for each
5. An urgency level with specific reasoning
6. 5-8 key exposures relevant to their industry/location
7. A risk mitigation timeline with prioritized action items
8. Relevant Nigerian regulatory considerations (NAICOM compliance, compulsory insurances)

Always respond with valid, complete JSON matching the schema exactly.`;

    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 4000 }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const reportContent = data.response;
    return JSON.parse(reportContent);
  } catch (error) {
    console.error('AI Service Error:', error.message);

    const getDefaultReport = () => {
      if (isIndividual) {
        return {
          executiveSummary: `This individual has a ${riskLevel} risk profile with a score of ${score}. The assessment reveals several areas requiring immediate attention to secure personal and family assets against unforeseen events. Based on the information provided, there are significant gaps in health coverage, asset protection, and financial security that should be addressed promptly to prevent potential financial hardship.`,
          topRisks: [
            { risk: 'Health Coverage Gap', description: 'No adequate health insurance detected. Without proper health coverage, a major medical emergency could result in catastrophic out-of-pocket expenses that could devastate personal savings and impact family financial stability.', impact: 'High' },
            { risk: 'Asset Protection Deficiency', description: 'Vehicles, property, and high-value items appear underinsured or uninsured. In the event of theft, accident, or natural disaster, replacing these assets could require significant personal expenditure.', impact: 'High' },
            { risk: 'Life Insurance Gap', description: 'No life insurance detected. In the event of death, dependents could face severe financial hardship including loss of income, debt burden, and inability to meet basic living expenses.', impact: 'High' },
            { risk: 'Income Protection Gap', description: 'No income protection or disability coverage in place. An illness or accident resulting in inability to work could deplete savings within months.', impact: 'Medium' },
            { risk: 'Liability Exposure', description: 'Domestic staff, pets, or property visitors create potential third-party liability exposure that could result in significant legal and compensation costs.', impact: 'Medium' }
          ],
          financialImpact: `Estimated total financial exposure of ₦${Math.max(score * 75000, 750000).toLocaleString()} including potential medical expenses (₦${Math.max(score * 30000, 300000).toLocaleString()}), asset replacement costs (₦${Math.max(score * 25000, 250000).toLocaleString()}), and liability claims (₦${Math.max(score * 20000, 200000).toLocaleString()}). Best case scenario represents minimum exposure while worst case could exceed ₦${Math.max(score * 200000, 2000000).toLocaleString()}.`,
          recommendations: [
            'Comprehensive Health Insurance covering hospitalization, outpatient care, and maternity with minimum ₦5M sum assured',
            'Motor Insurance (Comprehensive) for all registered vehicles with third-party liability minimum ₦1M',
            'Term Life Insurance with coverage equal to 5-10 years of income for dependent protection',
            'Home Contents Insurance covering fire, theft, and natural disasters',
            'Personal Accident Insurance providing income replacement during disability',
            'Domestic Staff Insurance covering employer liability for any staff injuries'
          ],
          urgencyLevel: riskLevel === 'critical' ? 'Immediate' : riskLevel === 'high' ? 'Short-term' : 'Medium-term',
          keyExposures: ['Medical emergencies requiring hospitalization', 'Road traffic accidents', 'Home火灾/ theft', 'Death or disability of primary earner', 'Third-party liability claims'],
          riskMitigationTimeline: { immediate: 'Obtain health insurance within 30 days', shortTerm: 'Secure life and motor insurance within 3 months', mediumTerm: 'Complete full coverage portfolio within 6 months' },
          nigerianRegulatoryNotes: 'While personal insurance is largely voluntary in Nigeria, health insurance is becoming mandatory under NHIA Act. Third-party motor insurance is compulsory. Consider NAICOM-regulated insurers for compliance.'
        };
      } else {
        return {
          executiveSummary: `This ${industry} business has a ${riskLevel} risk profile with a score of ${score}. The assessment reveals significant insurance coverage gaps that expose the business to potential financial losses from property damage, liability claims, and operational disruptions. Immediate attention is required to mitigate these risks and ensure business continuity.`,
          topRisks: [
            { risk: 'Property Insurance Gap', description: 'Business assets including equipment, inventory, and facilities appear underinsured against fire, theft, and natural disaster risks. A major property loss could threaten business continuity.', impact: 'High' },
            { risk: 'Liability Coverage Deficiency', description: 'Insufficient liability coverage for customer interactions, product/service delivery, and public access. A single liability claim could result in legal costs and compensation that significantly impact business finances.', impact: 'High' },
            { risk: 'Business Interruption Exposure', description: 'No business interruption coverage identified. If operations are disrupted by fire, equipment failure, or other insured events, the business could lose revenue while fixed costs continue.', impact: 'High' },
            { risk: 'Employee Risk Gap', description: 'Staff lack adequate protection through group life, workmen\'s compensation, or employee benefits insurance. Employee injury or death could result in significant compensation claims.', impact: 'Medium' },
            { risk: 'Professional Liability Risk', description: 'Business provides professional services creating exposure to professional indemnity claims for advice or services that fail to meet client expectations.', impact: 'Medium' },
            { risk: 'Cyber/Digital Asset Exposure', description: 'Modern businesses face cyber risks including data breach, ransomware, and digital disruption that may not be covered under traditional policies.', impact: 'Medium' },
            { risk: 'Supply Chain Vulnerability', description: 'Business operations depend on supply chain which may not be adequately covered for disruption scenarios.', impact: 'Low' }
          ],
          financialImpact: `Estimated total financial exposure of ₦${Math.max(score * 150000, 1500000).toLocaleString()} including property loss (₦${Math.max(score * 50000, 500000).toLocaleString()}), business interruption losses (₦${Math.max(score * 40000, 400000).toLocaleString()}), liability claims (₦${Math.max(score * 35000, 350000).toLocaleString()}), and employee-related costs (₦${Math.max(score * 25000, 250000).toLocaleString()}). Probable maximum loss could exceed ₦${Math.max(score * 500000, 5000000).toLocaleString()} for catastrophic scenarios.`,
          recommendations: [
            'Property Insurance (Fire, Burglary, Natural Disasters) with sum assured equal to full replacement cost of assets',
            'Business Owners Policy combining property, liability, and business interruption coverage',
            'General Liability Insurance with minimum ₦5M coverage for third-party bodily injury and property damage',
            'Group Life Insurance (Group Life Credit) as required under Nigerian Law (Insurance Act 2003)',
            'Workmen\'s Compensation Insurance covering employee injuries and occupational diseases',
            'Professional Indemnity Insurance if business provides professional consulting or advisory services',
            'Cyber Liability Insurance covering data breach response, business interruption, and regulatory penalties',
            'Directors & Officers Liability Insurance if business has formal board structure'
          ],
          urgencyLevel: riskLevel === 'critical' ? 'Immediate' : riskLevel === 'high' ? 'Short-term' : 'Medium-term',
          keyExposures: ['Fire and property damage', 'Theft and burglary', 'Business interruption from covered events', 'Third-party liability claims', 'Employee injury or death', 'Professional negligence claims', 'Data breach and cyber incidents'],
          riskMitigationTimeline: { immediate: 'Obtain mandatory covers (Group Life, Third-Party Motor) within 30 days', shortTerm: 'Secure property and liability coverage within 3 months', mediumTerm: 'Review and enhance coverage portfolio within 6-12 months' },
          nigerianRegulatoryNotes: 'Nigeria requires Group Life Insurance for employees with minimum 3 lives (Insurance Act 2003). Third-party motor insurance is compulsory for all vehicles. Consider NAICOM compliance for all insurance placements through licensed insurers.'
        };
      }
    };

    return getDefaultReport();
  }
};

// AI Explanation Layer - Transforms technical risk data into humanized, contextualized insights
const generateExplanations = async (assessmentData) => {
  const { answers, score, riskLevel, user, entityType = 'business' } = assessmentData;
  const isIndividual = entityType === 'individual';

  const business = answers?.business;
  const assets = answers?.assets;
  const liability = answers?.liability;
  const staff = answers?.staff;
  const insurance = answers?.insurance;
  const personal = answers?.personal;
  const personalAssets = answers?.personal_assets;
  const personalLiability = answers?.personal_liability;
  const health = answers?.health;
  const personalInsurance = answers?.personal_insurance;

  const industry = isIndividual ? 'your situation' : (business?.industry || 'your business');
  const name = user?.name || (isIndividual ? 'your family' : 'your business');

  // Generate personalized narrative based on score and risk level
  const generateNarrative = () => {
    const narratives = {
      critical: {
        business: `Your business in the ${industry} sector faces significant risk exposure that requires immediate attention. With a score of ${score}, your operations are vulnerable to multiple potential disruptions that could impact your revenue, assets, and long-term sustainability.`,
        individual: `Your current financial situation shows substantial vulnerability that could affect your family's security. With a score of ${score}, unexpected events could quickly create financial pressure that may be difficult to recover from without proper protection in place.`
      },
      high: {
        business: `Your ${industry} business has notable risk gaps that merit serious consideration. While your operations are functioning, the current risk exposure leaves room for improvement in protecting your assets, employees, and bottom line against potential disruptions.`,
        individual: `Your family's financial foundation shows areas that could be more resilient. While you're managing day-to-day, there are key vulnerabilities that a sudden change in circumstances could expose.`
      },
      moderate: {
        business: `Your ${industry} business has a reasonable risk profile with some areas for enhancement. You're managing core risks, but there's opportunity to strengthen your protection and potentially reduce costs through optimized coverage.`,
        individual: `Your financial situation is relatively stable with some opportunities to improve. You're on the right track, but a few targeted actions could significantly enhance your financial security.`
      },
      low: {
        business: `Your ${industry} business demonstrates solid risk management practices. You're well-positioned to handle unexpected events, though periodic reviews ensure your coverage stays aligned with growth and changing circumstances.`,
        individual: `You've built a strong financial foundation for yourself and your family. Maintaining this requires ongoing attention and ensuring your protection keeps pace with life changes.`
      }
    };

    return riskLevel in narratives ? narratives[riskLevel][isIndividual ? 'individual' : 'business'] : narratives.moderate[isIndividual ? 'individual' : 'business'];
  };

  // Generate contextualized risk explanations
  const generateRiskContexts = () => {
    const contexts = [];

    if (!isIndividual) {
      // Business-specific contextual explanations
      if (insurance?.existing === 'none') {
        contexts.push({
          factor: 'Insurance Coverage Gap',
          explanation: `Without insurance protection, a single unexpected event—such as fire, theft, or a liability claim—could force you to cover costs from savings or borrowing. This could derail your business plans and personal finances simultaneously.`,
          why: 'Every business faces unpredictable risks. Insurance exists specifically because these events, while unlikely, can be devastating when they occur.',
          impact: 'High'
        });
      }

      if (assets?.fireProtection === 'none') {
        contexts.push({
          factor: 'Fire Safety Vulnerability',
          explanation: `Without fire protection systems, your equipment, inventory, and property face significant exposure. Fire can destroy years of hard work in minutes, and recovery may not be possible for many small businesses.`,
          why: 'Property fires remain one of the leading causes of business losses. Even if you believe the risk is low, the potential consequences far outweigh the cost of protection.',
          impact: 'High'
        });
      }

      if (liability?.customerInteraction === 'onsite') {
        contexts.push({
          factor: 'Customer-Facing Operations',
          explanation: `When customers visit your premises, any accident or injury they experience could result in liability claims. Even with good safety practices, the reality of customer traffic creates exposure.`,
          why: 'Slips, falls, and other incidents can happen anywhere. Without liability coverage, a single claim could result in legal costs and compensation that significantly impacts your business.',
          impact: 'Medium'
        });
      }

      if (staff?.benefits === 'none') {
        contexts.push({
          factor: 'Employee Protection Gap',
          explanation: `Your employees face workplace risks daily. Without proper benefits and workers' compensation coverage, both they and your business are vulnerable to the financial impact of workplace injuries.`,
          why: 'Workplace injuries can happen in any industry. Without proper coverage, you could face both humanitarian costs and legal liability.',
          impact: 'Medium'
        });
      }

      if (assets?.lossHistory === 'frequent') {
        contexts.push({
          factor: 'Loss History Pattern',
          explanation: `Previous claims suggest your operations face elevated risk factors that insurance providers will consider. This isn't just about past events—it's about understanding what patterns may continue.`,
          why: 'Insurers assess past losses to predict future risk. Addressing underlying issues now can improve your coverage options and potentially lower costs.',
          impact: 'Medium'
        });
      }

      if (business?.employees === 'large') {
        contexts.push({
          factor: 'Employee Count Risk',
          explanation: `With many employees, your responsibilities and potential exposures increase proportionally. Each person represents both a business asset and a potential liability scenario.`,
          why: 'More employees means more workplace interactions, greater benefits administration complexity, and higher stakes for compliance and protection.',
          impact: 'Medium'
        });
      }
    } else {
      // Individual-specific contextual explanations
      if (personalInsurance?.health === 'none') {
        contexts.push({
          factor: 'Health Protection Gap',
          explanation: `Without health coverage, a medical emergency could mean thousands of naira in out-of-pocket expenses. This could deplete your savings or force you into debt during an already difficult time.`,
          why: 'Healthcare costs continue to rise. A hospital stay or unexpected illness can quickly become a financial crisis without proper protection.',
          impact: 'High'
        });
      }

      if (personalInsurance?.life === 'none') {
        contexts.push({
          factor: 'Life Insurance Gap',
          explanation: `If something happened to you, your family would lose your income and potentially face serious financial hardship. Life insurance provides security that your loved ones can count on.`,
          why: 'Nobody expects tragedy, but those left behind bear the financial consequences. Life insurance ensures your family maintains their standard of living.',
          impact: 'High'
        });
      }

      if (personalAssets?.housing === 'owned') {
        contexts.push({
          factor: 'Property Exposure',
          explanation: `Your home is likely your biggest asset—and your biggest exposure. Fire, natural disasters, or accidents could threaten not just your shelter but your entire financial foundation.`,
          why: 'Property ownership means responsibility for everything that happens on your premises. Without proper coverage, repair or rebuild costs come from your pocket.',
          impact: 'High'
        });
      }

      if (personal?.dependents === 'many' || personal?.dependents === 'few') {
        contexts.push({
          factor: 'Family Dependents',
          explanation: `With people depending on your income, any disruption to your ability to work creates direct financial consequences for your family's wellbeing and future plans.`,
          why: 'Dependents rely on your continued income. Disability, illness, or death would shift financial burdens to already-vulnerable family members.',
          impact: 'High'
        });
      }

      if (personalAssets?.vehicles === 'multiple' || personalAssets?.vehicles === 'one') {
        contexts.push({
          factor: 'Motor Vehicle Exposure',
          explanation: `Vehicles represent both valuable assets and significant liability exposure. An accident can result in repair costs, medical bills, and potential legal claims.`,
          why: "Nigeria's roads see thousands of accidents annually. Without proper motor insurance, you're personally responsible for all costs from any accident you're involved in.",
          impact: 'Medium'
        });
      }

      if (health?.healthStatus === 'poor' || health?.healthStatus === 'fair') {
        contexts.push({
          factor: 'Health Vulnerability',
          explanation: `Your current health status means you may face higher medical needs. Without comprehensive health coverage, routine care and unexpected illnesses can create significant financial strain.`,
          why: 'Health issues often compound—managing existing conditions while facing new health challenges without coverage can deplete resources quickly.',
          impact: 'High'
        });
      }
    }

    return contexts;
  };

  // Generate urgency messaging
  const generateUrgency = () => {
    const urgencies = {
      critical: {
        message: `Your risk level requires prompt attention. The gaps identified could have serious consequences if unexpected events occur. We recommend taking action within the next 30 days.`,
        reasons: [
          `Unforeseen events don't wait for convenient timing—they simply happen`,
          `The longer coverage gaps persist, the longer your vulnerability continues`,
          `Acting now ensures protection when you need it most`
        ]
      },
      high: {
        message: `While your situation isn't critical, addressing these gaps soon will provide important peace of mind and financial protection.`,
        reasons: [
          `Risk积累—waiting increases both exposure and potential costs`,
          `Insurance premiums often increase with age and health changes`,
          `Coverage obtained today protects against tomorrow's unexpected events`
        ]
      },
      moderate: {
        message: `Your risk profile is manageable, but improvement is possible. A thoughtful approach to closing gaps can enhance your overall protection.`,
        reasons: [
          `Regular reviews keep your coverage aligned with life changes`,
          `Small investments now can prevent larger costs later`,
          `Peace of mind has real value for you and your family`
        ]
      },
      low: {
        message: `You're in a good position. Periodic reviews ensure your protection stays current as your circumstances evolve.`,
        reasons: [
          `Life changes—new assets, new responsibilities, new risks`,
          `Annual reviews help identify emerging gaps early`,
          `Maintaining good habits supports long-term financial health`
        ]
      }
    };

    return riskLevel in urgencies ? urgencies[riskLevel] : urgencies.moderate;
  };

  // Generate educational content for recommendations
  const generateEducation = () => {
    const topics = [];

    if (!isIndividual) {
      topics.push({
        recommendation: 'Business Owners Insurance',
        explanation: 'This combines multiple coverages—property, liability, and business interruption—into one package. It\'s designed specifically for businesses like yours to simplify protection while ensuring comprehensive coverage.',
        benefit: 'One policy, multiple protections, streamlined administration'
      });

      topics.push({
        recommendation: 'Group Life Insurance',
        explanation: 'Nigerian law requires employers to provide group life coverage for employees. This protects your staff while ensuring your business complies with Insurance Act requirements.',
        benefit: 'Legal compliance plus employee loyalty and trust'
      });

      topics.push({
        recommendation: 'Professional Liability Coverage',
        explanation: 'If your business provides advice, services, or professional expertise, this protects you against claims of negligence or errors. It\'s about protecting your reputation and financial stability.',
        benefit: 'Covers legal defense costs and compensation claims'
      });

      if (liability?.customerInteraction === 'onsite') {
        topics.push({
          recommendation: 'Public Liability Insurance',
          explanation: 'This covers injuries or property damage that visitors experience on your premises. It\'s essential for any business that welcomes customers or clients.',
          benefit: 'Protects both your visitors and your business from unexpected incidents'
        });
      }
    } else {
      topics.push({
        recommendation: 'Health Insurance',
        explanation: 'This covers hospitalization, medical treatments, and sometimes outpatient care. With healthcare costs rising, it prevents a medical emergency from becoming a financial crisis.',
        benefit: 'Access to quality healthcare without depleting savings'
      });

      topics.push({
        recommendation: 'Term Life Insurance',
        explanation: 'This provides financial protection for your family if something happens to you. It\'s affordable coverage that ensures your loved ones can maintain their lifestyle.',
        benefit: 'Income replacement and financial security for dependents'
      });

      topics.push({
        recommendation: 'Motor Insurance',
        explanation: 'Third-party motor insurance is legally required in Nigeria, but comprehensive coverage goes further—it covers damage to your vehicle, theft, and more.',
        benefit: 'Legal compliance plus protection for your vehicle investment'
      });
    }

    return topics;
  };

  // Generate conversion guidance
  const generateConversionGuidance = () => {
    const conversions = {
      critical: {
        headline: 'Take the next step toward complete protection',
        cta: 'Speak with an advisor today',
        subtext: 'Given your situation, a personalized consultation can help you prioritize the most critical coverage first.'
      },
      high: {
        headline: 'Strengthen your protection with expert guidance',
        cta: 'Request a quote',
        subtext: 'An advisor can help you build a comprehensive plan that addresses your specific gaps efficiently.'
      },
      moderate: {
        headline: 'Optimize your coverage for better protection',
        cta: 'Explore your options',
        subtext: 'With the right guidance, you can enhance your protection while potentially finding cost savings.'
      },
      low: {
        headline: 'Keep your protection current',
        cta: 'Review your coverage',
        subtext: 'Regular reviews ensure your coverage keeps pace with your evolving needs and circumstances.'
      }
    };

    return riskLevel in conversions ? conversions[riskLevel] : conversions.moderate;
  };

  return {
    narrative: generateNarrative(),
    riskContexts: generateRiskContexts(),
    urgency: generateUrgency(),
    education: generateEducation(),
    conversion: generateConversionGuidance(),
    personalizedFor: name,
    entityType,
    generatedAt: new Date().toISOString()
  };
};

module.exports = { generateRiskReport, generateExplanations };
