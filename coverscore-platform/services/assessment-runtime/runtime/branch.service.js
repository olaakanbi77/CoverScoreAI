// Branch Service — graph-based question routing
// Traverses the directed graph: question → answer → next question

const questionLoader = require('../loaders/question.loader');
const packLoader = require('../loaders/question-pack.loader');

class BranchService {
  // Determine next question after an answer is recorded
  async resolveNext(sessionId, packId, currentQuestionId, answerValue) {
    const pack = await packLoader.load(packId);
    const adjacency = pack.adjacencyList[currentQuestionId];

    // Step 1: Direct graph edge from option.next_question
    if (adjacency && adjacency[answerValue]) {
      const targetId = adjacency[answerValue];
      // null targetId means explicitly terminal for this path
      if (targetId === null) return { questionId: null, done: true };
      return { questionId: targetId, done: false };
    }

    // Step 2: Evaluate branch_rules table
    const rules = pack.questions.find(q => q.id === currentQuestionId)?.branchRules || [];
    for (const rule of rules.sort((a, b) => a.priority - b.priority)) {
      if (this._matchRule(rule, answerValue)) {
        return { questionId: rule.next_question, done: false };
      }
    }

    // Step 3: Natural next in section (sequential fallback)
    const next = await questionLoader.resolveNextQuestion(packId, currentQuestionId, answerValue);
    if (!next) return { questionId: null, done: true };

    return { questionId: next.id, done: false };
  }

  // Determine if the question is terminal (no more questions after it)
  async isTerminal(packId, questionId) {
    const pack = await packLoader.load(packId);
    const question = pack.questionMap[questionId];
    if (!question) return true;

    // Terminal if all options point to null
    const allNull = question.options.every(o => !o.next_question);
    if (allNull) return true;

    return false;
  }

  _matchRule(rule, answerValue) {
    switch (rule.operator) {
      case '=': return rule.value === answerValue;
      case '!=': return rule.value !== answerValue;
      case 'in': return rule.value.split(',').map(v => v.trim()).includes(answerValue);
      case 'regex': return new RegExp(rule.value).test(answerValue);
      default: return false;
    }
  }
}

module.exports = new BranchService();
