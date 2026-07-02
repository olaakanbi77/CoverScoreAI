const fs = require('fs');
const path = require('path');

// Load JSON Question Bank
const qbPath = path.join(__dirname, '..', 'data', 'question_bank.json');
let questionBank = [];
try {
  questionBank = JSON.parse(fs.readFileSync(qbPath, 'utf8'));
} catch(e) {
  console.error("Failed to load question_bank.json", e);
}

const getNextStateAndReply = async (currentState, incomingText, currentData, prefix) => {
  let nextState = currentState;
  let replyText = '';
  let updatedData = { ...currentData };
  let isComplete = false;

  const normalizeInput = (text) => text.toUpperCase().trim();
  const input = normalizeInput(incomingText);

  // Structured Qualification States (V2 Flow Post-Assessment)
  if (currentState === 'awaiting_consultation') {
    if (input === 'A' || input === 'YES') {
      replyText = "Excellent.\n\nWhat day works best for a consultation?\n\nA. Monday\nB. Tuesday\nC. Wednesday\nD. Thursday\nE. Friday";
      nextState = 'awaiting_consultation_day';
      updatedData.is_qualified = true;
    } else if (input === 'B' || input === 'MAYBE LATER' || input === 'C' || input === 'NO') {
      replyText = "Noted. Your personalized report will still be sent to your email. We are always here if you change your mind. Have a great day!";
      nextState = 'finished';
      updatedData.is_qualified = false;
    } else {
      replyText = "Please reply with A, B, or C.";
    }
    return { nextState, replyText, updatedData, isComplete };
  }

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

  // Handle finished state explicitly
  if (currentState === 'finished' || currentState === 'COMPLETE') {
    return { nextState: 'finished', replyText: "Your assessment is complete. If you wish to start over, type RESTART.", updatedData, isComplete: false };
  }

  // DYNAMIC CFE EXECUTION FROM JSON
  const currentQ = questionBank.find(q => q.id === currentState);
  
  if (!currentQ) {
    // If state is not found, maybe they are somehow lost.
    replyText = "I'm sorry, I didn't understand that. Please type START ASSESSMENT to begin.";
    return { nextState, replyText, updatedData, isComplete };
  }

  // 1. Validate Input based on JSON question_type
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
    
    // Support "A, C" or "A,C"
    const parts = input.split(/[, \n]+/).filter(Boolean);
    for (const p of parts) {
      // p could be 'A' or 'A.' or 'C'
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

  // 2. Store Answer
  if (!updatedData.answers) {
    updatedData.answers = {};
  }
  
  updatedData.answers[currentQ.id] = parsedAnswer;
  
  if (currentQ.data_mapping) {
    updatedData[currentQ.data_mapping] = parsedAnswer;
  }

  // 3. Determine Next Step based on branching
  nextState = 'COMPLETE'; // default
  if (currentQ.branching) {
    let rawAnswerKey = Array.isArray(parsedAnswer) ? parsedAnswer[0] : parsedAnswer;
    if (currentQ.branching[rawAnswerKey]) {
      nextState = currentQ.branching[rawAnswerKey];
    } else if (currentQ.branching['DEFAULT']) {
      nextState = currentQ.branching['DEFAULT'];
    }
  } else {
    // If no branching, try to find next sequential ID by parsing ID numbers (e.g. SCH_001 -> SCH_002)
    const match = currentQ.id.match(/^([A-Z]+)_(\d+)$/);
    if (match) {
       const pref = match[1];
       const num = parseInt(match[2], 10);
       nextState = `${pref}_${String(num+1).padStart(3, '0')}`;
    }
  }

  // 4. Format Reply
  if (nextState === 'COMPLETE' || nextState === 'finished') {
    replyText = "Thank you.\n\nWe are now analyzing your responses and calculating your CoverScore™.\n\nPlease wait a moment.";
    isComplete = true;
    nextState = 'awaiting_consultation';
  } else {
    const nextQ = questionBank.find(q => q.id === nextState);
    if (!nextQ) {
      replyText = "Thank you.\n\nWe are now analyzing your responses and calculating your CoverScore™.\n\nPlease wait a moment.";
      isComplete = true;
      nextState = 'awaiting_consultation';
    } else {
      replyText = formatDynamicQuestion(nextQ, updatedData);
    }
  }

  return { nextState, replyText, updatedData, isComplete };
};

// Helper to format a JSON question for WhatsApp
const formatDynamicQuestion = (q, data = {}) => {
  let text = '';
  const hiddenPillars = ['General', 'Exposure'];
  
  let rawQuestion = q.question;
  if (rawQuestion.includes('{{name}}')) {
    const userName = data.name ? data.name.split(' ')[0] : 'there';
    rawQuestion = rawQuestion.replace(/{{name}}/g, userName);
  }

  text = `${rawQuestion}\n\n`;
  
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
}

module.exports = { getNextStateAndReply, getInitialWelcome };
