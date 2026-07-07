require('dotenv').config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-large-latest';
const aiContext = require('./aiContextProvider');

/**
 * Call Mistral API helper
 */
async function callMistral(systemPrompt, userPrompt, jsonMode = true) {
  if (!MISTRAL_API_KEY || MISTRAL_API_KEY === 'your-mistral-api-key-here') {
    throw new Error('MISTRAL_API_KEY is not configured.');
  }

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: jsonMode ? { type: "json_object" } : { type: "text" },
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Mistral API Error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return jsonMode ? JSON.parse(content) : content;
}

// ----------------------------------------------------------------------------
// PROMPT 5: INDUSTRY RISK CONSULTANT™ (System Prompt Generator)
// ----------------------------------------------------------------------------
function getIndustryConsultantPrompt(industryData) {
  const baseDescription = "You are CoverScore AI, a highly professional Insurance Risk Intelligence and Advisory Platform. Your goal is to help individuals and businesses become more resilient by identifying insurance gaps, assessing risk exposures (Property, Liability, Continuity, Cyber, etc.), explaining consequences, and prioritizing protective actions.";
  
  if (!industryData) {
    return `${baseDescription} You never sound like a salesperson. You focus strictly on resilience and professional risk assessment.`;
  }
  return `${baseDescription}
You are an expert ${industryData.industry} Risk Consultant. 
Your goal is to help businesses in the ${industryData.industry} sector become more resilient.
You understand that their top risks typically include: ${industryData.top_risks.join(', ')}.
You never sound like a salesperson. You focus strictly on resilience, explaining consequences, and prioritizing insurance actions.`;
}

// ----------------------------------------------------------------------------
// PROMPT 1: REPORT GENERATOR AI™
// ----------------------------------------------------------------------------
const generateRiskReport = async (assessmentData, creIntelligence) => {
  const { topRisks, recommendations, industryData } = creIntelligence;
  
  const systemPrompt = getIndustryConsultantPrompt(industryData);
  const prefix = assessmentData?.answers?.template_selection?.template_id
    || (assessmentData?.answers ? Object.keys(assessmentData.answers).find(k => k.match(/^[A-Z]+_\d+$/))?.split('_')[0] : null)
    || null;
  const knowledgeContext = prefix ? aiContext.buildReportContext(prefix, assessmentData.answers || {}, {
    score: assessmentData.score,
    risk_level: assessmentData.riskLevel,
    risk_categories: assessmentData.risk_categories,
    risk_profile: assessmentData.risk_profile
  }) : null;
  
  const userPrompt = `Generate a P.R.O.T.E.C.T™ Report for the following assessment data.

Assessment Context:
${JSON.stringify(assessmentData, null, 2)}

CRE Intelligence (Top Risks):
${JSON.stringify(topRisks)}

CRE Intelligence (Recommendations):
${JSON.stringify(recommendations)}

${knowledgeContext ? `Knowledge Context (from CoverScore Knowledge Graph):
${JSON.stringify({
  risks: knowledgeContext.riskDetails,
  recommendations: knowledgeContext.recommendations,
  impactSummary: knowledgeContext.impactSummary,
  advisorBriefing: knowledgeContext.advisorBriefing
}, null, 2)}` : ''}

Required Output (JSON ONLY):
{
  "executiveSummary": "A calm, professional summary explaining overall risk exposure and resilience.",
  "topExposures": ["Exposure 1", "Exposure 2", "Exposure 3", "Exposure 4", "Exposure 5"],
  "topFinancialThreats": ["Threat 1", "Threat 2", "Threat 3", "Threat 4", "Threat 5"],
  "topProtectionGaps": ["Gap 1", "Gap 2", "Gap 3", "Gap 4", "Gap 5"],
  "topRecommendations": [
    {
      "timeframe": "Immediate / Short-term / Long-term",
      "exposure": "Identified exposure",
      "consequence": "Consequence if unprotected",
      "protectionGap": "The current protection gap",
      "action": "Recommended action"
    }
  ],
  "professionalRecommendation": "A professional closing recommendation focusing on resilience."
}

Rules:
- Never sound like a salesperson.
- Focus on resilience.
- Explain consequences clearly.
- Prioritize actions.
- Use Nigerian Naira (₦) formatting where appropriate.
${knowledgeContext ? '- Reference specific risks from the knowledge context where relevant.' : ''}`;

  try {
    return await callMistral(systemPrompt, userPrompt, true);
  } catch (error) {
    console.error('Report Generator Error:', error);
    return getFallbackReport(assessmentData, prefix);
  }
};

