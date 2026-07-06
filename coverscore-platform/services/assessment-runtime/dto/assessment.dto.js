// Assessment DTOs — request/response shapes for the v1 API

class StartAssessmentRequest {
  constructor(data) {
    this.questionPack = data.questionPack || data.packId || 'QP-100';
    this.channel = data.channel || 'whatsapp';
    this.customerId = data.customerId || null;
    this.phone = data.phone || null;
    this.name = data.name || null;
  }
}

class StartAssessmentResponse {
  constructor(session, firstQuestion) {
    this.sessionId = session.id;
    this.packId = session.pack_id;
    this.phase = session.state;
    this.firstQuestion = firstQuestion ? {
      id: firstQuestion.id,
      text: firstQuestion.text,
      helpText: firstQuestion.help_text || null,
      type: firstQuestion.question_type || 'choice',
      options: (firstQuestion.options || []).map(o => ({
        id: o.id,
        text: o.text,
        value: o.value
      }))
    } : null;
  }
}

class ReplyRequest {
  constructor(data) {
    this.sessionId = data.sessionId;
    this.answer = data.answer;
    this.questionId = data.questionId || null;
    this.confidence = data.confidence || 100;
  }
}

class ReplyResponse {
  constructor(result) {
    this.sessionId = result.sessionId;
    this.phase = result.phase;
    this.done = result.done || false;
    this.answered = result.answered || null;
    this.next = result.next || null;
    this.score = result.score || null;
    this.report = result.report || null;
  }
}

class SessionStateResponse {
  constructor(session, activeState, answeredCount, score) {
    this.sessionId = session.id;
    this.packId = session.pack_id;
    this.phase = session.state;
    this.currentQuestion = activeState?.current_question || null;
    this.currentSection = activeState?.current_section || null;
    this.answered = answeredCount;
    this.progress = {
      answered: answeredCount,
      total: 0 // populated if pack questions known
    };
    this.startedAt = session.started_at;
    this.completedAt = session.completed_at;
    this.score = score || null;
  }
}

class CompleteResponse {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.status = 'completed';
    this.message = 'Assessment complete';
  }
}

module.exports = {
  StartAssessmentRequest,
  StartAssessmentResponse,
  ReplyRequest,
  ReplyResponse,
  SessionStateResponse,
  CompleteResponse
};
