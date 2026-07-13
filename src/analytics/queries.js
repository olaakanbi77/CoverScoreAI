const queries = {
  totalAssessments: ({ startDate, endDate, prefix } = {}) => ({
    sql: `SELECT COUNT(*) as count FROM assessments WHERE 1=1` +
      (startDate ? ` AND created_at >= ?` : '') +
      (endDate ? ` AND created_at <= ?` : '') +
      (prefix ? ` AND type = ?` : ''),
    params: [startDate, endDate, prefix].filter(v => v != null)
  }),

  averageScore: ({ startDate, endDate, prefix } = {}) => ({
    sql: `SELECT COALESCE(ROUND(AVG(score), 1), 0) as average_score, COUNT(*) as count FROM assessments WHERE score > 0` +
      (startDate ? ` AND created_at >= ?` : '') +
      (endDate ? ` AND created_at <= ?` : '') +
      (prefix ? ` AND type = ?` : ''),
    params: [startDate, endDate, prefix].filter(v => v != null)
  }),

  scoreDistribution: ({ prefix } = {}) => ({
    sql: `SELECT
      CASE
        WHEN score BETWEEN 0 AND 20 THEN '0-20'
        WHEN score BETWEEN 21 AND 40 THEN '21-40'
        WHEN score BETWEEN 41 AND 60 THEN '41-60'
        WHEN score BETWEEN 61 AND 80 THEN '61-80'
        WHEN score BETWEEN 81 AND 100 THEN '81-100'
      END as bucket,
      COUNT(*) as count,
      ROUND(CAST(COUNT(*) AS REAL) / NULLIF(SUM(COUNT(*)) OVER (), 0) * 100, 1) as percentage
      FROM assessments
      WHERE score > 0` +
      (prefix ? ` AND type = ?` : '') +
      ` GROUP BY bucket ORDER BY bucket`,
    params: prefix ? [prefix] : []
  }),

  assessmentsByFunnel: ({ startDate, endDate } = {}) => ({
    sql: `SELECT
      COALESCE(NULLIF(type, ''), 'unknown') as funnel,
      COUNT(*) as count,
      COALESCE(ROUND(AVG(score), 1), 0) as avg_score,
      ROUND(CAST(COUNT(*) AS REAL) / NULLIF(SUM(COUNT(*)) OVER (), 0) * 100, 1) as percentage
      FROM assessments
      WHERE score > 0` +
      (startDate ? ` AND created_at >= ?` : '') +
      (endDate ? ` AND created_at <= ?` : '') +
      ` GROUP BY funnel ORDER BY count DESC`,
    params: [startDate, endDate].filter(v => v != null)
  }),

  advisorConversionRate: ({ advisorId, startDate, endDate } = {}) => ({
    sql: `SELECT
      u.id as advisor_id,
      u.name as advisor_name,
      COUNT(DISTINCT l.id) as total_clients,
      COUNT(DISTINCT CASE WHEN l.status IN ('Won', 'converted') THEN l.id END) as converted_clients,
      ROUND(CAST(COUNT(DISTINCT CASE WHEN l.status IN ('Won', 'converted') THEN l.id END) AS REAL) /
        NULLIF(COUNT(DISTINCT l.id), 0) * 100, 1) as conversion_rate
      FROM users u
      LEFT JOIN leads l ON l.advisor_id = u.id OR l.assigned_agent = u.name
      WHERE u.role IN ('admin', 'sales')` +
      (advisorId ? ` AND u.id = ?` : '') +
      (startDate ? ` AND l.created_at >= ?` : '') +
      (endDate ? ` AND l.created_at <= ?` : '') +
      ` GROUP BY u.id, u.name
      ORDER BY conversion_rate DESC`,
    params: [advisorId, startDate, endDate].filter(v => v != null)
  }),

  premiumWritten: ({ advisorId, startDate, endDate } = {}) => ({
    sql: `SELECT
      COALESCE(SUM(p.premium), 0) as total_premium,
      COUNT(p.id) as policy_count,
      COALESCE(ROUND(SUM(p.premium) / NULLIF(COUNT(p.id), 0), 0), 0) as avg_premium
      FROM policies p
      JOIN leads l ON l.id = p.lead_id` +
      (advisorId ? ` WHERE (l.advisor_id = ? OR l.assigned_agent = (SELECT name FROM users WHERE id = ?))` : '') +
      (startDate ? (advisorId ? ` AND` : ` WHERE`) + ` p.created_at >= ?` : '') +
      (endDate ? ((advisorId || startDate) ? ` AND` : ` WHERE`) + ` p.created_at <= ?` : '') +
      ` GROUP BY l.advisor_id`,
    params: advisorId
      ? [advisorId, advisorId, startDate, endDate].filter(v => v != null)
      : [startDate, endDate].filter(v => v != null)
  }),

  topProducts: ({ limit = 10 } = {}) => ({
    sql: `SELECT p.product, COUNT(*) as policy_count, SUM(p.premium) as total_premium
      FROM policies p
      GROUP BY p.product
      ORDER BY policy_count DESC
      LIMIT ?`,
    params: [limit]
  }),

  funnelPerformance: ({ startDate, endDate } = {}) => ({
    sql: `SELECT
      COALESCE(NULLIF(a.type, ''), 'unknown') as funnel,
      COUNT(*) as total_assessments,
      COALESCE(ROUND(AVG(a.score), 1), 0) as avg_score,
      ROUND(CAST(COUNT(*) AS REAL) / NULLIF((SELECT COUNT(*) FROM assessments WHERE 1=1` +
      (startDate ? ` AND created_at >= ?` : '') +
      (endDate ? ` AND created_at <= ?` : '') +
      `), 0) * 100, 1) as completion_rate,
      COALESCE(ROUND(AVG(l.estimated_premium), 0), 0) as avg_premium
      FROM assessments a
      LEFT JOIN leads l ON l.assessment_id = a.id
      WHERE a.score > 0` +
      (startDate ? ` AND a.created_at >= ?` : '') +
      (endDate ? ` AND a.created_at <= ?` : '') +
      ` GROUP BY funnel
      ORDER BY total_assessments DESC`,
    params: (() => {
      const p = [startDate, endDate].filter(v => v != null);
      return p.concat(p).concat(p);
    })()
  }),

  advisorLeaderboard: ({ metric = 'conversion_rate', limit = 10 } = {}) => ({
    sql: `WITH advisor_stats AS (
      SELECT
        u.id as advisor_id,
        u.name as advisor_name,
        u.email as advisor_email,
        COUNT(DISTINCT l.id) as total_clients,
        COUNT(DISTINCT CASE WHEN l.status IN ('Won', 'converted') THEN l.id END) as converted_clients,
        ROUND(CAST(COUNT(DISTINCT CASE WHEN l.status IN ('Won', 'converted') THEN l.id END) AS REAL) /
          NULLIF(COUNT(DISTINCT l.id), 0) * 100, 1) as conversion_rate,
        COALESCE(SUM(COALESCE(p.premium, 0)), 0) as total_premium,
        COUNT(DISTINCT p.id) as policy_count
      FROM users u
      LEFT JOIN leads l ON l.advisor_id = u.id OR l.assigned_agent = u.name
      LEFT JOIN policies p ON p.lead_id = l.id
      WHERE u.role IN ('admin', 'sales')
      GROUP BY u.id, u.name, u.email
    )
    SELECT * FROM advisor_stats
    ORDER BY ${metric === 'total_premium' || metric === 'policy_count' || metric === 'total_clients' ? metric : 'conversion_rate'} DESC
    LIMIT ?`,
    params: [limit]
  }),

  renewalPipeline: ({ advisorId } = {}) => ({
    sql: `SELECT
      p.id as policy_id,
      p.policy_number,
      p.product,
      p.premium,
      p.expiry_date,
      p.status,
      l.id as lead_id,
      l.name as client_name,
      l.email as client_email,
      l.phone as client_phone,
      CAST(julianday(p.expiry_date) - julianday('now') AS INTEGER) as days_to_expiry
      FROM policies p
      JOIN leads l ON l.id = p.lead_id
      WHERE p.expiry_date >= date('now')
      AND p.status = 'Active'` +
      (advisorId ? ` AND (l.advisor_id = ? OR l.assigned_agent = (SELECT name FROM users WHERE id = ?))` : '') +
      ` ORDER BY p.expiry_date ASC`,
    params: advisorId ? [advisorId, advisorId] : []
  }),

  highRiskLeads: ({ advisorId, limit = 20 } = {}) => ({
    sql: `SELECT
      l.id as lead_id,
      l.name as client_name,
      l.email,
      l.phone,
      l.score,
      l.risk_level,
      l.status,
      l.estimated_premium,
      l.created_at,
      CASE WHEN l.score < 40 THEN ROUND((100 - l.score) * 1.5, 0) ELSE 0 END as opportunity_score
      FROM leads l
      WHERE l.score IS NOT NULL AND l.score < 40` +
      (advisorId ? ` AND (l.advisor_id = ? OR l.assigned_agent = (SELECT name FROM users WHERE id = ?))` : '') +
      ` ORDER BY l.score ASC
      LIMIT ?`,
    params: advisorId ? [advisorId, advisorId, limit] : [limit]
  }),

  completionTrend: ({ period = 'daily', startDate, endDate } = {}) => ({
    sql: `SELECT` +
      (period === 'weekly'
        ? ` strftime('%Y-W%W', created_at) as period`
        : period === 'monthly'
          ? ` strftime('%Y-%m', created_at) as period`
          : ` date(created_at) as period`) +
      `, COUNT(*) as count
      FROM assessments
      WHERE score > 0` +
      (startDate ? ` AND created_at >= ?` : '') +
      (endDate ? ` AND created_at <= ?` : '') +
      ` GROUP BY period ORDER BY period ASC`,
    params: [startDate, endDate].filter(v => v != null)
  })
};

module.exports = queries;
