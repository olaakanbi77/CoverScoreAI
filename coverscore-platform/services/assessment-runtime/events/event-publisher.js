// Event Publisher — every runtime action publishes an event
// Node-RED subscribes to these events for side-effects
const db = require('../../../database/schemas');
const { RUNTIME_EVENTS } = require('../types');

class EventPublisher {
  async publish(sessionId, eventType, data = {}) {
    const event = {
      session_id: sessionId,
      event_type: eventType,
      data: JSON.stringify(data),
      source: 'qpre'
    };

    try {
      await db.query(
        `INSERT INTO events (session_id, event_type, data, source) VALUES ($1, $2, $3, $4)`,
        [event.session_id, event.event_type, event.data, event.source]
      );
    } catch (err) {
      console.error(`[events] Failed to publish ${eventType}:`, err.message);
    }

    // Also emit to Node-RED if global event bus exists
    if (global.eventBus && typeof global.eventBus.emit === 'function') {
      global.eventBus.emit(eventType, { sessionId, ...data });
    }
  }

  assessmentStarted(sessionId, packId, channel) {
    return this.publish(sessionId, RUNTIME_EVENTS.ASSESSMENT_STARTED, { packId, channel });
  }

  questionDisplayed(sessionId, questionId) {
    return this.publish(sessionId, RUNTIME_EVENTS.QUESTION_DISPLAYED, { questionId });
  }

  answerReceived(sessionId, questionId, value) {
    return this.publish(sessionId, RUNTIME_EVENTS.ANSWER_RECEIVED, { questionId, value });
  }

  answerValidated(sessionId, questionId, valid) {
    return this.publish(sessionId, RUNTIME_EVENTS.ANSWER_VALIDATED, { questionId, valid });
  }

  answerInvalid(sessionId, questionId, reason) {
    return this.publish(sessionId, RUNTIME_EVENTS.ANSWER_INVALID, { questionId, reason });
  }

  questionCompleted(sessionId, questionId, answerValue, score) {
    return this.publish(sessionId, RUNTIME_EVENTS.QUESTION_COMPLETED, { questionId, answerValue, score });
  }

  sectionStarted(sessionId, sectionId, sectionName) {
    return this.publish(sessionId, RUNTIME_EVENTS.SECTION_STARTED, { sectionId, sectionName });
  }

  sectionCompleted(sessionId, sectionId, sectionName) {
    return this.publish(sessionId, RUNTIME_EVENTS.SECTION_COMPLETED, { sectionId, sectionName });
  }

  assessmentCompleted(sessionId, packId) {
    return this.publish(sessionId, RUNTIME_EVENTS.ASSESSMENT_COMPLETED, { packId });
  }

  scoringTriggered(sessionId, score) {
    return this.publish(sessionId, RUNTIME_EVENTS.SCORING_TRIGGERED, { score });
  }
}

module.exports = new EventPublisher();
