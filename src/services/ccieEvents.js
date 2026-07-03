const CCIE_EVENTS = {
  CONVERSATION_STARTED: 'ConversationStarted',
  CONSENT_GIVEN: 'ConsentGiven',
  LEAD_CAPTURED: 'LeadCaptured',
  QUESTION_ANSWERED: 'QuestionAnswered',
  BRANCH_ACTIVATED: 'BranchActivated',
  MICRO_INSIGHT_DISPLAYED: 'MicroInsightDisplayed',
  PHASE_CHANGED: 'PhaseChanged',
  ASSESSMENT_COMPLETED: 'AssessmentCompleted',
  SCORE_CALCULATED: 'ScoreCalculated',
  REPORT_GENERATED: 'ReportGenerated',
  REPORT_DELIVERED: 'ReportDelivered',
  ADVISOR_REQUESTED: 'AdvisorRequested',
  CONVERSATION_COMPLETED: 'ConversationCompleted',
  ERROR_RECOVERED: 'ErrorRecovered'
};

const publishEvent = (eventType, context, extra = {}) => {
  const event = {
    event: eventType,
    timestamp: new Date().toISOString(),
    conversationId: context.conversationId,
    channel: context.channel,
    phase: context.currentPhase,
    questionPack: context.questionPack,
    customer: context.customer,
    ...extra
  };
  console.log(`[CCIE EVENT] ${eventType} | conv=${context.conversationId} | phase=${context.currentPhase}`);
  if (process.env.NODE_RED_WEBHOOK) {
    fetch(process.env.NODE_RED_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(() => {});
  }
  return event;
};

module.exports = { CCIE_EVENTS, publishEvent };
