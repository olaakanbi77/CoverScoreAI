// Branch Engine — determines next question from rules
// KNOWS: current question + answer → next question
// DOES NOT KNOW: scoring, state, reports

class BranchEngine {
  // Evaluate branch rules for a given question + answer value
  // Rules are stored as JSONB on the question record:
  // [ { ifValue: "yes", nextQuestion: "QP-100-005" },
  //   { ifValue: "no",  nextQuestion: "QP-100-008" },
  //   { default: "QP-100-002" } ]
  evaluate(rules, answerValue) {
    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return null; // caller should use natural next
    }

    // Check explicit value-based rules first
    for (const rule of rules) {
      if (rule.ifValue && rule.ifValue === answerValue) {
        return rule.nextQuestion || null;
      }
      if (rule.ifValues && Array.isArray(rule.ifValues) && rule.ifValues.includes(answerValue)) {
        return rule.nextQuestion || null;
      }
      if (rule.ifSkip && rule.ifSkip.includes(answerValue)) {
        return { skip: true, nextQuestion: rule.nextQuestion || null };
      }
    }

    // Check for a default rule
    const defaultRule = rules.find(r => r.default !== undefined);
    if (defaultRule) return defaultRule.default;

    return null;
  }

  // Determine next question in the pack
  // Returns: { questionId: string | null, done: boolean, skipped: string[] }
  getNextQuestion(questions, currentQuestionId, answerValue, answeredIds) {
    const current = questions.find(q => q.id === currentQuestionId);
    if (!current) {
      // Start from first unanswered question
      const unanswered = questions.filter(q => !answeredIds.has(q.id));
      return unanswered.length
        ? { questionId: unanswered[0].id, done: false, skipped: [] }
        : { questionId: null, done: true, skipped: [] };
    }

    const branchResult = this.evaluate(current.branch_rules, answerValue);
    const skipped = [];

    if (branchResult && branchResult.skip) {
      skipped.push(currentQuestionId);
      if (branchResult.nextQuestion && !answeredIds.has(branchResult.nextQuestion)) {
        return { questionId: branchResult.nextQuestion, done: false, skipped };
      }
    }

    if (branchResult && typeof branchResult === 'string' && !answeredIds.has(branchResult)) {
      return { questionId: branchResult, done: false, skipped };
    }

    // Fall through to natural next unanswered question
    const remaining = questions.filter(
      q => !answeredIds.has(q.id) && q.id !== currentQuestionId
    );

    if (remaining.length === 0) {
      return { questionId: null, done: true, skipped };
    }

    // If we have a target from branch, try to find it
    if (branchResult && typeof branchResult === 'string') {
      const target = remaining.find(q => q.id === branchResult);
      if (target) return { questionId: target.id, done: false, skipped };
    }

    // Natural order: return the next unanswered in sequence
    // First, find the current question's sequence position
    const currentIdx = questions.findIndex(q => q.id === currentQuestionId);
    if (currentIdx !== -1) {
      for (let i = currentIdx + 1; i < questions.length; i++) {
        if (!answeredIds.has(questions[i].id)) {
          return { questionId: questions[i].id, done: false, skipped };
        }
      }
    }

    return { questionId: null, done: true, skipped };
  }
}

module.exports = new BranchEngine();
