// QPRE Runtime Type Constants

const RUNTIME_STATES = Object.freeze({
  START: 'START',
  LOAD_PACK: 'LOAD_PACK',
  LOAD_QUESTION: 'LOAD_QUESTION',
  WAIT_ANSWER: 'WAIT_ANSWER',
  VALIDATE: 'VALIDATE',
  SAVE: 'SAVE',
  BRANCH: 'BRANCH',
  NEXT: 'NEXT',
  COMPLETE: 'COMPLETE'
});

const SESSION_PHASES = Object.freeze({
  NEW: 'NEW',
  WELCOME: 'WELCOME',
  CONSENT: 'CONSENT',
  PROFILE: 'PROFILE',
  DISCOVERY: 'DISCOVERY',
  SCORING: 'SCORING',
  REPORT: 'REPORT',
  COMPLETE: 'COMPLETE'
});

const PHASE_ORDER = Object.freeze([
  SESSION_PHASES.NEW,
  SESSION_PHASES.WELCOME,
  SESSION_PHASES.CONSENT,
  SESSION_PHASES.PROFILE,
  SESSION_PHASES.DISCOVERY,
  SESSION_PHASES.SCORING,
  SESSION_PHASES.REPORT,
  SESSION_PHASES.COMPLETE
]);

const QUESTION_TYPES = Object.freeze({
  CHOICE: 'choice',
  MULTIPLE: 'multiple',
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  NUMBER: 'number',
  DATE: 'date',
  YES_NO: 'yes_no'
});

const RUNTIME_EVENTS = Object.freeze({
  ASSESSMENT_STARTED: 'AssessmentStarted',
  QUESTION_DISPLAYED: 'QuestionDisplayed',
  ANSWER_RECEIVED: 'AnswerReceived',
  ANSWER_VALIDATED: 'AnswerValidated',
  ANSWER_INVALID: 'AnswerInvalid',
  QUESTION_COMPLETED: 'QuestionCompleted',
  SECTION_STARTED: 'SectionStarted',
  SECTION_COMPLETED: 'SectionCompleted',
  ASSESSMENT_COMPLETED: 'AssessmentCompleted',
  SCORING_TRIGGERED: 'ScoringTriggered',
  REPORT_GENERATED: 'ReportGenerated'
});

const OPERATORS = Object.freeze({
  EQUALS: '=',
  NOT_EQUALS: '!=',
  IN: 'in',
  GREATER_THAN: '>',
  LESS_THAN: '<',
  REGEX: 'regex'
});

const canTransition = (from, to) => {
  const fromIdx = PHASE_ORDER.indexOf(from);
  const toIdx = PHASE_ORDER.indexOf(to);
  return fromIdx !== -1 && toIdx !== -1 && toIdx >= fromIdx;
};

module.exports = {
  RUNTIME_STATES,
  SESSION_PHASES,
  PHASE_ORDER,
  QUESTION_TYPES,
  RUNTIME_EVENTS,
  OPERATORS,
  canTransition
};
