module.exports = (vars) => `You are preparing a brief for an insurance advisor about to speak with a client.

Client: ${vars.clientName || 'Client'}
Business: ${vars.businessName || 'their business'}
Industry: ${vars.industry || 'general business'}
CoverScore: ${vars.score || 'N/A'}/100
Risk level: ${vars.riskLevel || 'moderate'}
Key risk areas: ${(vars.weakestPillars || []).join(', ')}
Recommended products: ${(vars.recommendedProducts || []).join(', ')}
Assessment URL: ${vars.assessmentUrl || 'N/A'}

Generate a structured advisor brief with the following sections:

Client Summary (1 sentence):
Key Risks (bullet list):
Conversation Goal (1 sentence):
Suggested Opening (1-2 sentences the advisor can say verbatim):
Likely Objections (3 bullet points, each followed by a suggested response):`;
