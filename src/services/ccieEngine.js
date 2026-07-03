const { getNextStateAndReply, getInitialWelcome } = require('./whatsappFlow');
const { CCIE_EVENTS, publishEvent } = require('./ccieEvents');
const questionBank = require('../data/question_bank.json');

const CCIE_PHASES = {
  WELCOME: { label: 'Welcome', minQuestion: 1, maxQuestion: 2 },
  CONSENT: { label: 'Consent', minQuestion: 3, maxQuestion: 3 },
  PROFILE: { label: 'Profile', minQuestion: 4, maxQuestion: 6 },
  DISCOVERY: { label: 'Discovery', minQuestion: 7, maxQuestion: 16 },
  ANALYSIS: { label: 'Analysis' },
  REPORT_READY: { label: 'Report Ready', minQuestion: 17, maxQuestion: 18 },
  RESULTS: { label: 'Results', minQuestion: 19, maxQuestion: 19 },
  NEXT_BEST_ACTION: { label: 'Next Best Action' },
  COMPLETED: { label: 'Completed' }
};

const PHASE_ORDER = ['WELCOME', 'CONSENT', 'PROFILE', 'DISCOVERY', 'ANALYSIS', 'REPORT_READY', 'RESULTS', 'NEXT_BEST_ACTION', 'COMPLETED'];

const MICRO_INSIGHTS = {
  HLT: [
    'Understanding your health protection profile helps us identify the right coverage gaps.',
    'Good progress. Your healthcare access patterns are becoming clearer.',
    'You\'re building a clear picture of your health protection readiness.',
    'These answers help us match you with the right health coverage options.'
  ],
  INC: [
    'Your income security profile is taking shape.',
    'Understanding your financial buffers helps us assess your true resilience.',
    'You\'re building a clear picture of your income protection needs.'
  ],
  FAM: [
    'Your family protection priorities are becoming clear.',
    'Understanding your family structure helps us find the right coverage gaps.',
    'You\'re building a strong picture of your family\'s financial resilience.'
  ],
  RET: [
    'Your retirement readiness profile is becoming clearer.',
    'The earlier you identify gaps, the more time you have to address them.',
    'Good progress. Your retirement planning picture is coming together.'
  ],
  YPR: [
    'Building financial resilience early creates a strong foundation.',
    'Your young professional risk profile is taking shape.',
    'These insights help you build protection before you need it.'
  ],
  ENT: [
    'Your business continuity picture is becoming clearer.',
    'Understanding key person dependencies is critical for business resilience.',
    'Your entrepreneur risk profile is taking shape.'
  ],
  DEFAULT: [
    'Your risk profile is becoming clearer with each answer.',
    'Good progress. We\'re building your personalized risk picture.',
    'Each answer helps us provide more accurate recommendations.',
    'Your protection gaps are becoming clearer.'
  ]
};

const TRUST_MESSAGES = {
  CONSENT: 'Your information will remain private and will never be shared without your consent.',
  PROFILE: 'Your details are encrypted and used only to personalize your report.',
  DISCOVERY_START: 'There are no right or wrong answers — just answer honestly.',
  DISCOVERY_MID: 'You can skip any question you\'re uncomfortable answering.',
  ANALYSIS: 'This assessment does not affect insurance eligibility or premiums.',
  RESULTS: 'Your report is completely confidential and for your eyes only.'
};

const PROGRESS_MILESTONES = {
  PROFILE_COMPLETE: 'Great. We\'ve recorded your details.',
  DISCOVERY_START: 'Let\'s now look at your specific risk areas.',
  DISCOVERY_HALF: 'Excellent. Your risk picture is becoming clearer.',
  DISCOVERY_NEAR_END: 'Just one final area before I prepare your report.',
  ANALYSIS_START: 'Give me about 10 seconds while I prepare your personalized Risk Intelligence Report™.'
};

