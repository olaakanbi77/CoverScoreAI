const { getNextStateAndReply, getInitialWelcome } = require('./whatsappFlow');
const { CCIE_EVENTS, publishEvent } = require('./ccieEvents');
const questionBank = require('../data/question_bank.json');

const CCIE_PHASES = {
  WELCOME: { label: 'Welcome', minQuestion: 1, maxQuestion: 2 },
  CONSENT: { label: 'Consent', minQuestion: 3, maxQuestion: 3 },
  PROFILE: { label: 'Profile', minQuestion: 4, maxQuestion: 6 },
  DISCOVERY: { label: 'Discovery', minQuestion: 7, maxQuestion: 30 },
  ANALYSIS: { label: 'Analysis' },
  RESULTS: { label: 'Results', minQuestion: 31, maxQuestion: 31 },
  NEXT_BEST_ACTION: { label: 'Next Best Action' },
  COMPLETED: { label: 'Completed' }
};

const PHASE_ORDER = ['WELCOME', 'CONSENT', 'PROFILE', 'DISCOVERY', 'ANALYSIS', 'RESULTS', 'NEXT_BEST_ACTION', 'COMPLETED'];

const determinePhase = (questionId) => {
  if (!questionId) return 'WELCOME';
  if (questionId === 'finished' || questionId === 'COMPLETE') return 'COMPLETED';
  if (questionId === 'awaiting_consultation') return 'NEXT_BEST_ACTION';
  const match = questionId.match(/_(\d+)$/);
  if (!match) return 'WELCOME';
  const num = parseInt(match[1], 10);
  if (num <= 2) return 'WELCOME';
  if (num === 3) return 'CONSENT';
  if (num <= 6) return 'PROFILE';
  if (num <= 50) return 'DISCOVERY';
  if (num >= 51) return 'RESULTS';
  return 'DISCOVERY';
};

const buildContext = (opts = {}) => {
  return {
    conversationId: opts.conversationId || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    channel: opts.channel || 'whatsapp',
    questionPack: opts.questionPack || null,
    campaign: opts.campaign || null,
    customer: opts.customer || { phone: null, name: null, email: null },
    answers: opts.answers || {},
    currentPhase: opts.currentPhase || 'NEW',
    currentQuestion: opts.currentQuestion || null,
    branch: opts.branch || null,
    score: opts.score || null,
    questionCount: opts.questionCount || 0,
    isComplete: opts.isComplete || false,
    metadata: opts.metadata || {}
  };
};

const getMilestoneMessage = () => null;

const formatMessage = (text, type) => {
  if (!text) return text;
  const clean = text.replace(/\*\* \*{2,}/g, '').replace(/\*{2,}/g, '').trim();
  return clean;
};

const buildWelcomeIntro = (prefix) => {
  const intros = {
    HLT: 'I\'ll help you understand how prepared you are for health-related risks.',
    INC: 'I\'ll help you evaluate how resilient your income is against unexpected events.',
    FAM: 'I\'ll help you assess how well your family is financially protected.',
    RET: 'I\'ll help you evaluate your retirement readiness and identify gaps.',
    YPR: 'I\'ll help you build a strong financial foundation for your future.',
    ENT: 'I\'ll help you identify risks in your business and personal finances.',
    HOM: 'I\'ll help you assess how well your home and belongings are protected.',
    MOT: 'I\'ll help you evaluate your motor insurance coverage.',
    SCH: 'I\'ll help you assess your school\'s risk protection.',
    MFG: 'I\'ll help you evaluate your manufacturing operation\'s resilience.',
    HOS: 'I\'ll help you assess your healthcare facility\'s risk protection.',
    CHR: 'I\'ll help you evaluate your church\'s protection needs.',
    CON: 'I\'ll help you assess your construction business\'s risk exposure.',
    TRN: 'I\'ll help you evaluate your transport operation\'s resilience.',
    HOT: 'I\'ll help you discover how resilient your hotel really is — from guest safety and fire protection to property, staff, business continuity and operational risks.',
    SME: 'I\'ll help you assess your business\'s protection gaps.'
  };
  return intros[prefix] || intros.SME;
};

