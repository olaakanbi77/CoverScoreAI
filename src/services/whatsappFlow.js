/**
 * Conversation Flow Engine (CFE)
 * Dynamically parses question_bank.json to drive the CoverScore Assessment.
 */

const fs = require('fs');
const path = require('path');

// Load structured database
const questionBankPath = path.join(__dirname, '../data/question_bank.json');
let questionBank = [];
let industryProfiles = {};
try {
  questionBank = JSON.parse(fs.readFileSync(questionBankPath, 'utf8'));
  industryProfiles = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/industry_profiles.json'), 'utf8'));
} catch (err) {
  console.error('Failed to load data JSONs:', err);
}

// Convert to dictionary for quick lookup O(1)
const qbDict = {};
questionBank.forEach(q => {
  qbDict[q.id] = q;
});

const getNextStateAndReply = (currentState, incomingText, currentData, industry = 'sme') => {
  let nextState = currentState;
  let replyText = '';
  let updatedData = { ...currentData };
  let isComplete = false;

  const normalizeInput = (text) => text.toUpperCase().trim();
  const input = normalizeInput(incomingText);

  // Structured Qualification States (V2 Flow)
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

  // Hardcoded Welcome State (Before dynamic questions)
  if (currentState === 'welcome_name') {
    updatedData.name = incomingText;
    replyText = `Thank you, ${updatedData.name}.\n\nWhat's your email address?\nWe'll send your detailed report there after the assessment.`;
    nextState = 'welcome_email';
    return { nextState, replyText, updatedData, isComplete };
  }

  if (currentState === 'welcome_email') {
    if (!input.includes('@')) {
      replyText = "Please enter a valid email address.";
    } else {
      updatedData.email = incomingText.toLowerCase().trim();
      // Start dynamic flow!
      const firstQ = questionBank[0];
      nextState = firstQ.id;
      replyText = formatQuestion(firstQ);
    }
    return { nextState, replyText, updatedData, isComplete };
  }

  // --- DYNAMIC CFE EXECUTION ---
  const currentQ = qbDict[currentState];
  if (!currentQ) {
    // Fallback if state not found
    replyText = "I'm sorry, I didn't understand that. Please type START ASSESSMENT to begin.";
    return { nextState, replyText, updatedData, isComplete };
  }

  // 1. Validate Input
  let parsedAnswer = null;
  if (currentQ.question_type === 'yes_no') {
    if (input === 'A' || input === 'YES') {
      parsedAnswer = 'YES';
    } else if (input === 'B' || input === 'NO') {
      parsedAnswer = 'NO';
    } else {
      replyText = "Please reply with A (Yes) or B (No).";
      return { nextState, replyText, updatedData, isComplete };
    }
  } else if (currentQ.question_type === 'single_choice') {
    const opts = currentQ.answers;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letterIdx = letters.indexOf(input);
    if (letterIdx !== -1 && letterIdx < opts.length) {
      parsedAnswer = opts[letterIdx];
    } else {
      const num = parseInt(input, 10);
      if (!isNaN(num) && num >= 1 && num <= opts.length) {
        parsedAnswer = opts[num - 1];
      } else {
        replyText = `Please reply with a valid option (e.g. A, B, C).`;
        return { nextState, replyText, updatedData, isComplete };
      }
    }
  } else if (currentQ.question_type === 'multi_choice') {
    const opts = currentQ.answers;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const selected = [];
    const parts = input.split(/[\s,]+/);
    let valid = true;
    for (const part of parts) {
      const char = part.trim();
      if (!char) continue;
      const idx = letters.indexOf(char);
      if (idx !== -1 && idx < opts.length) {
        selected.push(opts[idx]);
      } else {
        valid = false;
        break;
      }
    }
    if (valid && selected.length > 0) {
      parsedAnswer = selected;
    } else {
      replyText = `Please reply with the letters corresponding to your choices (e.g. A, B, C).`;
      return { nextState, replyText, updatedData, isComplete };
    }
  } else if (currentQ.question_type === 'open_text') {
    if (currentQ.validation === 'email' && !input.includes('@')) {
      replyText = "Please enter a valid email address.";
      return { nextState, replyText, updatedData, isComplete };
    }
    parsedAnswer = incomingText.trim();
  } else if (currentQ.question_type === 'number') {
    const num = parseInt(input, 10);
    if (!isNaN(num)) {
      parsedAnswer = num;
    } else {
      replyText = "Please reply with a valid number.";
      return { nextState, replyText, updatedData, isComplete };
    }
  } else {
    // Default fallback (accept anything)
    parsedAnswer = incomingText.trim();
  }

  // 2. Store Answer and Execute Logic
  updatedData[`q_${currentQ.id}`] = parsedAnswer;
  if (currentQ.data_mapping) {
    updatedData[currentQ.data_mapping] = parsedAnswer;
  }
  
  if (!updatedData.riskScores) {
    updatedData.riskScores = {
      exposure: 0,
      vulnerability: 0,
      impact: 0,
      preparedness_gap: 0
    };
  }

  if (!updatedData.sales_score) {
    updatedData.sales_score = 0;
  }

  if (currentQ.risk_logic && currentQ.risk_logic[parsedAnswer]) {
    const logic = currentQ.risk_logic[parsedAnswer];
    if (logic.exposure_points) updatedData.riskScores.exposure += logic.exposure_points;
    if (logic.vulnerability_points) updatedData.riskScores.vulnerability += logic.vulnerability_points;
    if (logic.impact_points) updatedData.riskScores.impact += logic.impact_points;
    if (logic.lead_score_points) updatedData.sales_score += logic.lead_score_points;
    
    // Fallback for "risk_points" if not specified by pillar
    if (logic.risk_points) {
      if (currentQ.pillar === 'Exposure') updatedData.riskScores.exposure += logic.risk_points;
      else if (currentQ.pillar === 'Impact') updatedData.riskScores.impact += logic.risk_points;
      else updatedData.riskScores.vulnerability += logic.risk_points; // Default preparedness/vulnerability
    }
  }

  // Apply Recommendation Trigger
  if (currentQ.recommendation_trigger && currentQ.recommendation_trigger.condition === parsedAnswer) {
    if (!updatedData.recommendations) updatedData.recommendations = [];
    updatedData.recommendations.push(currentQ.recommendation_trigger.recommendation);
  }

  // 3. Determine Next Step (Branching Logic)
  let nextQId = null;
  if (currentQ.branching) {
    if (currentQ.branching[parsedAnswer]) {
      nextQId = currentQ.branching[parsedAnswer];
    } else if (currentQ.branching["DEFAULT"]) {
      nextQId = currentQ.branching["DEFAULT"];
    }
  }

  // 3b. Assessment Assembly Engine (Industry Module Injection)
  if (nextQId === 'COMPLETE') {
    const profile = industryProfiles[industry] || industryProfiles['sme'];
    if (profile && profile.modules && profile.modules.length > 0) {
      // Find the first question of the first module that matches this industry
      // For now, we rely on a convention or explicitly looking up the first question of that module.
      // Let's search the question bank for the first question that belongs to the module.
      const firstModuleQ = questionBank.find(q => q.domain === profile.modules[0] || (q.industry_module && q.industry_module === profile.modules[0]));
      
      // We haven't started industry modules yet
      if (firstModuleQ && !updatedData._started_modules) {
        nextQId = firstModuleQ.id;
        updatedData._started_modules = true;
      }
    }
  }

  // 4. Format Reply
  if (!nextQId || nextQId === 'COMPLETE') {
    replyText = `Thank you.\n\nWe are now analyzing your responses and calculating your School Risk Score™.\n\nPlease wait a moment.`;
    isComplete = true;
    nextState = 'awaiting_consultation';
  } else {
    const nextQ = qbDict[nextQId];
    if (nextQ) {
      nextState = nextQ.id;
      replyText = formatQuestion(nextQ);
    } else {
      replyText = `Error: Cannot find next question ${nextQId}`;
      isComplete = true;
      nextState = 'finished';
    }
  }

  return { nextState, replyText, updatedData, isComplete };
};

// Helper to format a question for WhatsApp
const formatQuestion = (q) => {
  let text = q.question + "\n\n";
  if (q.question_type === 'yes_no') {
    text += "A. Yes\nB. No";
  } else if ((q.question_type === 'single_choice' || q.question_type === 'multi_choice') && q.answers) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    q.answers.forEach((ans, idx) => {
      text += `${letters[idx]}. ${ans}\n`;
    });
  } else if (q.question_type === 'open_text') {
    // No specific options to display
  }
  return text.trim();
};

module.exports = { getNextStateAndReply, questionBank, qbDict };
