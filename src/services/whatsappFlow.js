const fs = require('fs');
const path = require('path');

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

  if (currentState === 'awaiting_consultation_day') {
    const dayMap = { A: 'Monday', B: 'Tuesday', C: 'Wednesday', D: 'Thursday', E: 'Friday' };
    if (['A', 'B', 'C', 'D', 'E'].includes(input)) {
      updatedData.consultation_preference = dayMap[input];
      replyText = "A Risk Advisor will contact you shortly to schedule your consultation.\n\nThank you for using CoverScore AI.";
      nextState = 'finished';
    } else {
      replyText = "Please reply with A, B, C, D, or E.";
    }
    return { nextState, replyText, updatedData, isComplete };
  }

  if (currentState === 'finished' || currentState === 'COMPLETE') {
    return { nextState: 'finished', replyText: "Your assessment is complete. If you wish to start over, type RESTART.", updatedData, isComplete: false };
  }

  const currentQ = questionBank.find(q => q.id === currentState);
  
  if (!currentQ) {
    replyText = "I'm sorry, I didn't understand that. Please type START ASSESSMENT to begin.";
    return { nextState, replyText, updatedData, isComplete };
  }

  let parsedAnswer = null;
  const answerType = currentQ.question_type;
  
  if (answerType === 'yes_no') {
    if (input === 'A' || input === 'YES') parsedAnswer = 'Yes';
    else if (input === 'B' || input === 'NO') parsedAnswer = 'No';
    else {
      replyText = "Please reply with A (Yes) or B (No).";
      return { nextState, replyText, updatedData, isComplete };
    }
  } else if (answerType === 'yes_no_na') {
    if (input === 'A' || input === 'YES') parsedAnswer = 'Yes';
    else if (input === 'B' || input === 'NO') parsedAnswer = 'No';
    else if (input === 'C' || input === 'N/A' || input === 'NA') parsedAnswer = 'N/A';
    else {
      replyText = "Please reply with A, B, or C.";
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
    if (parsedAnswer === 'Yes') {
      replyText = "Excellent.\n\nWhat day works best for a consultation?\n\nA. Monday\nB. Tuesday\nC. Wednesday\nD. Thursday\nE. Friday";
      nextState = 'awaiting_consultation_day';
      updatedData.is_qualified = true;
    } else {
      replyText = "Noted. Your personalized report has been generated. We are always here if you change your mind. Have a great day!";
      nextState = 'finished';
      updatedData.is_qualified = false;
    }
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
    const userName = data.name ? data.name.split(' ')[0] : 'there';
    rawQuestion = rawQuestion.replace(/{{name}}/g, userName);
  }

  let text = rawQuestion;
  const qNum = parseInt((q.id || '').match(/_(\d+)$/)?.[1] || '0', 10);
  const isWelcomeOrConsent = qNum <= 3;

  if (!isWelcomeOrConsent && text.length > 0) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 4) {
      text = lines.slice(0, 4).join('\n');
    }
  }

  text += '\n\n';
  
  if (q.question_type === 'yes_no') {
    text += "A. Yes\nB. No";
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