class CCIEEngine {
  async processReply(context, incomingText) {
    const { questionPack, currentQuestion, questionCount, answers } = context;
    const currentPhase = determinePhase(currentQuestion);

    const result = await getNextStateAndReply(currentQuestion, incomingText, answers, questionPack);
    const { nextState, replyText, updatedData, isComplete } = result;

    let messages = [];

    // Check if next question is auto_advance
    const nextQ = nextState ? questionBank.find(q => q.id === nextState) : null;
    if (nextQ && nextQ.auto_advance) {
      // Auto-advance: show question text and advance immediately (skip duplicate reply)
      messages.push({ type: 'auto_advance', text: formatMessage(nextQ.question) });
      const autoResult = await getNextStateAndReply(nextState, 'AUTO_ADVANCE', updatedData.answers || {}, questionPack);
      if (autoResult.replyText) {
        messages.push({ type: 'reply', text: formatMessage(autoResult.replyText) });
      }
      const autoPhase = determinePhase(autoResult.nextState);
      publishEvent(CCIE_EVENTS.PHASE_CHANGED, context, {
        questionId: nextState, nextQuestionId: autoResult.nextState,
        phase: autoPhase, questionCount: questionCount + 2, isComplete: autoResult.isComplete
      });
      context.currentPhase = autoPhase;
      context.currentQuestion = autoResult.nextState;
      context.questionCount = questionCount + 2;
      context.answers = autoResult.updatedData.answers || context.answers;
      context.isComplete = autoResult.isComplete || autoResult.nextState === 'finished' || autoResult.nextState === 'COMPLETE';
      return { messages, nextState: autoResult.nextState, updatedData: autoResult.updatedData, isComplete: context.isComplete, context };
    }

    if (replyText) {
      messages.push({ type: 'reply', text: formatMessage(replyText) });
    }

    const nextPhase = determinePhase(nextState);
    const newQuestionCount = questionCount + 1;

    const event = nextPhase !== currentPhase ? {
      event: CCIE_EVENTS.PHASE_CHANGED,
      from: currentPhase,
      to: nextPhase
    } : {
      event: CCIE_EVENTS.QUESTION_ANSWERED
    };
    publishEvent(event.event, context, {
      questionId: currentQuestion,
      nextQuestionId: nextState,
      phase: nextPhase,
      questionCount: newQuestionCount,
      isComplete,
      ...event
    });

    context.currentPhase = nextPhase;
    context.currentQuestion = nextState;
    context.questionCount = newQuestionCount;
    context.answers = updatedData.answers || context.answers;
    context.isComplete = isComplete || nextState === 'finished' || nextState === 'COMPLETE';

    return { messages, nextState, updatedData, isComplete: context.isComplete, context };
  }

  async startConversation(prefix, phoneNumber, campaign) {
    const context = buildContext({
      questionPack: prefix,
      channel: 'whatsapp',
      campaign: campaign || null,
      customer: { phone: phoneNumber, name: null, email: null },
      currentPhase: 'WELCOME',
      currentQuestion: `${prefix}_001`,
      questionCount: 0
    });

    const welcomeText = await getInitialWelcome(prefix);
    const intro = buildWelcomeIntro(prefix);

    publishEvent(CCIE_EVENTS.CONVERSATION_STARTED, context, { prefix, phoneNumber });

    return {
      context,
      messages: [
        { type: 'welcome', text: formatMessage(welcomeText || `👋 Welcome to CoverScore AI.\n\n${intro}\n\nLet's begin.`) }
      ]
    };
  }

  getRecoveryMessage(attempt) {
    const messages = [
      "Hi, you're halfway through your assessment. Your progress has been saved if you'd like to continue.",
      "You're only a few minutes away from receiving your personalized CoverScore Report™."
    ];
    return attempt <= 2 ? messages[attempt - 1] : null;
  }

  getErrorRecovery() {
    return { type: 'error', text: "Sorry, I didn't quite understand that.\n\nPlease choose one of the options below." };
  }

  determinePhase(questionId) {
    return determinePhase(questionId);
  }

  buildContext(opts) {
    return buildContext(opts);
  }
}

module.exports = new CCIEEngine();
