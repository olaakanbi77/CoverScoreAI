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

  // Simplified ending: Yes routes to advisor, No closes gracefully, any day name closes
  if (currentState === 'awaiting_consultation') {
    const knownDays = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
    if (input === 'A' || input === 'YES') {
      updatedData.next_action = 'Speak with a Risk Advisor';
      replyText = "Great.\n\nOne of our Certified Risk Advisors will contact you shortly to walk through your report and discuss practical ways to strengthen your health protection.\n\nThank you for taking the time to understand your health risks today.\n\nEvery step you take toward better preparation helps protect both you and the people who depend on you.";
      nextState = 'finished';
      updatedData.is_qualified = true;
    } else if (knownDays.includes(input)) {
      updatedData.next_action = 'Speak with a Risk Advisor';
      updatedData.consultation_day = incomingText.trim().charAt(0).toUpperCase() + incomingText.trim().slice(1).toLowerCase();
      replyText = `Noted.\n\nOne of our Certified Risk Advisors will contact you on ${updatedData.consultation_day} to walk through your report and help you implement your recommendation.\n\nThank you for choosing CoverScore\u2122.`;
      nextState = 'finished';
      updatedData.is_qualified = true;
    } else {
      updatedData.is_qualified = false;
      replyText = "No problem.\n\nYour report will remain available whenever you need it.\n\nOver the coming weeks, I'll also share practical health protection tips that match your assessment.\n\nIf you ever decide you'd like a personal review, simply reply:\n\nADVISOR\n\nWe'll arrange it for you.\n\nThank you for choosing CoverScore\u2122.";
      nextState = 'finished';
    }
    return { nextState, replyText, updatedData, isComplete };
  }

  // Handle finished state explicitly — also accept ADVISOR keyword or day name
  if (currentState === 'finished' || currentState === 'COMPLETE') {
    const knownDays = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
    if (input === 'ADVISOR') {
      updatedData.next_action = 'Speak with a Risk Advisor';
      replyText = "Great.\n\nOne of our Certified Risk Advisors will contact you shortly to walk through your report and discuss practical ways to strengthen your health protection.\n\nThank you for taking the time to understand your health risks today.\n\nEvery step you take toward better preparation helps protect both you and the people who depend on you.";
      nextState = 'finished';
      updatedData.is_qualified = true;
      return { nextState, replyText, updatedData, isComplete };
    }
    if (knownDays.includes(input)) {
      updatedData.next_action = 'Speak with a Risk Advisor';
      updatedData.consultation_day = incomingText.trim().charAt(0).toUpperCase() + incomingText.trim().slice(1).toLowerCase();
      replyText = `Noted.\n\nOne of our Certified Risk Advisors will contact you on ${updatedData.consultation_day} to walk through your report and discuss practical ways to strengthen your health protection.\n\nThank you for taking the time to understand your health risks today.\n\nEvery step you take toward better preparation helps protect both you and the people who depend on you.`;
      nextState = 'finished';
      updatedData.is_qualified = true;
      return { nextState, replyText, updatedData, isComplete };
    }
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
      replyText = formatDynamicQuestion(nextQ);
    }
  }

  return { nextState, replyText, updatedData, isComplete };
};

// Helper to format a JSON question for WhatsApp
const formatDynamicQuestion = (q) => {
  let text = '';
  const hiddenPillars = ['General', 'Exposure'];
  
  if (q.pillar && !hiddenPillars.includes(q.pillar)) {
    text = `*${q.pillar}*\n\n${q.question}\n\n`;
  } else {
    text = `${q.question}\n\n`;
  }
  
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
