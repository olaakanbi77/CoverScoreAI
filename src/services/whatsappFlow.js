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

  // Hand off to AI Advisor if state is finished or qualification
  if (currentState === 'finished' || currentState === 'qualification') {
    return { nextState: currentState, replyText: null, updatedData, isComplete: false };
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
    if (input === 'YES' || input === 'NO') {
      parsedAnswer = input;
    } else {
      replyText = "Please reply with YES or NO.";
      return { nextState, replyText, updatedData, isComplete };
    }
  } else if (currentQ.question_type === 'single_choice') {
    const opts = currentQ.answers;
    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1 && num <= opts.length) {
      parsedAnswer = opts[num - 1];
    } else {
      replyText = `Please reply with a number from 1 to ${opts.length}.`;
      return { nextState, replyText, updatedData, isComplete };
    }
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
    parsedAnswer = incomingText;
  }

  // 2. Store Answer and Execute Logic
  updatedData[`q_${currentQ.id}`] = parsedAnswer;
  
  if (!updatedData.riskScores) {
    updatedData.riskScores = {
      exposure: 0,
      vulnerability: 0,
      impact: 0,
      preparedness_gap: 0
    };
  }

  if (currentQ.risk_logic && currentQ.risk_logic[parsedAnswer]) {
    const logic = currentQ.risk_logic[parsedAnswer];
    if (logic.exposure_points) updatedData.riskScores.exposure += logic.exposure_points;
    if (logic.vulnerability_points) updatedData.riskScores.vulnerability += logic.vulnerability_points;
    if (logic.impact_points) updatedData.riskScores.impact += logic.impact_points;
    
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
    replyText = `Thank you, ${updatedData.name || 'User'}.\n\nWe're analyzing your responses and preparing your CoverScore Risk Report.\nThis usually takes less than 30 seconds.`;
    isComplete = true;
    nextState = 'finished';
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
    text += "YES / NO";
  } else if (q.question_type === 'single_choice' && q.answers) {
    q.answers.forEach((ans, idx) => {
      text += `${idx + 1}️⃣ ${ans}\n`;
    });
    text += `\nReply with a number from 1 to ${q.answers.length}.`;
  }
  return text.trim();
};

module.exports = { getNextStateAndReply, questionBank, qbDict };
