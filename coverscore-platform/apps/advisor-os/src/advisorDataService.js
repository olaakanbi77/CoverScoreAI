// Advisor Data Service — aggregates assessment, journey, and customer data for advisors
const db = require('../../../database/schemas');

class AdvisorDataService {
  // ── Dashboard ──────────────────────────────────────────

  async getDashboardStats() {
    const totalCustomers = (await db.query('SELECT COUNT(*) as c FROM customers')).rows[0].c;
    const totalAssessments = (await db.query('SELECT COUNT(*) as c FROM conversation_sessions')).rows[0].c;
    const assessmentsToday = (await db.query("SELECT COUNT(*) as c FROM conversation_sessions WHERE started_at::date = now()::date")).rows[0].c;
    const activeJourneys = (await db.query("SELECT COUNT(*) as c FROM customer_journeys WHERE status = 'active'")).rows[0].c;
    const pendingTasks = (await db.query("SELECT COUNT(*) as c FROM journey_progress WHERE status = 'available'")).rows[0].c;

    return {
      totalCustomers: parseInt(totalCustomers),
      totalAssessments: parseInt(totalAssessments),
      assessmentsToday: parseInt(assessmentsToday),
      activeJourneys: parseInt(activeJourneys),
      pendingTasks: parseInt(pendingTasks)
    };
  }

  async getRiskDistribution() {
    const res = await db.query(`
      SELECT r.risk_level, COUNT(*) as count
      FROM risk_scores r
      JOIN (SELECT session_id, MAX(created_at) as max_created FROM risk_scores GROUP BY session_id) latest
        ON r.session_id = latest.session_id AND r.created_at = latest.max_created
      GROUP BY r.risk_level
      ORDER BY r.risk_level
    `);
    return res.rows.map(r => ({ level: r.risk_level, count: parseInt(r.count) }));
  }

  async getRecentActivity(limit = 20) {
    const res = await db.query(`
      SELECT e.id, e.event_type, e.data, e.created_at,
             c.name as customer_name, c.phone as customer_phone
      FROM events e
      LEFT JOIN customers c ON e.customer_id = c.id
      ORDER BY e.created_at DESC
      LIMIT $1
    `, [limit]);
    return res.rows;
  }

  async getTopRisks(limit = 10) {
    const res = await db.query(`
      SELECT r.identified_risks, r.score, r.risk_level, r.created_at,
             s.pack_id, c.name as customer_name, c.phone
      FROM risk_scores r
      JOIN conversation_sessions s ON r.session_id = s.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE r.identified_risks != '[]'
      ORDER BY r.score ASC
      LIMIT $1
    `, [limit]);
    return res.rows.map(r => ({
      ...r,
      identified_risks: typeof r.identified_risks === 'string'
        ? JSON.parse(r.identified_risks) : r.identified_risks
    }));
  }

  // ── Customers ─────────────────────────────────────────

