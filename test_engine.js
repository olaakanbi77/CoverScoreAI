const { getFlow, processState } = require('./src/services/conversationEngine');

const flow = getFlow('family_protection');

let currentState = flow.assessment_template.initial_state;
let currentData = { answers: {} };

const inputs = [
  "START", // welcome -> consent
  "1",     // consent -> name
  "Ayo",   // name -> state
  "Lagos", // state -> q1 (dependents)
  "2",     // q1 (1 dependent) -> q2 (household dependence)
  "4",     // q2 -> q3 (continuity)
  "2",     // q3 -> q4 (life)
  "4",     // q4 -> q5 (health)
  "4",     // q5 -> q6 (family health - branched because dependents != 0)
  "3",     // q6 -> q7 (emergency)
  "4",     // q7 -> q8 (education - branched because dependents != 0)
  "2",     // q8 -> q9 (education continuity)
  "4",     // q9 -> email option
  "1",     // email option -> email capture
  "ayo@example.com", // email capture -> processing
  "anything", // processing (auto advance) -> report delivery
  "1",     // report delivery -> advisor consent
  "1",     // advisor consent -> contact preference
  "1"      // contact preference -> complete
];

console.log("=== STARTING SIMULATION ===");
console.log("Initial State:", currentState);
let nextConfig = flow.states.find(s => s.state === currentState);
console.log("Bot:", nextConfig.message);

(async () => {
  for (const input of inputs) {
    console.log(`User: ${input}`);
    const result = await processState(flow, currentState, input, currentData);
    currentState = result.nextState;
    currentData = result.updatedData;
    console.log(`Bot: ${result.replyText}\n`);
    if (result.isComplete) break;
  }
  console.log(`--- FLOW COMPLETE ---`);
  console.log(`\nFinal Data State:`, JSON.stringify(currentData, null, 2));
})();
