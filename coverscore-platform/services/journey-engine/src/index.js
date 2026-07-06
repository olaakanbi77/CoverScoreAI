// Journey Engine — post-assessment journey orchestration
// Evaluates triggers, starts journeys, progresses steps, tracks completion

const db = require('../../../database/schemas');

class JourneyEngine {
  // Evaluate trigger rules against assessment results and return matched journeys
  async evaluateTriggers(sessionId, scoreResult) {
    const session = await db.query('SELECT * FROM conversation_sessions WHERE id = $1', [sessionId]);
    if (!session.rows.length) throw new Error('Session not found');

    const journeysRes = await db.query(
      `SELECT * FROM journey_definitions WHERE pack_id = $1 AND active = true ORDER BY priority`,
      [session.rows[0].pack_id]
    );

    const matched = [];
    for (const journey of journeysRes.rows) {
      const rules = journey.trigger_rules || [];
      for (const rule of rules) {
        if (this._evaluateRule(rule, scoreResult)) {
          matched.push(journey);
          break;
        }
      }
    }

    return matched;
  }

  // Start a customer journey
  async startJourney(sessionId, customerId, journeyId) {
    // Check if already active
    const existing = await db.query(
      `SELECT * FROM customer_journeys
       WHERE customer_id = $1 AND journey_id = $2 AND status = 'active'`,
      [customerId, journeyId]
    );
    if (existing.rows.length) return existing.rows[0];

    // Get journey steps count
    const stepsRes = await db.query(
      'SELECT COUNT(*) as count FROM journey_steps WHERE journey_id = $1',
      [journeyId]
    );

    // Create customer journey
    const res = await db.query(
      `INSERT INTO customer_journeys (session_id, customer_id, journey_id, status, current_step)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sessionId, customerId, journeyId, 'active', 0]
    );

    const journey = res.rows[0];

    // Create progress records for all steps
    const steps = await db.query(
      'SELECT * FROM journey_steps WHERE journey_id = $1 ORDER BY sequence',
      [journeyId]
    );

    for (const step of steps.rows) {
      await db.query(
        `INSERT INTO journey_progress (customer_journey_id, step_id, step_sequence, status)
         VALUES ($1, $2, $3, $4)`,
        [journey.id, step.id, step.sequence, step.sequence === 0 ? 'available' : 'pending']
      );
    }

    // Log event
    await db.query(
      `INSERT INTO events (session_id, customer_id, event_type, data, source)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, customerId, 'journey.started', JSON.stringify({ journeyId }), 'journey-engine']
    );