// ----------------------------------------------------------------------------
// PROMPT 2: ADVISOR COPILOT™
// ----------------------------------------------------------------------------
const getAdvisorCopilot = async (assessmentData, creIntelligence) => {
  const { advisorTalkingPoints, industryData } = creIntelligence;
  const systemPrompt = getIndustryConsultantPrompt(industryData);
  const prefix = assessmentData?.answers?.template_selection?.template_id
    || (assessmentData?.answers ? Object.keys(assessmentData.answers).find(k => k.match(/^[A-Z]+_\d+$/))?.split('_')[0] : null)
    || null;
  const briefContext = prefix ? aiContext.buildAssessmentContext(prefix, assessmentData.answers || {}, {
    score: assessmentData.score,
    risk_level: assessmentData.riskLevel,
    risk_categories: assessmentData.risk_categories,
    risk_profile: assessmentData.risk_profile
  }) : null;

  const userPrompt = `You are the Advisor Copilot. Your job is to help the human advisor prepare for a consultation with this client.

Client Data:
${JSON.stringify(assessmentData, null, 2)}

Recommended Talking Points from CRE:
${JSON.stringify(advisorTalkingPoints)}

${briefContext ? `Knowledge Briefing (from CoverScore Knowledge Graph):
${JSON.stringify(briefContext.advisorBriefing, null, 2)}

Risk Breakdown:
${JSON.stringify(briefContext.domainBreakdown, null, 2)}` : ''}

Required Output (JSON ONLY):
{
  "recommended_questions": ["Question 1", "Question 2", "Question 3"],
  "potential_risks_to_highlight": ["Risk 1", "Risk 2"],
  "likely_objections": [
    { "objection": "It's too expensive", "suggested_response": "Focus on the cost of the risk event happening without cover..." }
  ],
  "next_actions": ["Action 1", "Action 2"]
}

Rules:
- Make questions open-ended and diagnostic.
- Anticipate realistic objections based on the client's profile.
- Provide actionable advice for the advisor.
${briefContext ? `- ${briefContext.criticalRisks.length} critical risks identified — prioritize these.` : ''}`;

  try {
    return await callMistral(systemPrompt, userPrompt, true);
  } catch (error) {
    console.error('Advisor Copilot Error:', error);
    return {
      recommended_questions: advisorTalkingPoints || ['Can you tell me more about your business operations?'],
      potential_risks_to_highlight: briefContext ? briefContext.criticalRisks.slice(0, 3) : ['General Liability', 'Property Risk'],
      likely_objections: [{ objection: 'Budget constraints', suggested_response: 'Prioritize critical statutory covers first.' }],
      next_actions: ['Schedule consultation call']
    };
  }
};

// ----------------------------------------------------------------------------
// PROMPT 4: PROPOSAL GENERATOR™
// ----------------------------------------------------------------------------
const generateProposal = async (lead, assessment) => {
  const systemPrompt = `You are a CoverScore AI Proposal Generator. You create tailored, professional insurance proposals. You focus on building resilience rather than just selling products.`;
  
  const userPrompt = `Create a professional insurance proposal for ${lead.name || 'the client'}.

Client Data:
${JSON.stringify(lead)}
Assessment Data:
${JSON.stringify(assessment)}

Return ONLY a valid HTML string (no markdown, no json wrappers) with this exact structure:
<div class="proposal-document">
  <h2>Executive Summary</h2>
  <p>...</p>
  
  <h2>Findings</h2>
  <p>...</p>
  
  <h2>Risks</h2>
  <ul>...</ul>
  
  <h2>Recommendations</h2>
  <ul>...</ul>
  
  <h2>Protection Plan</h2>
  <p>...</p>
</div>`;

  try {
    return await callMistral(systemPrompt, userPrompt, false);
  } catch (error) {
    console.error('Proposal Generator Error:', error);
    return `<div class="proposal-document"><h2>Executive Summary</h2><p>Proposal generation failed.</p></div>`;
  }
};

// Fallback logic in case API fails
function getFallbackReport(assessmentData, prefix) {
  if (prefix && assessmentData?.answers) {
    try {
      const localReport = aiContext.generateLocalReport(prefix, assessmentData.answers, {
        score: assessmentData.score,
        risk_level: assessmentData.riskLevel,
        risk_categories: assessmentData.risk_categories,
        risk_profile: assessmentData.risk_profile
      });
      return {
        executiveSummary: localReport.executiveSummary || localReport.riskNarrative || "Risk assessment completed.",
        topExposures: localReport.riskRegister.slice(0, 5).map(r => r.name),
        topFinancialThreats: localReport.riskRegister.filter(r => r.severity === 'Critical').slice(0, 5).map(r => r.name),
        topProtectionGaps: localReport.allRisks.filter(r => r.severity !== 'Low').map(r => r.category),
        topRecommendations: localReport.prioritizedRecommendations.slice(0, 5).map(r => ({
          timeframe: r.priority === 'Immediate' ? 'Immediate' : r.priority === 'High' ? 'Short-term' : 'Medium-term',
          exposure: r.name,
          consequence: `Unaddressed ${r.name.toLowerCase()} increases vulnerability.`,
          protectionGap: `Current ${r.effort.toLowerCase()} gap identified.`,
          action: r.steps.join('; ')
        })),
        professionalRecommendation: `${localReport.criticalRisks?.length || 0} critical risk${localReport.criticalRisks?.length !== 1 ? 's' : ''} identified. ${localReport.recommendations?.length || 0} prioritized actions available. Schedule an advisor consultation.`
      };
    } catch (e) {
      // fall through to default fallback
    }
  }
  return {
    executiveSummary: "This is an automated fallback report due to AI generation timeout. Your risk profile requires attention.",
    topExposures: ["General Liability", "Property Damage", "Financial Loss", "Business Interruption", "Cyber Liability"],
    topFinancialThreats: ["Out of pocket expenses", "Business interruption", "Loss of income", "Medical emergencies", "Legal liability"],
    topProtectionGaps: ["Uninsured assets", "Lack of income protection", "No critical illness cover", "Inadequate liability cover", "No business continuity plan"],
    topRecommendations: [
      { timeframe: "Immediate", exposure: "Property", consequence: "Total loss", protectionGap: "No cover", action: "Obtain basic protection" },
      { timeframe: "Immediate", exposure: "Health", consequence: "Out of pocket medical costs", protectionGap: "Limited health cover", action: "Review health insurance options" },
      { timeframe: "Short-term", exposure: "Income", consequence: "Loss of earnings", protectionGap: "No income protection", action: "Set up income protection" },
      { timeframe: "Short-term", exposure: "Liability", consequence: "Legal claims", protectionGap: "Inadequate liability cover", action: "Review liability insurance" },
      { timeframe: "Long-term", exposure: "Business continuity", consequence: "Extended downtime", protectionGap: "No continuity plan", action: "Develop business continuity plan" }
    ],
    professionalRecommendation: "Please speak with an advisor for a comprehensive review."
  };
}

