require('dotenv').config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-large-latest';

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
  if (!industryData) {
    return `You are CoverScore AI, a professional Risk Consultant. Your goal is to help individuals and businesses become more resilient by identifying risks, explaining consequences, and prioritizing actions.`;
  }
  return `You are CoverScore AI, an expert ${industryData.industry} Risk Consultant. 
Your goal is to help businesses in the ${industryData.industry} sector become more resilient.
You understand that their top risks typically include: ${industryData.top_risks.join(', ')}.
You never sound like a salesperson. You focus strictly on resilience, explaining consequences, and prioritizing actions.`;
}

// ----------------------------------------------------------------------------
// PROMPT 1: REPORT GENERATOR AI™
// ----------------------------------------------------------------------------
const generateRiskReport = async (assessmentData, creIntelligence) => {
  const { topRisks, recommendations, industryData } = creIntelligence;
  
  const systemPrompt = getIndustryConsultantPrompt(industryData);
  
  const userPrompt = `Generate a P.R.O.T.E.C.T™ Report for the following assessment data.

Assessment Context:
${JSON.stringify(assessmentData, null, 2)}

CRE Intelligence (Top Risks):
${JSON.stringify(topRisks)}

CRE Intelligence (Recommendations):
${JSON.stringify(recommendations)}

Required Output (JSON ONLY):
{
  "executiveSummary": "A calm, professional summary explaining overall risk exposure and resilience.",
  "topExposures": ["Exposure 1", "Exposure 2", "Exposure 3"],
  "topFinancialThreats": ["Threat 1", "Threat 2", "Threat 3"],
  "topProtectionGaps": ["Gap 1", "Gap 2", "Gap 3"],
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
- Use Nigerian Naira (₦) formatting where appropriate.`;

  try {
    return await callMistral(systemPrompt, userPrompt, true);
  } catch (error) {
    console.error('Report Generator Error:', error);
    // Fallback if API fails
    return getFallbackReport(assessmentData);
  }
};

// ----------------------------------------------------------------------------
// PROMPT 2: ADVISOR COPILOT™
// ----------------------------------------------------------------------------
const getAdvisorCopilot = async (assessmentData, creIntelligence) => {
  const { advisorTalkingPoints, industryData } = creIntelligence;
  const systemPrompt = getIndustryConsultantPrompt(industryData);

  const userPrompt = `You are the Advisor Copilot. Your job is to help the human advisor prepare for a consultation with this client.

Client Data:
${JSON.stringify(assessmentData, null, 2)}

Recommended Talking Points from CRE:
${JSON.stringify(advisorTalkingPoints)}

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
- Provide actionable advice for the advisor.`;

  try {
    return await callMistral(systemPrompt, userPrompt, true);
  } catch (error) {
    console.error('Advisor Copilot Error:', error);
    return {
      recommended_questions: advisorTalkingPoints || ['Can you tell me more about your business operations?'],
      potential_risks_to_highlight: ['General Liability', 'Property Risk'],
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
function getFallbackReport(assessmentData) {
  return {
    executiveSummary: "This is an automated fallback report due to AI generation timeout. Your risk profile requires attention.",
    topExposures: ["General Liability", "Property Damage", "Financial Loss"],
    topFinancialThreats: ["Out of pocket expenses", "Business interruption"],
    topProtectionGaps: ["Uninsured assets", "Lack of income protection"],
    topRecommendations: [
      { timeframe: "Immediate", exposure: "Property", consequence: "Total loss", protectionGap: "No cover", action: "Obtain basic protection" }
    ],
    professionalRecommendation: "Please speak with an advisor for a comprehensive review."
  };
}

// ----------------------------------------------------------------------------
// PROMPT 3: WHATSAPP ADVISOR™
// ----------------------------------------------------------------------------
const getWhatsappAdvisor = async (conversationContext, currentState, userMessage) => {
  const systemPrompt = `You are the CoverScore WhatsApp Advisor. Your goal is to drive qualification conversations.
Rules:
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
