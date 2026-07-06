const path = require('path');
const fs = require('fs');

const TEMPLATES_DIR = path.resolve(__dirname, '../../../knowledge/templates');

const templateCache = new Map();

function loadTemplateJson(templateId) {
  if (templateCache.has(templateId)) return templateCache.get(templateId);

  const fileMap = { 'MPAT-001': 'mpat.json', 'MBAT-001': 'mbat.json' };
  const filename = fileMap[templateId];
  if (!filename) throw new Error(`Unknown master template: ${templateId}`);

  const filePath = path.join(TEMPLATES_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const template = JSON.parse(raw);
  templateCache.set(templateId, template);
  return template;
}

function replaceInjectMarkers(packQuestions, discoveryQuestions, finalSectionId, checkpointAfter, checkpointQuestionId, reportQuestionId) {
  const injectMarkers = { QP_INJECT_DISCOVERY: true, QP_INJECT_FINAL: true };

  const firstBatch = discoveryQuestions.slice(0, checkpointAfter);
  const secondBatch = discoveryQuestions.slice(checkpointAfter);

  const allQuestions = [];
  let discoveryInjected = false;
  let finalInjected = false;

  for (const q of packQuestions) {
    const hasMarker = q.options &&
      q.options.some(o => o.next_question && injectMarkers[o.next_question]);

    if (!hasMarker) {
      allQuestions.push(JSON.parse(JSON.stringify(q)));
      continue;
    }

    const injectedBatch = q.options[0].next_question === 'QP_INJECT_FINAL' ? secondBatch : firstBatch;
    const isFinal = q.options[0].next_question === 'QP_INJECT_FINAL';
    const batchSectionId = isFinal ? 'SEC-MPAT-FINAL' : 'SEC-MPAT-DISCOVERY';
    const nextInjectionTarget = isFinal ? reportQuestionId : checkpointQuestionId;

    if ((isFinal && finalInjected) || (!isFinal && discoveryInjected)) continue;

    const markerIndex = allQuestions.indexOf(q);
    for (const opt of q.options) {
      if (opt.next_question && injectMarkers[opt.next_question]) {
        if (injectedBatch.length > 0) {
          opt.next_question = injectedBatch[0].id;
        } else {
          opt.next_question = nextInjectionTarget;
        }
      }
    }
    allQuestions.push(JSON.parse(JSON.stringify(q)));
    const qWithOpt = allQuestions[allQuestions.length - 1];
    if (qWithOpt.options && injectedBatch.length > 0) {
      qWithOpt.options[qWithOpt.options.length - 1].next_question = injectedBatch[0].id;
    }

    for (let i = 0; i < injectedBatch.length; i++) {
      const dq = JSON.parse(JSON.stringify(injectedBatch[i]));
      dq.section_id = batchSectionId;

      if (!dq.options) dq.options = [];
      for (const opt of dq.options) {
        if (i + 1 < injectedBatch.length) {
          opt.next_question = injectedBatch[i + 1].id;
        } else {
          opt.next_question = nextInjectionTarget;
        }
        if (opt.score === undefined) opt.score = 0;
      }
      allQuestions.push(dq);
    }

    if (isFinal) finalInjected = true;
    else discoveryInjected = true;
  }

  return allQuestions;
}

function merge(packData) {
  const { pack: qpPack, discovery_questions } = packData;
  if (!qpPack.master_template) {
    throw new Error(`Question pack '${qpPack.id}' has no master_template set`);
  }

  const template = loadTemplateJson(qpPack.master_template);
  const sections = JSON.parse(JSON.stringify(template.sections));
  const checkpointAfter = qpPack.checkpoint_after || 4;

  const discoverySection = sections.find(s => s.inject === true && s.type === 'discovery');
  const finalSection = sections.find(s => s.stage === 'FINAL_DISCOVERY');

  const checkpointQuestion = template.questions.find(q => q.section_id === 'SEC-MPAT-CHECKPOINT');
  const reportQuestion = template.questions.find(q => q.section_id === 'SEC-MPAT-REPORT');

  const firstDiscovery = (discovery_questions || [])[0];
  const checkpointAt = Math.min(checkpointAfter, (discovery_questions || []).length);
  const firstFinal = (discovery_questions || [])[checkpointAt];

  const mergedQuestions = replaceInjectMarkers(
    template.questions,
    discovery_questions || [],
    finalSection ? 'SEC-MPAT-FINAL' : 'SEC-MPAT-DISCOVERY',
    checkpointAfter,
    checkpointQuestion ? checkpointQuestion.id : 'MPAT-050',
    reportQuestion ? reportQuestion.id : 'MPAT-060'
  );

  const packOverrides = {};
  const overrideFields = ['name', 'description', 'pillars', 'categories', 'modifiers'];
  for (const field of overrideFields) {
    if (qpPack[field]) packOverrides[field] = qpPack[field];
  }

  if (firstDiscovery) {
    const discSec = sections.find(s => s.inject === true && s.type === 'discovery');
    if (discSec) discSec.entry_question = firstDiscovery.id;
  }
  if (firstFinal) {
    const finalSec = sections.find(s => s.stage === 'FINAL_DISCOVERY');
    if (finalSec) finalSec.entry_question = firstFinal.id;
  }

  const mergedPack = {
    id: qpPack.id,
    code: qpPack.code,
    name: qpPack.name,
    description: qpPack.description,
    version: qpPack.version || template.version,
    status: qpPack.status || template.status,
    type: qpPack.type || template.type,
    master_template: qpPack.master_template,
    ...packOverrides
  };

  return { pack: mergedPack, sections, questions: mergedQuestions };
}

function invalidateCache(templateId) {
  templateCache.delete(templateId);
}

function clearCache() {
  templateCache.clear();
}

module.exports = { merge, invalidateCache, clearCache };
