const { getFlow, processState } = require('./src/services/conversationEngine');

const flow = getFlow('family_protection');

let currentState = flow.assessment_template.initial_state;
let currentData = { answers: {} };

const inputs = [
  "START", // welcome -> consent
  "1",     // consent -> name
  "Ayo",   // name -> state
  "Lagos", // state -> q1 (dependents)
  "1",     // q1 (0 dependent) -> q2 (household dependence)
  "4",     // q2 -> q3 (continuity)
  "2",     // q3 -> q4 (life)
  "4",     // q4 -> q5 (health)
  "4",     // q5 -> skipped family health directly to emergency fund (q7)
  "3",     // q7 -> skipped education responsibility directly to email option
  "2",     // email option (NO) -> processing
  "anything", // processing (auto advance) -> report delivery
  "1",     // report delivery -> advisor consent
  "2",     // advisor consent (Not Now) -> complete
];

console.log("=== STARTING SIMULATION 2 ===");
console.log("Initial State:", currentState);
let nextConfig = flow.states.find(s => s.state === currentState);
console.log("Bot:", nextConfig.message);

for (const input of inputs) {
  console.log("\nUser:", input);
  
  const result = processState(flow, currentState, input, currentData);
  currentState = result.nextState;
  currentData = result.updatedData;
  
  console.log("Bot:", result.replyText);
  if (result.isComplete) {
    console.log("--- FLOW COMPLETE ---");
    break;
  }
}

console.log("\nFinal Data State:", JSON.stringify(currentData, null, 2));
