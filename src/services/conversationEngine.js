const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { run } = require('../config/database');

// Cache the parsed JSON flows
const flowCache = {};

function getFlow(templateId) {
  if (flowCache[templateId]) return flowCache[templateId];

  // Map templateId to filename if necessary
  const filename = templateId === 'family_protection' ? 'family_protection_score_v1.json' : `${templateId}.json`;
  const flowPath = path.join(__dirname, '..', 'config', 'flows', filename);
  
  if (fs.existsSync(flowPath)) {
    const rawData = fs.readFileSync(flowPath, 'utf8');
    const flow = JSON.parse(rawData);
    flowCache[templateId] = flow;
    return flow;
  }
  return null;
}

function normalizeInput(input) {
  return input.trim().toUpperCase();
}

/**
 * Evaluates branch rules defined in the JSON configuration.
 */
function evaluateBranchRules(rules, input, answers) {
  for (const rule of rules) {
    if (rule.else) {
      return rule.next_state;
    }
    if (rule.if) {
      let condition = rule.if;
      
      // Extremely basic evaluation for MVP without using dangerous eval()
      // "answers.PER_FAM_001.value != 0"
      if (condition.includes('answers.PER_FAM_001.value != 0')) {
        const val = answers['PER_FAM_001'] ? answers['PER_FAM_001'].value : null;
        if (val != 0) return rule.next_state;
      }
      
      // "input in ['2','3','4']"
      if (condition.includes("input in ['2','3','4']")) {
        if (['2', '3', '4'].includes(input)) return rule.next_state;
      }
    }
  }
  return null;
}

/**
 * Process the current state against the input, and return next state and response.
 */