const determinePhase = (questionId) => {
  if (!questionId) return 'WELCOME';
  if (questionId === 'finished' || questionId === 'COMPLETE') return 'COMPLETED';
  if (questionId === 'awaiting_consultation' || questionId === 'awaiting_consultation_day') return 'NEXT_BEST_ACTION';
  const match = questionId.match(/_(\d+)$/);
  if (!match) return 'WELCOME';
  const num = parseInt(match[1], 10);
  if (num <= 2) return 'WELCOME';
  if (num === 3) return 'CONSENT';
  if (num <= 6) return 'PROFILE';
  if (num <= 16) return 'DISCOVERY';
  if (num === 17) return 'ANALYSIS';
  if (num === 18) return 'REPORT_READY';
  if (num >= 19) return 'RESULTS';
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

const getMicroInsight = (prefix, questionCount) => {
  if (questionCount === 0 || questionCount % 4 !== 0) return null;
  const insights = MICRO_INSIGHTS[prefix] || MICRO_INSIGHTS.DEFAULT;
  const idx = Math.floor((questionCount / 4) - 1) % insights.length;
  return insights[idx];
};

const getTrustMessage = (phase, questionNum) => {
  if (phase === 'CONSENT') return TRUST_MESSAGES.CONSENT;
  if (phase === 'PROFILE' && questionNum === 4) return TRUST_MESSAGES.PROFILE;
  if (phase === 'DISCOVERY' && questionNum === 8) return TRUST_MESSAGES.DISCOVERY_START;
  if (phase === 'DISCOVERY' && questionNum === 12) return TRUST_MESSAGES.DISCOVERY_MID;
  if (phase === 'ANALYSIS') return TRUST_MESSAGES.ANALYSIS;
  return null;
};

const getProgressMessage = (phase, prevPhase) => {
  if (prevPhase === 'PROFILE' && phase === 'DISCOVERY') return PROGRESS_MILESTONES.DISCOVERY_START;
  if (phase === 'DISCOVERY') return null;
  return null;
};

const getMilestoneMessage = (questionId) => {
  if (!questionId) return null;
  const match = questionId.match(/_(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num === 7) return PROGRESS_MILESTONES.DISCOVERY_START;
  if (num === 11) return PROGRESS_MILESTONES.DISCOVERY_HALF;
  if (num === 15) return PROGRESS_MILESTONES.DISCOVERY_NEAR_END;
  if (num === 17) return PROGRESS_MILESTONES.ANALYSIS_START;
  return null;
};

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
    SME: 'I\'ll help you assess your business\'s protection gaps.'
  };
  return intros[prefix] || intros.SME;
};

class CCIEEngine {
  async processReply(context, incomingText) {
    const { questionPack, currentQuestion, questionCount, answers } = context;
    const prefix = questionPack;
    const currentPhase = determinePhase(currentQuestion);

    const result = await getNextStateAndReply(currentQuestion, incomingText, answers, prefix);
    const { nextState, replyText, updatedData, isComplete } = result;

    const nextPhase = determinePhase(nextState);
    const prevPhase = currentPhase;
    const newQuestionCount = questionCount + 1;

    let messages = [];

    if (replyText) {
      messages.push({ type: 'reply', text: formatMessage(replyText) });
    }

    if (nextPhase === 'NEXT_BEST_ACTION' && currentPhase !== 'NEXT_BEST_ACTION') {
      const finalMsg = 'I have everything I need. Give me about 10 seconds while I prepare your personalized Risk Intelligence Report™.';
      if (messages.length > 0 && messages[0].text !== finalMsg) {
        messages = [{ type: 'transition', text: 'Excellent.' }, ...messages];
      }
      messages.push({ type: 'progress', text: PROGRESS_MILESTONES.ANALYSIS_START });
    }

    const milestone = getMilestoneMessage(nextState);
    if (milestone) {
      messages.push({ type: 'milestone', text: milestone });
    }

    const insight = getMicroInsight(prefix, newQuestionCount);
    if (insight) {
      messages.push({ type: 'insight', text: insight });
    }

    const trustMsg = getTrustMessage(nextPhase, parseInt((nextState || '').match(/_(\d+)$/)?.[1] || '0', 10));
    if (trustMsg) {
      messages.push({ type: 'trust', text: trustMsg });
    }

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
      "You're only a few minutes away from receiving your personalized Risk Intelligence Report™."
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
