// Question Pack Loader — loads and caches full pack definitions
const questionRepo = require('../repositories/question.repository');

class QuestionPackLoader {
  constructor() {
    this._cache = new Map();
  }

  async load(packId) {
    if (this._cache.has(packId)) {
      return this._cache.get(packId);
    }

    const pack = await questionRepo.getFullPack(packId);
    if (!pack) throw new Error(`Question pack '${packId}' not found or inactive`);

    // Build section map for quick lookup
    const sectionMap = {};
    for (const s of pack.sections) {
      sectionMap[s.id] = s;
    }

    // Build question map for quick lookup
    const questionMap = {};
    for (const q of pack.questions) {
      questionMap[q.id] = q;
    }

    // Build adjacency list from options (graph edges)
    const adjacencyList = {};
    for (const q of pack.questions) {
      adjacencyList[q.id] = {};
      for (const opt of q.options) {
        adjacencyList[q.id][opt.value] = opt.next_question || null;
      }
    }

    const result = {
      pack: pack.pack,
      sections: pack.sections,
      questions: pack.questions,
      sectionMap,
      questionMap,
      adjacencyList,
      totalQuestions: pack.questions.length
    };

    this._cache.set(packId, result);
    return result;
  }

  invalidateCache(packId) {
    this._cache.delete(packId);
  }

  clearCache() {
    this._cache.clear();
  }
}

module.exports = new QuestionPackLoader();
