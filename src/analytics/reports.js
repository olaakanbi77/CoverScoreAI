const queries = require('./queries');

const dbAll = async (db, { sql, params }) => {
  if (db.all) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  const res = await db.query(sql, params);
  return res.rows || res;
};

const dbGet = async (db, { sql, params }) => {
  const rows = await dbAll(db, { sql, params });
  return rows[0] || null;
};

class ReportGenerator {
  async advisorWeeklyReport(advisorId, db) {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [assessments, clients, policies] = await Promise.all([
      dbAll(db, queries.totalAssessments({ startDate: weekAgo.toISOString(), endDate: now.toISOString() })),
      dbAll(db, queries.advisorConversionRate({ advisorId, startDate: weekAgo.toISOString(), endDate: now.toISOString() })),
      dbAll(db, queries.premiumWritten({ advisorId, startDate: weekAgo.toISOString(), endDate: now.toISOString() }))
    ]);

    const advisorStats = clients[0] || {};
    const premiumStats = policies[0] || {};

    return {
      advisorId,
      period: { start: weekAgo.toISOString(), end: now.toISOString() },
      newAssessments: assessments[0]?.count || 0,
      totalClients: advisorStats.total_clients || 0,
      convertedClients: advisorStats.converted_clients || 0,
      conversionRate: advisorStats.conversion_rate || 0,
      totalPremium: premiumStats.total_premium || 0,
      policyCount: premiumStats.policy_count || 0,
      avgPremium: premiumStats.avg_premium || 0
    };
  }

  async monthlyOverview(month, year, db) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const [total, avgScore, funnelData, conversionData, premiumData, productData] = await Promise.all([
      dbAll(db, queries.totalAssessments({ startDate, endDate })),
      dbAll(db, queries.averageScore({ startDate, endDate })),
      dbAll(db, queries.assessmentsByFunnel({ startDate, endDate })),
      dbAll(db, queries.advisorConversionRate({ startDate, endDate })),
      dbAll(db, queries.premiumWritten({ startDate, endDate })),
      dbAll(db, queries.topProducts({ limit: 10 }))
    ]);

