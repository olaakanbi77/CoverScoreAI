const prompts = {
  RISK_STORY: require('./riskStoryPrompt'),
  INSIGHT: require('./insightPrompt'),
  COPILOT_BRIEF: require('./copilotBriefPrompt'),
  QUOTE_EXPLANATION: require('./quoteExplanationPrompt'),
  PROPOSAL: require('./proposalPrompt'),
  RENEWAL: require('./renewalPrompt'),
  CROSS_SELL: require('./crossSellPrompt'),
  OBJECTION_HANDLING: require('./objectionHandlingPrompt'),
  FOLLOW_UP: require('./followUpPrompt'),
  STRENGTHS: require('./strengthsPrompt')
};

function renderPrompt(code, variables = {}) {
  const promptFn = prompts[code];
  if (!promptFn) throw new Error(`Unknown prompt code: ${code}`);
  return promptFn(variables);
}

module.exports = { prompts, renderPrompt };
