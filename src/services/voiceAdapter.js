/**
 * Voice Adapter
 * 
 * Translates between LiveKit voice agent and the Conversation Orchestrator.
 * Provides the voice agent with assessment state, questions, and context.
 * 
 * Architecture:
 *   LiveKit Voice Agent → VoiceAdapter → ConversationOrchestrator → UnifiedAssessmentEngine
 * 
 * The voice agent calls these functions to:
 * 1. Get the current question (in natural language)
 * 2. Process spoken responses
 * 3. Resume from cross-channel handoff
 * 4. Get completion status
 */

const orchestrator = require('./conversationOrchestrator');

// ─── VOICE SESSION TRACKING ───

const voiceSessions = new Map(); // livekitRoom -> assessmentId

// ─── VOICE CONVERSATION MODES ───

const CONVERSATION_MODES = {
  DISCOVER: 'DISCOVER',   // Broad question
  DEEPEN: 'DEEPEN',       // Follow up on weak evidence
  CLARIFY: 'CLARIFY',     // Ambiguous answer
  CONFIRM: 'CONFIRM',     // Material/contradictory info
  MOVE_ON: 'MOVE_ON',     // Transition to new topic
};

// ─── START VOICE ASSESSMENT ───

function startVoiceAssessment(leadId = null, assessmentId = null) {
  let state;

  if (assessmentId) {
    // Resume existing session
    state = orchestrator.loadSession(assessmentId);
    if (state) {
      orchestrator.switchChannel(state, 'VOICE');
      return {
        state,
        context: orchestrator.getVoiceContext(state),
        isResume: true,
        greeting: generateResumeGreeting(state),
      };
    }
  }

  // Find existing session by lead
  if (leadId) {
    state = orchestrator.findSessionByLead(leadId);
    if (state) {
      orchestrator.switchChannel(state, 'VOICE');
      voiceSessions.set(`voice-${Date.now()}`, state.assessmentId);
      return {
        state,
        context: orchestrator.getVoiceContext(state),
        isResume: true,
        greeting: generateResumeGreeting(state),
      };
    }
  }

  // New assessment
  state = orchestrator.createSession('VOICE', leadId);
  const roomName = `cs-voice-${Date.now()}`;
  voiceSessions.set(roomName, state.assessmentId);

  return {
    state,
    context: orchestrator.getVoiceContext(state),
    isResume: false,
    greeting: generateNewGreeting(),
  };
}

// ─── PROCESS VOICE RESPONSE ───

function processVoiceResponse(state, transcript, confidence = 0.9) {
  // The voice agent passes the raw transcript
  // The orchestrator handles normalization
  const result = orchestrator.processResponse(state, transcript);

  return {
    state: result.state,
    nextQuestion: result.nextQuestion,
    isComplete: result.isComplete,
    evidence: result.evidence,
    contradictions: result.contradictions,
    completionMetrics: result.completionMetrics,
    // Voice-specific: suggest conversation mode
    suggestedMode: suggestConversationMode(result),
  };
}

// ─── SUGGEST CONVERSATION MODE ───

function suggestConversationMode(result) {
  const { state, nextQuestion, contradictions, uncertainties } = result;

  // Check for contradictions
  if (contradictions.length > 0) {
    return CONVERSATION_MODES.CONFIRM;
  }

  // Check for recent uncertainties
  const recentUncertainties = uncertainties.filter(u => {
    const diff = Date.now() - new Date(u.timestamp).getTime();
    return diff < 60000; // last minute
  });
  if (recentUncertainties.length > 0) {
    return CONVERSATION_MODES.CLARIFY;
  }

  // Check if evidence is thin for current area
  const currentEvidence = state.evidence[state.currentNode];
  if (currentEvidence && currentEvidence.confidence < 0.6) {
    return CONVERSATION_MODES.DEEPEN;
  }

  // Check if we're transitioning stages
  const prevStage = state.stage;
  if (prevStage !== nextQuestion.stage) {
    return CONVERSATION_MODES.MOVE_ON;
  }

  return CONVERSATION_MODES.DISCOVER;
}

// ─── GENERATE GREETINGS ───

function generateNewGreeting() {
  return 'Welcome to CoverScore. I\'m your AI risk assessment advisor. '
    + 'I\'ll guide you through a quick assessment of your hotel\'s risk profile. '
    + 'It takes about 3 to 5 minutes. '
    + 'Let\'s start with your hotel\'s name.';
}

function generateResumeGreeting(state) {
  const ctx = orchestrator.getVoiceContext(state);
  let greeting = `Welcome back, ${ctx.respondentName || 'there'}. `;

  if (ctx.hotelName) {
    greeting += `We were discussing your hotel "${ctx.hotelName}". `;
  }

  // Summarize recent progress
  const answeredCount = ctx.answeredQuestions.length;
  greeting += `We've covered ${answeredCount} areas so far. `;

  // Mention active branches
  if (ctx.activeBranches.length > 0) {
    greeting += `We were looking at ${ctx.activeBranches[0]}. `;
  }

  greeting += `Let's continue where we left off.`;
  return greeting;
}

// ─── GET VOICE AGENT INSTRUCTIONS ───

function getVoiceInstructions(state) {
  const ctx = orchestrator.getVoiceContext(state);
  const branches = ctx.activeBranches;
  const completion = ctx.completionMetrics;

  // Build dynamic instructions based on state
  let instructions = `You are CoverScore AI, conducting a hotel risk assessment via voice.\n\n`;

  instructions += `CURRENT STATE:\n`;
  instructions += `Hotel: ${ctx.hotelName || 'Unknown'}\n`;
  instructions += `Respondent: ${ctx.respondentName || 'Unknown'} (${ctx.respondentRole || 'Unknown'})\n`;
  instructions += `Location: ${ctx.hotelLocation || 'Unknown'}\n`;
  instructions += `Type: ${ctx.hotelType || 'Unknown'} | Rooms: ${ctx.roomCount || 'Unknown'}\n`;
  instructions += `Stage: ${ctx.stage}\n`;
  instructions += `Current Node: ${ctx.currentNode}\n`;
  instructions += `Answered: ${ctx.answeredQuestions.length} questions\n\n`;

  if (branches.length > 0) {
    instructions += `ACTIVE RISK BRANCHES: ${branches.join(', ')}\n\n`;
  }

  // Completion status
  const completed = Object.entries(completion).filter(([, v]) => v).length;
  instructions += `COMPLETION: ${completed}/8 areas complete\n\n`;

  instructions += `CONVERSATION APPROACH:\n`;
  instructions += `- Speak naturally, one question at a time\n`;
  instructions += `- Acknowledge their response before moving on\n`;
  instructions += `- For uncertain answers, probe gently for more detail\n`;
  instructions += `- If you detect contradictions, confirm before proceeding\n`;
  instructions += `- Keep responses concise (1-3 sentences)\n`;

  return instructions;
}

// ─── ROOM-TO-ASSESSMENT MAPPING ───

function getAssessmentByRoom(roomName) {
  const assessmentId = voiceSessions.get(roomName);
  return assessmentId || null;
}

function setRoomAssessment(roomName, assessmentId) {
  voiceSessions.set(roomName, assessmentId);
}

module.exports = {
  startVoiceAssessment,
  processVoiceResponse,
  getVoiceInstructions,
  getAssessmentByRoom,
  setRoomAssessment,
  CONVERSATION_MODES,
  voiceSessions,
};
