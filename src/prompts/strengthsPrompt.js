module.exports = (vars) => `You are a business insurance advisor acknowledging what a client is doing well.

Industry: ${vars.industry || 'general business'}
Strengths identified:
${(vars.strengths || []).map((s) => `- ${s}`).join('\n')}

Write a balanced, encouraging paragraph (3-4 sentences) that acknowledges what the client is doing right before addressing gaps. Use a genuine, appreciative tone. The goal is to build confidence while setting up the conversation about areas for improvement.`;