    return {
      period: { month, year, startDate, endDate },
      totalAssessments: total[0]?.count || 0,
      averageScore: avgScore[0]?.average_score || 0,
      topFunnels: funnelData.slice(0, 5),
      conversionRate: conversionData.reduce((acc, c) => acc + (c.conversion_rate || 0), 0) /
        Math.max(conversionData.length, 1),
      totalPremium: premiumData.reduce((acc, p) => acc + (p.total_premium || 0), 0),
      totalPolicies: premiumData.reduce((acc, p) => acc + (p.policy_count || 0), 0),
      topProducts: productData.slice(0, 5),
      advisorPerformance: conversionData
    };
  }

  async funnelHealthReport(db) {
    const funnels = await dbAll(db, queries.assessmentsByFunnel({}));

    const report = [];
    for (const funnel of funnels) {
      const [scoreDist, perf] = await Promise.all([
        dbAll(db, queries.scoreDistribution({ prefix: funnel.funnel })),
        dbAll(db, queries.funnelPerformance({}))
      ]);

      const funnelPerf = perf.find(p => p.funnel === funnel.funnel) || {};

      report.push({
        funnel: funnel.funnel,
        totalAssessments: funnel.count,
        avgScore: funnel.avg_score,
        scoreDistribution: scoreDist,
        completionRate: funnelPerf.completion_rate || 0,
        conversionRate: funnelPerf.conversion_rate || 0,
        avgPremium: funnelPerf.avg_premium || 0
      });
    }

    return report;
  }

  async assessmentDeepDive(assessmentId, db) {
    const assessment = await dbGet(db, {
      sql: `SELECT a.*, l.id as lead_id, l.name as client_name, l.email as client_email,
        l.phone as client_phone, l.status as lead_status, l.estimated_premium,
        u.name as user_name, u.email as user_email
        FROM assessments a
        LEFT JOIN leads l ON l.assessment_id = a.id
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.id = ?`,
      params: [assessmentId]
    });

    if (!assessment) return null;

    const rieData = assessment.ai_report ? (() => {
      try { return JSON.parse(assessment.ai_report); } catch { return null; }
    })() : null;

    const answers = assessment.answers ? (() => {
      try { return JSON.parse(assessment.answers); } catch { return null; }
    })() : null;

    const [history] = await Promise.all([
      dbAll(db, {
        sql: `SELECT event_type, entity_type, created_at, metadata
          FROM audit_logs
          WHERE entity_type = 'assessment' AND entity_id = ?
          ORDER BY created_at DESC
          LIMIT 50`,
        params: [String(assessmentId)]
      })
    ]);

    return {
      assessment: {
        id: assessment.id,
        score: assessment.score,
        riskLevel: assessment.risk_level,
        type: assessment.type,
        createdAt: assessment.created_at
      },
      client: assessment.lead_id ? {
        id: assessment.lead_id,
        name: assessment.client_name,
        email: assessment.client_email,
        phone: assessment.client_phone,
        status: assessment.lead_status,
        estimatedPremium: assessment.estimated_premium
      } : null,
      user: assessment.user_id ? {
        id: assessment.user_id,
        name: assessment.user_name,
        email: assessment.user_email
      } : null,
      rieOutput: rieData ? {
        executiveSummary: rieData.executiveSummary || null,
        professionalRecommendation: rieData.professionalRecommendation || null,
        copilot: rieData.copilot || null,
        creData: rieData.cre_data || null,
        riskCategories: rieData.risk_categories || null,
        minLoss: rieData.min_loss || null,
        maxLoss: rieData.max_loss || null
      } : null,
      products: rieData?.copilot?.recommendedProducts || rieData?.cre_data?.recommendations || [],
      answers,
      history: history || []
    };
  }

  async getDashboardSummary(userId, role, db) {
    const isAdmin = role === 'admin';
    const scopeSql = isAdmin ? '' : ' AND (l.advisor_id = ? OR l.advisor_id IS NULL)';

    const leadStats = await dbGet(db, {
      sql: `SELECT
          COUNT(*) as total_leads,
          SUM(CASE WHEN l.status IN ('New Lead', 'hot') THEN 1 ELSE 0 END) as hot_leads,
          SUM(CASE WHEN l.pipeline_stage = 3 OR l.status = 'Proposal Ready' THEN 1 ELSE 0 END) as proposals_pending,
          COALESCE(SUM(l.estimated_premium), 0) as total_premium,
          COALESCE(SUM(CASE WHEN l.pipeline_stage IN (1,2,3,4) THEN l.estimated_premium ELSE 0 END), 0) as active_pipeline_value,
          SUM(CASE WHEN l.pipeline_stage = 6 THEN 1 ELSE 0 END) as won_deals,
          SUM(CASE WHEN l.pipeline_stage = 6 THEN 1 ELSE 0 END) as lost_deals,
          SUM(CASE WHEN l.status = 'New Lead' THEN 1 ELSE 0 END) as new_leads,
          SUM(CASE WHEN l.assessment_id IS NULL OR l.assessment_id = '' THEN 1 ELSE 0 END) as assessments_pending
          FROM leads l
          WHERE 1=1${scopeSql}`,
      params: isAdmin ? [] : [userId]
    });

    const proposals = await dbAll(db, { sql: 'SELECT COUNT(*) as count FROM proposals', params: [] });

    const totalLeads = leadStats?.total_leads || 0;
    const wonDeals = leadStats?.won_deals || 0;

    return {
      hotLeads: leadStats?.hot_leads || 0,
      proposalsPending: leadStats?.proposals_pending || 0,
      proposalsSent: proposals[0]?.count || 0,
      estPremium: leadStats?.total_premium || 0,
      activePipelineValue: leadStats?.active_pipeline_value || 0,
      wonDeals,
      conversionRate: totalLeads > 0 ? Math.round((wonDeals / totalLeads) * 100) : 0,
      newLeads: leadStats?.new_leads || 0,
      assessmentsPending: leadStats?.assessments_pending || 0,
      totalLeads
    };
  }
}

module.exports = new ReportGenerator();
