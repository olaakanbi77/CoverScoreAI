// Question Loader — resolves and loads individual question + options
const questionRepo = require('../repositories/question.repository');
const packLoader = require('./question-pack.loader');

class QuestionLoader {
  async load(questionId) {
    const question = await questionRepo.getFullQuestion(questionId);
    if (!question) throw new Error(`Question '${questionId}' not found`);
    return question;
  }

  async resolveNextQuestion(packId, currentQuestionId, answerValue) {
    const pack = await packLoader.load(packId);
    const adjacency = pack.adjacencyList[currentQuestionId];

    // 1. Check option-level next_question (graph edge)
    if (adjacency && adjacency[answerValue]) {
      const targetId = adjacency[answerValue];
      const target = pack.questionMap[targetId];
      if (target) return target;
    }

    // 2. Check branch rules
    const rules = await questionRepo.getBranchRules(currentQuestionId);
    for (const rule of rules) {
      if (this._matchRule(rule, answerValue)) {
        const target = pack.questionMap[rule.next_question];
        if (target) return target;
      }
    }

    // 3. Fall through to natural next in section
    return this._getNextInSection(pack, currentQuestionId);
  }

  _matchRule(rule, answerValue) {
    switch (rule.operator) {
      case '=':
        return rule.value === answerValue;
      case '!=':
        return rule.value !== answerValue;
      case 'in': {
        const values = rule.value.split(',').map(v => v.trim());
        return values.includes(answerValue);
      }
      case 'regex':
        return new RegExp(rule.value).test(answerValue);
      default:
        return false;
    }
  }

  _getNextInSection(pack, currentQuestionId) {
    const current = pack.questionMap[currentQuestionId];
    if (!current) return null;

    const sectionId = current.section_id;
    const sectionQuestions = pack.questions.filter(
      q => q.section_id === sectionId
    ).sort((a, b) => a.sequence - b.sequence);

    const currentIdx = sectionQuestions.findIndex(q => q.id === currentQuestionId);
    if (currentIdx !== -1 && currentIdx + 1 < sectionQuestions.length) {
      return sectionQuestions[currentIdx + 1];
    }

    // Move to next section
    const sections = pack.sections;
    const currentSectionIdx = sections.findIndex(s => s.id === sectionId);
    if (currentSectionIdx !== -1 && currentSectionIdx + 1 < sections.length) {
      const nextSection = sections[currentSectionIdx + 1];
      const nextQuestions = pack.questions.filter(
        q => q.section_id === nextSection.id
      ).sort((a, b) => a.sequence - b.sequence);
      if (nextQuestions.length) return nextQuestions[0];
    }

    // No more questions
    return null;
  }
}

module.exports = new QuestionLoader();