    return journey;
  }

  // Auto-start all triggered journeys for a session
  async autoStartJourneys(sessionId, customerId, scoreResult) {
    const matched = await this.evaluateTriggers(sessionId, scoreResult);
    const started = [];

    for (const journey of matched) {
      const instance = await this.startJourney(sessionId, customerId, journey.id);
      started.push(instance);
    }

    return started;
  }

  // Get current available step for a customer journey
  async getCurrentStep(customerJourneyId) {
    const cj = await db.query('SELECT * FROM customer_journeys WHERE id = $1', [customerJourneyId]);
    if (!cj.rows.length) throw new Error('Customer journey not found');

    const progress = await db.query(
      `SELECT jp.*, js.step_type, js.title, js.content, js.delay_hours, js.branch_rules
       FROM journey_progress jp
       JOIN journey_steps js ON jp.step_id = js.id
       WHERE jp.customer_journey_id = $1 AND jp.status = 'available'
       ORDER BY jp.step_sequence
       LIMIT 1`,
      [customerJourneyId]
    );

    if (!progress.rows.length) return null;

    const step = progress.rows[0];
    return {
      progressId: step.id,
      stepId: step.step_id,
      sequence: step.step_sequence,
      type: step.step_type,
      title: step.title,
      content: step.content,
      journeyId: customerJourneyId
    };
  }

  // Mark a step as sent (communicated to customer)
  async markSent(progressId) {
    await db.query(
      `UPDATE journey_progress SET status = 'sent', sent_at = now() WHERE id = $1`,
      [progressId]
    );
  }

  // Complete a step and advance to the next
  async completeStep(customerJourneyId, progressId, action = {}) {
    const progress = await db.query('SELECT * FROM journey_progress WHERE id = $1', [progressId]);
    if (!progress.rows.length) throw new Error('Progress record not found');

    // Mark current step completed
    await db.query(
      `UPDATE journey_progress
       SET status = 'completed', action_taken = $1, completed_at = now()
       WHERE id = $2`,
      [JSON.stringify(action), progressId]
    );

    // Get the step's branch rules to determine next step
    const step = await db.query(
      'SELECT * FROM journey_steps WHERE id = $1',
      [progress.rows[0].step_id]
    );

    let nextSequence = progress.rows[0].step_sequence + 1;

    // Evaluate branch rules
    const branchRules = step.rows[0]?.branch_rules || [];
    const customerJourney = await db.query(
      'SELECT * FROM customer_journeys WHERE id = $1',
      [customerJourneyId]
    );

    for (const rule of branchRules) {
      if (rule.default) {
        nextSequence = rule.next_sequence;
        break;
      }
      if (rule.if_response && action.response === rule.if_response) {
        nextSequence = rule.next_sequence;
        if (rule.delay_hours) {
          // Update step delay
          await this._applyDelay(nextSequence, rule.delay_hours);
        }
        break;
      }
    }

    // Update customer journey current step
    await db.query(
      'UPDATE customer_journeys SET current_step = $1, updated_at = now() WHERE id = $2',
      [nextSequence, customerJourneyId]
    );

    // Make next step available
    const nextProgress = await db.query(
      `SELECT id FROM journey_progress
       WHERE customer_journey_id = $1 AND step_sequence = $2`,
      [customerJourneyId, nextSequence]
    );

    if (nextProgress.rows.length) {
      await db.query(
        `UPDATE journey_progress SET status = 'available' WHERE id = $1`,
        [nextProgress.rows[0].id]
      );
      return { nextProgressId: nextProgress.rows[0].id, nextSequence };
    }

    // No more steps — complete the journey
    await this.completeJourney(customerJourneyId);
    return { nextProgressId: null, nextSequence: null, journeyComplete: true };
  }

  // Cancel a journey
  async cancelJourney(customerJourneyId) {
    await db.query(
      "UPDATE customer_journeys SET status = 'cancelled', completed_at = now() WHERE id = $1",
      [customerJourneyId]
    );
    await db.query(
      "UPDATE journey_progress SET status = 'skipped' WHERE customer_journey_id = $1 AND status = 'pending'",
      [customerJourneyId]
    );
  }

  // Complete a journey
  async completeJourney(customerJourneyId) {
    await db.query(
      "UPDATE customer_journeys SET status = 'completed', completed_at = now() WHERE id = $1",
      [customerJourneyId]
    );

    const cj = await db.query('SELECT * FROM customer_journeys WHERE id = $1', [customerJourneyId]);
    if (cj.rows.length) {
      await db.query(
        `INSERT INTO events (session_id, customer_id, event_type, data, source)
         VALUES ($1, $2, $3, $4, $5)`,
        [cj.rows[0].session_id, cj.rows[0].customer_id, 'journey.completed',
         JSON.stringify({ customerJourneyId }), 'journey-engine']
      );
    }
  }

  // Get all active journeys for a customer
  async getActiveJourneys(customerId) {
    const res = await db.query(
      `SELECT cj.*, jd.code, jd.name, jd.description
       FROM customer_journeys cj
       JOIN journey_definitions jd ON cj.journey_id = jd.id
       WHERE cj.customer_id = $1 AND cj.status = 'active'
       ORDER BY cj.started_at`,
      [customerId]
    );
    return res.rows;
  }

  // Get full journey state for a customer
  async getJourneyState(customerJourneyId) {
    const cj = await db.query('SELECT * FROM customer_journeys WHERE id = $1', [customerJourneyId]);
    if (!cj.rows.length) return null;

    const definition = await db.query('SELECT * FROM journey_definitions WHERE id = $1', [cj.rows[0].journey_id]);
    const progress = await db.query(
      `SELECT jp.*, js.step_type, js.title
       FROM journey_progress jp
       JOIN journey_steps js ON jp.step_id = js.id
       WHERE jp.customer_journey_id = $1
       ORDER BY jp.step_sequence`,
      [customerJourneyId]
    );

    return {
      journey: cj.rows[0],
      definition: definition.rows[0] || null,
      progress: progress.rows,
      currentStep: progress.rows.find(p => p.status === 'available') || null
    };
  }

  // Seed journey definitions into the database
  async seedJourneys(journeyDefs) {
    for (const j of journeyDefs) {
      const existing = await db.query('SELECT id FROM journey_definitions WHERE code = $1', [j.code]);
      let journeyId;

      if (existing.rows.length) {
        await db.query(
          `UPDATE journey_definitions SET name = $1, description = $2, trigger_rules = $3,
           priority = $4, updated_at = now() WHERE code = $5`,
          [j.name, j.description, JSON.stringify(j.trigger_rules), j.priority, j.code]
        );
        journeyId = existing.rows[0].id;

        // Remove old steps
        await db.query('DELETE FROM journey_steps WHERE journey_id = $1', [journeyId]);
      } else {
        const res = await db.query(
          `INSERT INTO journey_definitions (code, name, description, trigger_rules, priority, pack_id)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [j.code, j.name, j.description, JSON.stringify(j.trigger_rules), j.priority, j.pack_id || null]
        );
        journeyId = res.rows[0].id;
      }

      // Insert steps
      for (const step of j.steps) {
        await db.query(
          `INSERT INTO journey_steps (journey_id, sequence, step_type, title, content, delay_hours, branch_rules)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            journeyId, step.sequence, step.step_type, step.title,
            JSON.stringify(step.content), step.delay_hours || 0,
            JSON.stringify(step.branch_rules || [])
          ]
        );
      }
    }
  }

  // -- Private --

  _evaluateRule(rule, scoreResult) {
    if (rule.type === 'always') return true;

    if (rule.type === 'condition') {
      if (rule.field === 'riskLevel') {
        return this._evaluateField(scoreResult.riskLevel, rule.operator || '=', rule.value);
      }
      if (rule.field === 'protectionGap') {
        return this._evaluateField(scoreResult.protectionGap, rule.operator || '>=', parseInt(rule.value));
      }
      if (rule.field === 'score') {
        return this._evaluateField(scoreResult.score, rule.operator || '<=', parseInt(rule.value));
      }
      if (rule.field === 'question') {
        return this._evaluateQuestionTrigger(scoreResult, rule);
      }
    }
    return false;
  }

  _evaluateField(actual, operator, expected) {
    switch (operator) {
      case '=': return actual === expected;
      case '!=': return actual !== expected;
      case '>': return actual > expected;
      case '>=': return actual >= expected;
      case '<': return actual < expected;
      case '<=': return actual <= expected;
      case 'in': {
        const vals = String(expected).split(',').map(v => v.trim());
        return vals.includes(String(actual));
      }
      default: return false;
    }
  }

  _evaluateQuestionTrigger(scoreResult, rule) {
    const qId = rule.questionId;
    const answers = scoreResult.identifiedRisks || [];
    const found = answers.find(r => r.category === qId || r.area === qId);
    if (!found) return false;
    return this._evaluateField(found.score, '<=', 50);
  }

  async _applyDelay(sequence, hours) {
    // Mark step for delayed availability
    // Implementation: update step metadata with delay
  }
}

module.exports = new JourneyEngine();