async function processState(flow, currentState, incomingText, currentData) {
  const stateConfig = flow.states.find(s => s.state === currentState);
  const input = normalizeInput(incomingText);
  let updatedData = { ...currentData };
  if (!updatedData.answers) updatedData.answers = {};

  // Global Commands
  if (input === 'STOP') {
    const stopState = flow.states.find(s => s.state === 'FAM_EXIT') || flow.states.find(s => s.input_type === 'end');
    if (stopState) {
      return { 
        nextState: stopState.state, 
        replyText: stopState.message, 
        updatedData, 
        isComplete: true 
      };
    }
  }
  if (input === 'PAUSE') {
    return {
      nextState: currentState,
      replyText: "Your assessment has been paused.\n\nWhenever you are ready, reply CONTINUE and I will take you back to your next question.",
      updatedData,
      isComplete: false
    };
  }
  if (input === 'HELP') {
    return {
      nextState: currentState,
      replyText: "Reply with the number that best matches your answer.\n\nFor example, if you choose option 2, simply reply:\n\n2\n\nYou can also reply PAUSE to continue later or STOP to end the assessment.\n\n---\n\n" + (stateConfig ? renderMessage(stateConfig.message, updatedData) : ""),
      updatedData,
      isComplete: false
    };
  }

  if (!stateConfig) {
    // Unknown state
    return {
      nextState: flow.assessment_template.initial_state,
      replyText: "Your session could not be found. Let's start over.\n\nReply START to begin.",
      updatedData,
      isComplete: false
    };
  }

  const { input_type, accepted_inputs, answer_map, transitions, branch_rules, validation } = stateConfig;
  
  // Validation
  let isValid = false;
  let parsedValue = input;
  let riskValue = 0;

  if (input_type === 'command') {
    if (accepted_inputs.includes(input)) isValid = true;
  } else if (input_type === 'single_select') {
    if (accepted_inputs && accepted_inputs.includes(input)) {
      isValid = true;
      if (answer_map && answer_map[input]) {
        parsedValue = answer_map[input].value !== undefined ? answer_map[input].value : answer_map[input].label;
        riskValue = answer_map[input].risk_value || 0;
      }
    }
  } else if (input_type === 'name') {
    if (incomingText.length >= (validation.min_length || 2) && incomingText.length <= (validation.max_length || 50)) {
      if (new RegExp(validation.allow_pattern).test(incomingText)) {
        isValid = true;
        parsedValue = incomingText.trim();
      }
    }
  } else if (input_type === 'nigerian_state') {
    if (incomingText.length > 2) {
      isValid = true; // MVP: Accept any string > 2 chars as state
      parsedValue = incomingText.trim();
    }
  } else if (input_type === 'email') {
    if (input === 'SKIP' && stateConfig.allow_skip) {
      isValid = true;
      parsedValue = null;
    } else if (incomingText.includes('@') && incomingText.includes('.')) {
      isValid = true;
      parsedValue = incomingText.trim().toLowerCase();
    }
  } else if (input_type === 'system') {
    // Auto-advance
    isValid = true;
  } else if (input_type === 'end') {
    // Cannot advance past end
    return {
      nextState: currentState,
      replyText: "Your assessment is already complete. Reply RESTART to begin again.",
      updatedData,
      isComplete: true
    };
  }

  if (!isValid) {
    return {
      nextState: currentState,
      replyText: stateConfig.invalid_message || "I did not recognise that answer. Please try again.",
      updatedData,
      isComplete: false
    };
  }

  // Save data
  if (stateConfig.save_to) {
    if (stateConfig.save_to === 'lead.first_name') updatedData.name = parsedValue;
    if (stateConfig.save_to === 'lead.state') updatedData.state = parsedValue;
    if (stateConfig.save_to === 'lead.email') updatedData.email = parsedValue;
  }
  if (stateConfig.question_code) {
    updatedData.answers[stateConfig.question_code] = {
      value: parsedValue,
      raw_input: input,
      risk_value: riskValue
    };
  }

  // Determine next state
  let nextState = stateConfig.next_state;

  if (transitions && transitions[input]) {
    nextState = transitions[input].next_state;
    // MVP: execute action string flags if needed, e.g. updatedData.action = transitions[input].action
    if (transitions[input].action === 'record_assessment_consent') updatedData.consent = true;
    if (transitions[input].action === 'send_whatsapp_report') updatedData.report_delivery = 'whatsapp';
    if (transitions[input].action === 'send_whatsapp_and_email_report') updatedData.report_delivery = 'email';
    if (transitions[input].action === 'create_opportunity_whatsapp') updatedData.contact_preference = 'WhatsApp';
    if (transitions[input].action === 'create_opportunity_phone') updatedData.contact_preference = 'Phone';
    if (transitions[input].action === 'create_opportunity_any') updatedData.contact_preference = 'Either';
  } else if (input_type === 'email' && input === 'SKIP' && stateConfig.skip_state) {
    nextState = stateConfig.skip_state;
  } else if (branch_rules) {
    const branchResult = evaluateBranchRules(branch_rules, input, updatedData.answers);
    if (branchResult) nextState = branchResult;
  }

  // Get next message
  const nextStateConfig = flow.states.find(s => s.state === nextState);
  let replyText = '';
  let isComplete = false;
  
  if (nextStateConfig) {
    replyText = renderMessage(nextStateConfig.message, updatedData);
    if (nextStateConfig.input_type === 'system') {
      // Auto-advance if the next state is a system state (like FAM_PROCESSING)
      // Actually, since webhook sends one reply, we should just send the system message, and the NEXT incoming message triggers the transition.
      // But user doesn't reply to a system message usually. 
      // For MVP, if they reach a system message, we return the text, and set a flag or just transition to its next_state.
      if (nextStateConfig.state === 'FAM_PROCESSING') {
        if (nextStateConfig.action === 'calculate_score_and_send_result') {
          const { calculateFamilyProtectionResult } = require('./familyProtectionScoring');
          try {
            const payload = calculateFamilyProtectionResult(updatedData.answers);
            
            // Generate metadata for the report
            const now = new Date();
            const yearStr = now.getFullYear();
            const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
            payload.first_name = updatedData.name || 'Friend';
            payload.assessment_date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            payload.report_id = `CSR-FAM-${yearStr}-${randomHex}`;
            
            updatedData.report_payload = payload;

            // Generate token and save to database
            const token = crypto.randomUUID();
            const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
            const reportId = crypto.randomUUID();
            
            // Assume lead_id exists in updatedData. If not, use null or 0.
            const leadId = updatedData.lead_id || 0; 
            
            updatedData.report_url = `${process.env.BASE_URL || 'http://localhost:3016'}/reports/${token}`;

            try {
              await run(
                'INSERT INTO reports (id, lead_id, template_code, payload, token, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
                [reportId, leadId, flow.assessment_template.id, JSON.stringify(payload), token, expiresAt]
              );
            } catch (dbErr) {
              console.error("Warning: Could not save report to DB (likely test environment missing lead):", dbErr.message);
            }

          } catch (err) {
            console.error("Error calculating family protection result or saving report:", err);
          }
        }
        
        const followUpState = flow.states.find(s => s.state === nextStateConfig.next_state);
        replyText += "\n\n---\n\n" + renderMessage(followUpState.message, updatedData);
        nextState = followUpState.state;
      }
    } else if (nextStateConfig.input_type === 'end') {
      isComplete = true;
    }
  } else {
    // End of flow
    replyText = "Thank you. Your assessment is complete.";
    isComplete = true;
  }

  return { nextState, replyText, updatedData, isComplete };
}

function renderMessage(messageTemplate, data) {
  let msg = messageTemplate;
  if (msg.includes('{{lead.first_name}}')) {
    msg = msg.replace(/\{\{lead\.first_name\}\}/g, data.name || 'there');
  }
  if (msg.includes('{{report_url}}')) {
    msg = msg.replace(/\{\{report_url\}\}/g, data.report_url || '');
  }
  return msg;
}

module.exports = {
  getFlow,
  processState
};