  async listCustomers(search, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let query, countQuery, params;

    if (search) {
      query = `
        SELECT c.*, s.state as last_phase, rs.score as last_score, rs.risk_level as last_risk_level
        FROM customers c
        LEFT JOIN LATERAL (
          SELECT state FROM conversation_sessions WHERE customer_id = c.id ORDER BY started_at DESC LIMIT 1
        ) s ON true
        LEFT JOIN LATERAL (
          SELECT score, risk_level FROM risk_scores rs
          JOIN conversation_sessions cs ON rs.session_id = cs.id
          WHERE cs.customer_id = c.id ORDER BY rs.created_at DESC LIMIT 1
        ) rs ON true
        WHERE c.name ILIKE $1 OR c.phone ILIKE $1 OR c.email ILIKE $1
        ORDER BY c.created_at DESC LIMIT $2 OFFSET $3
      `;
      countQuery = `SELECT COUNT(*) as c FROM customers WHERE name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1`;
      params = [`%${search}%`, limit, offset];
    } else {
      query = `
        SELECT c.*, s.state as last_phase, rs.score as last_score, rs.risk_level as last_risk_level
        FROM customers c
        LEFT JOIN LATERAL (
          SELECT state FROM conversation_sessions WHERE customer_id = c.id ORDER BY started_at DESC LIMIT 1
        ) s ON true
        LEFT JOIN LATERAL (
          SELECT score, risk_level FROM risk_scores rs
          JOIN conversation_sessions cs ON rs.session_id = cs.id
          WHERE cs.customer_id = c.id ORDER BY rs.created_at DESC LIMIT 1
        ) rs ON true
        ORDER BY c.created_at DESC LIMIT $1 OFFSET $2
      `;
      countQuery = 'SELECT COUNT(*) as c FROM customers';
      params = [limit, offset];
    }

    const [dataRes, countRes] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, search ? [`%${search}%`] : [])
    ]);

    return {
      customers: dataRes.rows,
      total: parseInt(countRes.rows[0].c),
      page, limit
    };
  }

  async getCustomerDetail(customerId) {
    const customer = await db.query('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (!customer.rows.length) return null;

    const sessions = await db.query(`
      SELECT cs.*, rs.score, rs.risk_level, rs.protection_gap, rs.pillars
      FROM conversation_sessions cs
      LEFT JOIN LATERAL (
        SELECT score, risk_level, protection_gap, pillars FROM risk_scores
        WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1
      ) rs ON true
      WHERE cs.customer_id = $1
      ORDER BY cs.started_at DESC
    `, [customerId]);

    const activeJourneys = await db.query(`
      SELECT cj.*, jd.code, jd.name
      FROM customer_journeys cj
      JOIN journey_definitions jd ON cj.journey_id = jd.id
      WHERE cj.customer_id = $1 AND cj.status = 'active'
      ORDER BY cj.started_at DESC
    `, [customerId]);

    return {
      customer: customer.rows[0],
      assessments: sessions.rows,
      activeJourneys: activeJourneys.rows
    };
  }

  async getCustomerTimeline(customerId) {
    const events = await db.query(`
      SELECT e.event_type, e.data, e.created_at, e.source
      FROM events e
      WHERE e.customer_id = $1
      ORDER BY e.created_at DESC
      LIMIT 50
    `, [customerId]);
    return events.rows;
  }

  // ── Opportunities ─────────────────────────────────────

  async listOpportunities(status = 'active', page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const res = await db.query(`
      SELECT cj.*, jd.code as journey_code, jd.name as journey_name,
             jp.id as progress_id, jp.step_sequence, jp.status as step_status,
             js.step_type, js.title as step_title, js.content as step_content,
             c.name as customer_name, c.phone as customer_phone
      FROM customer_journeys cj
      JOIN journey_definitions jd ON cj.journey_id = jd.id
      JOIN journey_progress jp ON jp.customer_journey_id = cj.id
      JOIN journey_steps js ON jp.step_id = js.id
      LEFT JOIN customers c ON cj.customer_id = c.id
      WHERE cj.status = $1
        AND jp.status = 'available'
        AND js.step_type IN ('product', 'advisor_referral', 'check_in')
      ORDER BY cj.priority ASC, jp.sent_at ASC NULLS FIRST
      LIMIT $2 OFFSET $3
    `, [status, limit, offset]);

    const countRes = await db.query(`
      SELECT COUNT(*) as c
      FROM customer_journeys cj
      JOIN journey_progress jp ON jp.customer_journey_id = cj.id
      JOIN journey_steps js ON jp.step_id = js.id
      WHERE cj.status = $1 AND jp.status = 'available'
        AND js.step_type IN ('product', 'advisor_referral', 'check_in')
    `, [status]);

    return {
      opportunities: res.rows,
      total: parseInt(countRes.rows[0].c),
      page, limit
    };
  }

  async getOpportunityDetail(progressId) {
    const res = await db.query(`
      SELECT jp.*, js.step_type, js.title, js.content, js.branch_rules,
             cj.id as customer_journey_id, cj.status as journey_status,
             jd.code as journey_code, jd.name as journey_name,
             c.*
      FROM journey_progress jp
      JOIN journey_steps js ON jp.step_id = js.id
      JOIN customer_journeys cj ON jp.customer_journey_id = cj.id
      JOIN journey_definitions jd ON cj.journey_id = jd.id
      LEFT JOIN customers c ON cj.customer_id = c.id
      WHERE jp.id = $1
    `, [progressId]);
    return res.rows[0] || null;
  }

  // ── Pipeline ──────────────────────────────────────────

  async getPipeline() {
    const stages = [
      { id: 'NEW', name: 'New Lead', description: 'Assessment not started' },
      { id: 'WELCOME', name: 'Engaged', description: 'Assessment in progress' },
      { id: 'REPORT', name: 'Assessed', description: 'Report delivered' },
      { id: 'journey_active', name: 'In Journey', description: 'Active follow-up journey' },
      { id: 'journey_completed', name: 'Nurtured', description: 'Journey completed' },
      { id: 'COMPLETE', name: 'Converted', description: 'All journeys complete' }
    ];

    const pipelineData = [];
    for (const stage of stages) {
      let count, customers;
      if (stage.id.startsWith('journey_')) {
        const status = stage.id.replace('journey_', '');
        const res = await db.query(`
          SELECT COUNT(*) as c FROM customer_journeys WHERE status = $1
        `, [status]);
        count = parseInt(res.rows[0].c);

        const custRes = await db.query(`
          SELECT DISTINCT c.id, c.name, c.phone, c.email,
                 rs.score, rs.risk_level
          FROM customer_journeys cj
          JOIN customers c ON cj.customer_id = c.id
          LEFT JOIN LATERAL (
            SELECT score, risk_level FROM risk_scores rss
            JOIN conversation_sessions cs ON rss.session_id = cs.id
            WHERE cs.customer_id = c.id ORDER BY rss.created_at DESC LIMIT 1
          ) rs ON true
          WHERE cj.status = $1
          ORDER BY cj.started_at DESC LIMIT 10
        `, [status]);
        customers = custRes.rows;
      } else {
        const phase = stage.id;
        const res = await db.query(`
          SELECT COUNT(*) as c FROM conversation_sessions WHERE state = $1
        `, [phase]);
        count = parseInt(res.rows[0].c);

        const custRes = await db.query(`
          SELECT c.id, c.name, c.phone, c.email,
                 cs.state as phase, rs.score, rs.risk_level
          FROM conversation_sessions cs
          JOIN customers c ON cs.customer_id = c.id
          LEFT JOIN LATERAL (
            SELECT score, risk_level FROM risk_scores
            WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1
          ) rs ON true
          WHERE cs.state = $1
          ORDER BY cs.started_at DESC LIMIT 10
        `, [phase]);
        customers = custRes.rows;
      }

      pipelineData.push({ ...stage, count, customers });
    }

    return pipelineData;
  }

  // ── Tasks ─────────────────────────────────────────────

  async listTasks(status = 'available', page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const res = await db.query(`
      SELECT jp.*, js.step_type, js.title as step_title, js.content as step_content,
             js.delay_hours, jd.code as journey_code, jd.name as journey_name,
             cj.id as customer_journey_id, c.name as customer_name, c.phone as customer_phone
      FROM journey_progress jp
      JOIN journey_steps js ON jp.step_id = js.id
      JOIN customer_journeys cj ON jp.customer_journey_id = cj.id
      JOIN journey_definitions jd ON cj.journey_id = jd.id
      LEFT JOIN customers c ON cj.customer_id = c.id
      WHERE jp.status = $1
      ORDER BY
        CASE WHEN js.step_type IN ('advisor_referral', 'product') THEN 0 ELSE 1 END,
        jp.sent_at ASC NULLS FIRST,
        jp.completed_at ASC NULLS FIRST
      LIMIT $2 OFFSET $3
    `, [status, limit, offset]);

    const countRes = await db.query(
      'SELECT COUNT(*) as c FROM journey_progress WHERE status = $1',
      [status]
    );

    return {
      tasks: res.rows,
      total: parseInt(countRes.rows[0].c),
      page, limit
    };
  }

  // ── Copilot ──────────────────────────────────────────

  async getCopilotContext(customerId) {
    const customer = await db.query('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (!customer.rows.length) return null;

    const latestSession = await db.query(`
      SELECT * FROM conversation_sessions
      WHERE customer_id = $1 ORDER BY started_at DESC LIMIT 1
    `, [customerId]);

    if (!latestSession.rows.length) {
      return {
        customer: customer.rows[0],
        message: 'No assessment data available yet'
      };
    }

    const session = latestSession.rows[0];
    const score = await db.query(`
      SELECT * FROM risk_scores
      WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1
    `, [session.id]);

    const answers = await db.query(`
      SELECT a.*, q.text as question_text, q.category, q.pillar
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.session_id = $1
    `, [session.id]);

    const activeJourneys = await db.query(`
      SELECT cj.*, jd.code, jd.name
      FROM customer_journeys cj
      JOIN journey_definitions jd ON cj.journey_id = jd.id
      WHERE cj.customer_id = $1 AND cj.status = 'active'
    `, [customerId]);

    const progress = activeJourneys.rows.length
      ? await db.query(`
          SELECT jp.*, js.step_type, js.title, js.content
          FROM journey_progress jp
          JOIN journey_steps js ON jp.step_id = js.id
          WHERE jp.customer_journey_id = ANY($1::uuid[]) AND jp.status = 'available'
        `, [activeJourneys.rows.map(j => j.id)])
      : { rows: [] };

    return {
      customer: customer.rows[0],
      session: {
        id: session.id,
        packId: session.pack_id,
        state: session.state,
        startedAt: session.started_at
      },
      score: score.rows[0] ? {
        overall: score.rows[0].score,
        riskLevel: score.rows[0].risk_level,
        protectionGap: score.rows[0].protection_gap,
        pillars: score.rows[0].pillars,
        identifiedRisks: score.rows[0].identified_risks
      } : null,
      answers: answers.rows.map(a => ({
        questionId: a.question_id,
        question: a.question_text,
        category: a.category,
        pillar: a.pillar,
        answer: a.value,
        score: a.score
      })),
      journeys: activeJourneys.rows.map(j => ({
        id: j.id,
        code: j.code,
        name: j.name,
        status: j.status,
        currentStep: j.current_step,
        nextSteps: progress.rows.filter(p => p.customer_journey_id === j.id)
      }))
    };
  }
}

module.exports = new AdvisorDataService();
