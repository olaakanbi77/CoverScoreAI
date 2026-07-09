const fs = require('fs');
const path = require('path');
const { domainConfig, defaultDomain } = require('../config/domain');

const qbPath = path.join(__dirname, '..', 'data', 'question_bank.json');
let questionBank = [];
try {
  questionBank = JSON.parse(fs.readFileSync(qbPath, 'utf8'));
} catch(e) {
  console.error("Failed to load question_bank.json", e);
}

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
  if (num <= 16) return 'DISCOVERY';
  if (num === 17) return 'ANALYSIS';
  if (num === 18) return 'REPORT_READY';
  if (num >= 19) return 'RESULTS';
  return 'DISCOVERY';
};

const splitLongText = (text, maxWords) => {
  if (!text) return [text];
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return [text];
  const parts = [];
  for (let i = 0; i < words.length; i += maxWords) {
    parts.push(words.slice(i, i + maxWords).join(' '));
  }
  return parts;
};

const getNextStateAndReply = async (currentState, incomingText, currentData, prefix) => {
  let nextState = currentState;
  let replyText = '';
  let updatedData = { ...currentData };
  let isComplete = false;

  const normalizeInput = (text) => text.toUpperCase().trim();
  const input = normalizeInput(incomingText);

  const dom = domainConfig[prefix] || defaultDomain;

  const currentQ = questionBank.find(q => q.id === currentState);

  // Simplified ending: Yes routes to advisor, No closes gracefully, any day name closes
  const isAwaitingConsultation = currentState === 'awaiting_consultation' || 
    (currentQ && currentQ.branching && currentQ.branching.DEFAULT === 'awaiting_consultation');

  if (isAwaitingConsultation) {
    const knownDays = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
    if (input === 'A' || input === 'YES') {
      updatedData.next_action = 'Speak with a Risk Advisor';
      replyText = `Great.\n\nOne of our Certified Risk Advisors will contact you shortly to walk through your report and discuss practical ways to strengthen your ${dom.closingTerm}.\n\nThank you for taking the time to understand your ${dom.domain} risks today.\n\nEvery step you take toward better preparation helps protect both you and the people who depend on you.`;
      nextState = 'finished';
      updatedData.is_qualified = true;
    } else if (knownDays.includes(input)) {
      // User typed a day directly — route to advisor with day preference
      updatedData.next_action = 'Speak with a Risk Advisor';
      updatedData.consultation_day = incomingText.trim().charAt(0).toUpperCase() + incomingText.trim().slice(1).toLowerCase();
      replyText = `Noted.\n\nOne of our Certified Risk Advisors will contact you on ${updatedData.consultation_day} to walk through your report and help you implement your recommendation.\n\nThank you for choosing CoverScore\u2122.`;
      nextState = 'finished';
      updatedData.is_qualified = true;
    } else {
      // B / Not now / anything else
      updatedData.is_qualified = false;
      replyText = `No problem.\n\nYour report will remain available whenever you need it.\n\n${dom.followUpMsg}\n\nIf you ever decide you'd like a personal review, simply reply:\n\nADVISOR\n\nWe'll arrange it for you.\n\nThank you for choosing CoverScore\u2122.`;
      nextState = 'finished';
    }
    return { nextState, replyText, updatedData, isComplete };
  }

  if (currentState === 'finished' || currentState === 'COMPLETE') {
    const knownDays = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
    if (input === 'ADVISOR') {
      updatedData.next_action = 'Speak with a Risk Advisor';
      replyText = `Great.\n\nOne of our Certified Risk Advisors will contact you shortly to walk through your report and discuss practical ways to strengthen your ${dom.closingTerm}.\n\nThank you for taking the time to understand your ${dom.domain} risks today.\n\nEvery step you take toward better preparation helps protect both you and the people who depend on you.`;
      nextState = 'finished';
      updatedData.is_qualified = true;
      return { nextState, replyText, updatedData, isComplete };
    }
    if (knownDays.includes(input)) {
      updatedData.next_action = 'Speak with a Risk Advisor';
      updatedData.consultation_day = incomingText.trim().charAt(0).toUpperCase() + incomingText.trim().slice(1).toLowerCase();
      replyText = `Noted.\n\nOne of our Certified Risk Advisors will contact you on ${updatedData.consultation_day} to walk through your report and discuss practical ways to strengthen your ${dom.closingTerm}.\n\nThank you for taking the time to understand your ${dom.domain} risks today.\n\nEvery step you take toward better preparation helps protect both you and the people who depend on you.`;
      nextState = 'finished';
      updatedData.is_qualified = true;
      return { nextState, replyText, updatedData, isComplete };
    }
    return { nextState: 'finished', replyText: "Your assessment is complete. If you wish to start over, type RESTART.", updatedData, isComplete: false };
  }

  if (!currentQ) {
    replyText = "I'm sorry, I didn't understand that. Please type START ASSESSMENT to begin.";
    return { nextState, replyText, updatedData, isComplete };
  }

  // Auto-advance: skip user input, use first option
  let autoAnswer;
  if (incomingText === 'AUTO_ADVANCE') {
    const opts = currentQ.answers || [];
    const answerType = currentQ.question_type;
    if (answerType === 'yes_no') {
      autoAnswer = opts[0] || 'Yes';
    } else if (answerType === 'single_choice' || answerType === 'multi_choice') {
      autoAnswer = opts[0] || '';
    } else if (answerType === 'open_text') {
      autoAnswer = '';
    }
    const parsedAnswer = autoAnswer;
    if (parsedAnswer !== undefined && parsedAnswer !== null) {
      // Skip normal validation, record answer and find next state
      if (!updatedData.answers) updatedData.answers = {};
      updatedData.answers[currentQ.id] = parsedAnswer;
      if (currentQ.data_mapping) {
        updatedData[currentQ.data_mapping] = parsedAnswer;
      }
      nextState = 'COMPLETE';
      if (currentQ.branching) {
        let rawAnswerKey = Array.isArray(parsedAnswer) ? parsedAnswer[0] : parsedAnswer;
        if (currentQ.branching[rawAnswerKey]) {
          nextState = currentQ.branching[rawAnswerKey];
        } else if (currentQ.branching['DEFAULT']) {
          nextState = currentQ.branching['DEFAULT'];
        }
      } else {
        const match = currentQ.id.match(/^([A-Z]+)_(\d+)$/);
        if (match) {
          const pref = match[1];
          const num = parseInt(match[2], 10);
          nextState = `${pref}_${String(num+1).padStart(3, '0')}`;
        }
      }
      const nextQ = questionBank.find(q => q.id === nextState);
      if (nextQ) {
        replyText = formatDynamicQuestion(nextQ, updatedData);
      } else if (nextState !== 'finished' && nextState !== 'COMPLETE' && nextState !== 'awaiting_consultation') {
        replyText = '';
      }
      return { nextState, replyText, updatedData, isComplete: nextState === 'finished' || nextState === 'COMPLETE' || nextState === 'awaiting_consultation' };
    }
  }

  let parsedAnswer = null;
  const answerType = currentQ.question_type;
  
  if (answerType === 'yes_no') {
    const opts = currentQ.answers || [];
    const hasThird = opts.length >= 3;
    if (input === 'A' || input === 'YES') parsedAnswer = 'Yes';
    else if (input === 'B' || input === 'NO') parsedAnswer = 'No';
    else if (hasThird && (input === 'C' || input === opts[2].toUpperCase())) parsedAnswer = opts[2];
    else {
      replyText = hasThird ? "Please reply with A, B, or C." : "Please reply with A (Yes) or B (No).";
      return { nextState, replyText, updatedData, isComplete };
    }
  } else if (answerType === 'single_choice') {
    const opts = currentQ.answers || [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letterIdx = alphabet.indexOf(input);
    if (letterIdx !== -1 && letterIdx < opts.length) {
      parsedAnswer = opts[letterIdx];
    } else {
      const exactMatch = opts.find(o => o.toUpperCase() === incomingText.trim().toUpperCase());
      if (exactMatch) {
        parsedAnswer = exactMatch;
      } else {
        replyText = "Please reply with a valid option letter (e.g. A, B, C).";
        return { nextState, replyText, updatedData, isComplete };
      }
    }
  } else if (answerType === 'multi_choice') {
    const opts = currentQ.answers || [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let selected = [];
    let valid = true;
    const parts = input.split(/[, \n]+/).filter(Boolean);
    for (const p of parts) {
      const cleanP = p.replace(/[^A-Z]/g, '');
      const letterIdx = alphabet.indexOf(cleanP);
      if (letterIdx !== -1 && letterIdx < opts.length) {
        selected.push(opts[letterIdx]);
      } else {
        valid = false;
        break;
      }
    }
    if (valid && selected.length > 0) {
      parsedAnswer = selected;
    } else {
      replyText = "Please reply with valid letters separated by commas (e.g. A, C).";
      return { nextState, replyText, updatedData, isComplete };
    }
  } else if (answerType === 'open_text') {
    if (!incomingText || incomingText.trim().length < 2) {
       replyText = "Please provide a valid answer.";
       return { nextState, replyText, updatedData, isComplete };
    }
    parsedAnswer = incomingText.trim();
  }

  if (!updatedData.answers) {
    updatedData.answers = {};
  }
  updatedData.answers[currentQ.id] = parsedAnswer;
  if (currentQ.data_mapping) {
    updatedData[currentQ.data_mapping] = parsedAnswer;
  }

  nextState = 'COMPLETE';
  if (currentQ.branching) {
    let rawAnswerKey = Array.isArray(parsedAnswer) ? parsedAnswer[0] : parsedAnswer;
    if (currentQ.branching[rawAnswerKey]) {
      nextState = currentQ.branching[rawAnswerKey];
    } else if (currentQ.branching['DEFAULT']) {
      nextState = currentQ.branching['DEFAULT'];
    }
  } else {
    const match = currentQ.id.match(/^([A-Z]+)_(\d+)$/);
    if (match) {
       const pref = match[1];
       const num = parseInt(match[2], 10);
       nextState = `${pref}_${String(num+1).padStart(3, '0')}`;
    }
  }

  if (nextState === 'COMPLETE' || nextState === 'finished') {
    replyText = "Your assessment is complete. If you wish to start over, type RESTART.";
    isComplete = true;
    nextState = 'finished';
  } else if (nextState === 'awaiting_consultation') {
    replyText = '';
  } else {
    const nextQ = questionBank.find(q => q.id === nextState);
    if (!nextQ) {
      replyText = "Your assessment is complete. Thank you.";
      isComplete = true;
      nextState = 'finished';
    } else {
      replyText = formatDynamicQuestion(nextQ, updatedData);
    }
  }

  return { nextState, replyText, updatedData, isComplete };
};

const formatDynamicQuestion = (q, data = {}) => {
  let rawQuestion = q.question;
  if (rawQuestion.includes('{{name}}')) {
    const userName = data.name ? data.name.split(' ')[0] : '{{name}}';
    rawQuestion = rawQuestion.replace(/{{name}}/g, userName);
  }

  let text = rawQuestion;
  const qNum = parseInt((q.id || '').match(/_(\d+)$/)?.[1] || '0', 10);
  const isWelcomeOrConsent = qNum <= 3;

  if (!isWelcomeOrConsent && text.length > 0) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 12) {
      text = lines.slice(0, 12).join('\n');
    }
  }

  text += '\n\n';
  
  if (q.question_type === 'yes_no') {
    const opts = q.answers || [];
    if (opts.length >= 3) {
      text += opts.map((opt, i) => `${'ABC'[i]}. ${opt}`).join('\n');
    } else {
      text += "A. Yes\nB. No";
    }
  } else if (q.question_type === 'yes_no_na') {
    text += "A. Yes\nB. No\nC. N/A";
  } else if (q.question_type === 'single_choice' || q.question_type === 'multi_choice') {
    const opts = q.answers || [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    text += opts.map((opt, i) => `${alphabet[i]}. ${opt}`).join('\n');
  }
  return text.trim();
};

const getInitialWelcome = async (prefix) => {
    const firstQ = questionBank.find(q => q.id === `${prefix}_001`);
    if (firstQ) {
        return formatDynamicQuestion(firstQ);
    }
    return null;
};

module.exports = { getNextStateAndReply, getInitialWelcome, determinePhase, formatDynamicQuestion };