// ----------------------------------------------------------------------------
// PROMPT 3: WHATSAPP ADVISOR™
// ----------------------------------------------------------------------------
const getWhatsappAdvisor = async (conversationContext, currentState, userMessage) => {
  const systemPrompt = `You are the CoverScore WhatsApp Advisor, an AI representing a professional Insurance Risk Intelligence Platform. 
Your goal is to drive qualification conversations with leads who have just completed their business or personal insurance risk assessment.
You help them understand their exposures (Property, Liability, Cyber, Employee Risk, etc.) and guide them to schedule a free review with a human insurance advisor.
Rules:
- You NEVER score music or "cover songs". "Cover" refers to insurance coverage.
- Conversational, Professional, Educational
- Never pushy or salesy
- Provide short, engaging responses suitable for WhatsApp.`;

  const userPrompt = `Context: ${JSON.stringify(conversationContext)}
Current State: ${currentState}
User Message: "${userMessage}"

Generate the next response to guide the user towards qualification or an appointment.`;

  try {
    return await callMistral(systemPrompt, userPrompt, false);
  } catch (error) {
    console.error('WhatsApp Advisor Error:', error);
    return "I'm sorry, I'm having trouble connecting right now. Let's continue this shortly.";
  }
};

// ----------------------------------------------------------------------------
// PROMPT 6: LEAD QUALIFIER™
// ----------------------------------------------------------------------------
const getLeadQualifier = async (whatsappConversations, assessmentData) => {
  const systemPrompt = `You are the CoverScore Lead Qualifier. Your goal is to provide CRM intelligence based on user interactions.`;
  
  const userPrompt = `Evaluate this lead based on the following data:

Assessment Data:
${JSON.stringify(assessmentData, null, 2)}

WhatsApp Conversations:
${JSON.stringify(whatsappConversations, null, 2)}

Required Output (JSON ONLY):
{
  "lead_status": "Hot Lead / Warm Lead / Cold Lead",
  "next_best_action": "Specific action the advisor should take next",
  "qualification_reasoning": "Brief explanation of why this status was assigned"
}`;

  try {
    return await callMistral(systemPrompt, userPrompt, true);
  } catch (error) {
    console.error('Lead Qualifier Error:', error);
    return {
      lead_status: "Warm Lead",
      next_best_action: "Review assessment and reach out.",
      qualification_reasoning: "Fallback qualification due to AI error."
    };
  }
};

// ----------------------------------------------------------------------------
// INTERACTIVE ADVISOR COPILOT CHAT
// ----------------------------------------------------------------------------
const handleAdvisorCopilotChat = async (leadContext, message) => {
  const systemPrompt = `You are the CoverScore Risk Advisory Operating System (Copilot). 
Your user is a human insurance advisor. Your goal is to guide them through the entire client journey and act as a "Super Advisor".

You have access to the following lead context:
${JSON.stringify(leadContext, null, 2)}

Provide actionable, insightful, and highly professional advice. 
If asked to generate a proposal, draft it directly. 
If asked to draft a WhatsApp follow-up, provide the exact message text.
If asked about risks, analyze the assessment data and highlight the most critical exposures.
Format your responses using clean Markdown. Be concise but extremely valuable.`;

  try {
    return await callMistral(systemPrompt, message, false);
  } catch (error) {
    console.error('Copilot Chat Error:', error);
    return "I'm sorry, I'm having trouble connecting to the AI brain right now. Please try again.";
  }
};

module.exports = {
  generateRiskReport,
  getAdvisorCopilot,
  generateProposal,
  getWhatsappAdvisor,
  getLeadQualifier,
  handleAdvisorCopilotChat
};
