/**
 * Conversation Flow Engine (CFE) V2
 * Dynamically parses the SQLite assessment_questions table to drive the CoverScore Assessment.
 */

const { all } = require('../config/database');

const getNextStateAndReply = async (currentState, incomingText, currentData, templateId) => {
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
  if (currentState === 'finished') {
    return { nextState: currentState, replyText: "Your assessment and review request are complete. If you wish to start over, type RESTART.", updatedData, isComplete: false };
  }

  // Welcome States
  if (currentState === 'welcome_name') {
    updatedData.name = incomingText;
    replyText = `Thank you, ${updatedData.name}.\n\nWhat's your email address?\nWe'll send your detailed report there after the assessment.`;
    nextState = 'welcome_email';
    return { nextState, replyText, updatedData, isComplete };
  }

  // --- DYNAMIC JSON STATE MACHINE EXECUTION (V1) ---
  const { getFlow, processState } = require('./conversationEngine');
  const flow = getFlow(templateId);
  if (flow) {
    return await processState(flow, currentState, incomingText, currentData);
  }

  // --- LEGACY DATABASE DYNAMIC CFE EXECUTION ---
  const questions = await all('SELECT * FROM assessment_questions WHERE template_id = ? ORDER BY id ASC', [templateId]);
  
  if (!questions || questions.length === 0) {
    replyText = "I'm sorry, this assessment template is currently empty. Please type RESTART to begin a different assessment.";
    return { nextState: 'finished', replyText, updatedData, isComplete: false };
  }

  if (currentState === 'welcome_email') {
    if (!input.includes('@')) {
      replyText = "Please enter a valid email address.";
    } else {
      updatedData.email = incomingText.toLowerCase().trim();
      // Start dynamic flow!
      const firstQ = questions[0];
      nextState = firstQ.id;
      replyText = formatDynamicQuestion(firstQ);
    }
    return { nextState, replyText, updatedData, isComplete };
  }

  // --- DYNAMIC CFE EXECUTION ---
  const currentIndex = questions.findIndex(q => q.id === currentState);
  const currentQ = questions[currentIndex];
  
  if (!currentQ) {
    replyText = "I'm sorry, I didn't understand that. Please type START ASSESSMENT to begin.";
    return { nextState, replyText, updatedData, isComplete };
  }

  // 1. Validate Input based on DB answer_type
  let parsedAnswer = null;
  const answerType = currentQ.answer_type;
  
  if (answerType === 'yes_no') {
    if (input === 'A' || input === 'YES') parsedAnswer = 'yes';
    else if (input === 'B' || input === 'NO') parsedAnswer = 'no';
    else {
      replyText = "Please reply with A (Yes) or B (No).";
      return { nextState, replyText, updatedData, isComplete };
    }
  } else if (answerType === 'yes_no_notsure') {
    if (input === 'A' || input === 'YES') parsedAnswer = 'yes';
    else if (input === 'B' || input === 'NO') parsedAnswer = 'no';
    else if (input === 'C' || input === 'NOT SURE') parsedAnswer = 'notsure';
    else {
      replyText = "Please reply with A, B, or C.";
      return { nextState, replyText, updatedData, isComplete };
    }
  } else if (answerType === 'yes_no_na') {
    if (input === 'A' || input === 'YES') parsedAnswer = 'yes';
    else if (input === 'B' || input === 'NO') parsedAnswer = 'no';
    else if (input === 'C' || input === 'N/A' || input === 'NA') parsedAnswer = 'na';
    else {
      replyText = "Please reply with A, B, or C.";
      return { nextState, replyText, updatedData, isComplete };
    }
  } else if (answerType === 'months_survival') {
    const opts = ['less_3', '3_6', '6_12', '12_24', 'over_24'];
    const letterIdx = 'ABCDE'.indexOf(input);
    if (letterIdx !== -1 && letterIdx < opts.length) {
      parsedAnswer = opts[letterIdx];
    } else {
      replyText = "Please reply with a valid option (A, B, C, D, or E).";
      return { nextState, replyText, updatedData, isComplete };
    }
  } else if (answerType === 'dynamic_multiple_choice') {
    let rules = {};
    try { rules = JSON.parse(currentQ.risk_impact_rules || '{}'); } catch(e){}
    const opts = Object.keys(rules);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Check if user replied with a letter
    const letterIdx = alphabet.indexOf(input);
    if (letterIdx !== -1 && letterIdx < opts.length) {
      parsedAnswer = opts[letterIdx]; // Store the key text directly
    } else {
      // Check if user typed the exact option
      const exactMatch = opts.find(o => o.toUpperCase() === incomingText.trim().toUpperCase());
      if (exactMatch) {
        parsedAnswer = exactMatch;
      } else {
        replyText = `Please reply with a valid option letter (e.g. A, B, C).`;
        return { nextState, replyText, updatedData, isComplete };
      }
    }
  } else {
    // Default text or number (fallback)
    parsedAnswer = incomingText.trim();
  }

  // 2. Store Answer
  // Ensure we group the answers exactly how the V1 web wizard groups them: by sanitized category id
  const categoryId = currentQ.category.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  
  if (!updatedData.answers) {
    updatedData.answers = {};
  }
  if (!updatedData.answers[categoryId]) {
    updatedData.answers[categoryId] = {};
  }
  
  updatedData.answers[categoryId][currentQ.id] = parsedAnswer;

  // 3. Determine Next Step (Sequential)
  const nextQ = questions[currentIndex + 1];
  
  // 4. Format Reply
  if (!nextQ) {
    replyText = `Thank you.\n\nWe are now analyzing your responses and calculating your CoverScore™.\n\nPlease wait a moment.`;
    isComplete = true;
    nextState = 'awaiting_consultation';
  } else {
    nextState = nextQ.id;
    replyText = formatDynamicQuestion(nextQ);
  }

  return { nextState, replyText, updatedData, isComplete };
};

// Helper to format a DB question for WhatsApp
const formatDynamicQuestion = (q) => {
  let text = `*${q.category}*\n\n${q.question_text}\n\n`;
  
  if (q.answer_type === 'yes_no') {
    text += "A. Yes\nB. No";
  } else if (q.answer_type === 'yes_no_notsure') {
    text += "A. Yes\nB. No\nC. Not sure";
  } else if (q.answer_type === 'yes_no_na') {
    text += "A. Yes\nB. No\nC. N/A";
  } else if (q.answer_type === 'months_survival') {
    text += "A. Less than 3 months\nB. 3-6 months\nC. 6-12 months\nD. 12-24 months\nE. Over 24 months";
  } else if (q.answer_type === 'dynamic_multiple_choice') {
    let rules = {};
    try { rules = JSON.parse(q.risk_impact_rules || '{}'); } catch(e){}
    const opts = Object.keys(rules);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    text += opts.map((opt, i) => `${alphabet[i]}. ${opt}`).join('\n');
  }
  return text.trim();
};

const getInitialWelcome = async (templateId) => {
    const questions = await all('SELECT * FROM assessment_questions WHERE template_id = ? ORDER BY id ASC LIMIT 1', [templateId]);
    if (questions.length > 0) {
        return formatDynamicQuestion(questions[0]);
    }
    return null;
}

module.exports = { getNextStateAndReply, getInitialWelcome };
