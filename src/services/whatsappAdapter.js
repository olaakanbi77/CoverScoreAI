/**
 * WhatsApp Adapter
 * 
 * Translates between WhatsApp messages and the Conversation Orchestrator.
 * Handles WhatsApp-specific formatting, button rendering, and message delivery.
 * 
 * Architecture:
 *   WhatsApp Webhook → WhatsAppAdapter → ConversationOrchestrator → UnifiedAssessmentEngine
 */

const orchestrator = require('./conversationOrchestrator');

// ─── IN-MEMORY SESSION TRACKING ───

const whatsappSessions = new Map(); // phone -> assessmentId

// ─── FORMAT FOR WHATSAPP ───

function formatForWhatsApp(question, state) {
  if (!question || question.terminal) {
    return question?.message || 'Assessment complete.';
  }

  let msg = question.message + '\n\n';

  if (question.options) {
    question.options.forEach(opt => {
      msg += `*${opt.key}.* ${opt.label}\n`;
    });
    msg += '\n_Reply with the letter._';
  } else if (question.multiSelect) {
    question.multiSelect.forEach(opt => {
      msg += `• ${opt.label}\n`;
    });
    msg += '\n_Reply with items separated by commas (e.g. A, B, C)._';
  } else {
    msg += '_Please type your response._';
  }

  return msg;
}

// ─── PROCESS INCOMING WHATSAPP MESSAGE ───

async function processWhatsAppMessage(phoneNumber, messageBody, leadId = null) {
  const phone = phoneNumber.replace(/[^0-9]/g, '');
  const text = (messageBody || '').trim();

  // Check for special commands
  if (text.toUpperCase() === 'STOP' || text.toUpperCase() === 'QUIT') {
    return { replyText: 'Assessment paused. Send START to resume.', isComplete: false, paused: true };
  }

  // Find or create session
  let assessmentId = whatsappSessions.get(phone);
  let state = null;

  if (assessmentId) {
    state = await orchestrator.loadSession(assessmentId);
  }

  // Cross-channel resume: find by lead
  if (!state && leadId) {
    state = await orchestrator.findSessionByLead(leadId);
    if (state) {
      assessmentId = state.assessmentId;
      whatsappSessions.set(phone, assessmentId);
      orchestrator.switchChannel(state, 'WHATSAPP');
    }
  }

  // New session
  if (!state) {
    state = orchestrator.createSession('WHATSAPP', leadId);
    assessmentId = state.assessmentId;
    whatsappSessions.set(phone, assessmentId);
  }

  // Handle START command (resume)
  if (text.toUpperCase() === 'START' && state.status === 'paused') {
    state.status = 'in_progress';
  }

  // Process the response through the orchestrator
  // For first interaction (welcome), just get the current question
  if (state.interactionCount === 0 && text.toUpperCase() !== 'START') {
    const question = orchestrator.getNextBestQuestion(state);
    const replyText = formatForWhatsApp(question, state);
    // Increment counter so the next message goes through processResponse
    state.interactionCount = 1;
    orchestrator.persistState(state);
    return {
      replyText,
      nextState: question.nodeId,
      isComplete: false,
      assessmentId,
      updatedData: buildUpdatedData(state),
    };
  }

  // Process response
  const result = orchestrator.processResponse(state, text);

  // Get next question
  const nextQuestion = result.nextQuestion;
  const replyText = formatForWhatsApp(nextQuestion, result.state);

  return {
    replyText,
    nextState: nextQuestion.nodeId,
    isComplete: result.isComplete,
    assessmentId,
    evidence: result.evidence,
    contradictions: result.contradictions,
    updatedData: buildUpdatedData(result.state),
  };
}

// ─── BUILD UPDATED DATA (for webhook.js integration) ───

function buildUpdatedData(state) {
  return {
    hotelAssessment: true,
    hotelAnswers: state.answers,
    hotelContext: state.context,
    hotelRiskObjects: state.riskObjectsActivated,
    hotelInteractionCount: state.interactionCount,
    hotelAssessmentComplete: state.status === 'completed',
    hotelEvidence: state.evidence,
    hotelContradictions: state.contradictions,
    hotelUncertainties: state.uncertainties,
    hotelCompletionMetrics: state.completionMetrics,
  };
}

// ─── GET SESSION BY PHONE ───

function getSessionByPhone(phone) {
  const phoneClean = phone.replace(/[^0-9]/g, '');
  const assessmentId = whatsappSessions.get(phoneClean);
  return assessmentId ? { assessmentId, phone: phoneClean } : null;
}

// ─── GET ASSESSMENT SUMMARY ───

async function getAssessmentSummary(assessmentId) {
  const state = await orchestrator.loadSession(assessmentId);
  if (!state) return null;
  return orchestrator.getAssessmentSummary(state);
}

// ─── INITIATE CROSS-CHANNEL SWITCH ───

async function offerVoiceSwitch(assessmentId) {
  const state = await orchestrator.loadSession(assessmentId);
  if (!state) return null;

  const handoffMessage = orchestrator.generateHandoffMessage(state);
  return {
    assessmentId,
    handoffMessage,
    voiceContext: orchestrator.getVoiceContext(state),
  };
}

module.exports = {
  processWhatsAppMessage,
  getSessionByPhone,
  getAssessmentSummary,
  offerVoiceSwitch,
  formatForWhatsApp,
  whatsappSessions,
};
