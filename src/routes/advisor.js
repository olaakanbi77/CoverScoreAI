const express = require('express');
const router = express.Router();
const { all, get, run } = require('../config/database');
const { authenticatePage } = require('../middleware/auth');
const HTMLtoDOCX = require('html-to-docx');
const { calculateScore } = require('../services/scoringEngine');
const { handleAdvisorCopilotChat } = require('../services/aiService');
const { notify } = require('../services/notify');
const { reportGenerator } = require('../analytics');

const requireSalesOrAdmin = (req, res, next) => {
  if (req.user && ['admin', 'sales'].includes(req.user.role)) return next();
  return res.status(403).send('Forbidden: Sales or Admin role required');
};

router.get('/dashboard', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    let rawLeads = [];
    if (req.user.role === 'admin') {
      rawLeads = await all(`
        SELECT leads.*, users.name as advisor_name 
        FROM leads 
        LEFT JOIN users ON leads.advisor_id = users.id 
        ORDER BY leads.updated_at DESC, leads.created_at DESC
      `);
    } else {
      rawLeads = await all(`
        SELECT leads.*, users.name as advisor_name 
        FROM leads 
        LEFT JOIN users ON leads.advisor_id = users.id 
        WHERE leads.advisor_id = ? OR leads.advisor_id IS NULL
        ORDER BY leads.updated_at DESC, leads.created_at DESC
      `, [req.user.id]);
    }
    
    const leads = rawLeads.map(l => {
      let conversations = [];
      try {
        const parsed = JSON.parse(l.chat_history || '{}');
        conversations = Array.isArray(parsed.__messages) ? parsed.__messages : [];
      } catch(e) {}
      
      let badgeClass = 'follow-up';
      if (l.status === 'New Lead' || l.status === 'hot') badgeClass = 'hot';
      else if (l.status === 'WhatsApp Engaged' || l.status === 'warm') badgeClass = 'warm';

      return {
        ...l,
        badgeClass,
        conversations,
        contact: l.name,
        last_activity: l.updated_at || l.created_at,
        sales_score: (l.sales_score || 0) > 100 ? 100 : (l.sales_score || 0),
        likelihood_to_buy: l.sales_score >= 70 ? 'HIGH' : (l.sales_score >= 40 ? 'MEDIUM' : 'LOW'),
        premium_range: l.estimated_premium ? `₦${l.estimated_premium.toLocaleString()}` : 'N/A',
        recommended_product: l.recommended_covers || 'Review Assessment'
      };
    });

    const leadId = parseInt(req.query.lead) || (leads.length > 0 ? leads[0].id : null);
    const selectedLead = leads.find(l => l.id === leadId) || leads[0] || null;

    let aiRecommendations = [];
    let talkingPoints = [];
    let risks = [];
    let protection_gaps = [];
    let financial_exposure_min = 0;
    let financial_exposure_max = 0;
    let user_primary_concern = null;
    let copilot_data = null;

    if (selectedLead && selectedLead.assessment_id) {
      const assessment = await get('SELECT answers, ai_report FROM assessments WHERE id = ?', [selectedLead.assessment_id]);
      if (assessment && assessment.answers) {
        try {
          const answers = JSON.parse(assessment.answers);
          user_primary_concern = answers.primary_concern;
          
          if (answers.business) {
            selectedLead.industry = answers.business.industry || 'Unknown';
            selectedLead.employees = answers.business.employees ? answers.business.employees.replace('_', '-') : 'Unknown';
            selectedLead.turnover = answers.business.turnover ? answers.business.turnover.replace('_', '-') : 'Unknown';
          } else {
            selectedLead.industry = 'Individual';
            selectedLead.employees = 'N/A';
            selectedLead.turnover = 'N/A';
          }
          
          if (answers.type && answers.type.location) {
             selectedLead.location = answers.type.location;
          } else {
             selectedLead.location = 'Nigeria'; // Default placeholder
          }
          
          const report = calculateScore(answers);
          
          if (assessment.ai_report) {
            const aiData = JSON.parse(assessment.ai_report);
            copilot_data = aiData.copilot || null;
            if (aiData.cre_data && aiData.cre_data.recommendations) {
              aiRecommendations = aiData.cre_data.recommendations.map(r => ({
                product: r.action,
                priority: r.severity
              }));
            }
          }
          
          if (report.risk_categories) {
            risks = Object.entries(report.risk_categories).map(([name, score]) => ({ name: name.replace('_', ' '), score }));
          }
          
          if (report.recommendations) {
            protection_gaps = report.recommendations.map(r => 'No ' + r);
          } else if (report.identified_gaps) {
            protection_gaps = report.identified_gaps;
          }
          
          if (report.recommendations) {
            aiRecommendations = report.recommendations.map(r => ({
              product: r,
              priority: 'High'
            }));
          }

          financial_exposure_min = report.min_loss || 0;
          financial_exposure_max = report.max_loss || 0;

        } catch (e) {
          console.error('Error parsing AI report:', e);
        }
      }
    }

      if (selectedLead) {
      selectedLead.industry = selectedLead.industry || 'Unknown';
      selectedLead.employees = selectedLead.employees || 'N/A';
      selectedLead.turnover = selectedLead.turnover || 'N/A';
      selectedLead.location = selectedLead.location || 'Nigeria';
      selectedLead.risks = risks.length > 0 ? risks.map(r => {
        let formatted = r.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (!formatted.toLowerCase().includes('risk')) formatted += ' Risk';
        return { ...r, name: formatted };
      }) : [{name: 'General Risk', score: selectedLead.score || 50}];
      selectedLead.protection_gaps = protection_gaps.length > 0 ? protection_gaps : ['Pending full analysis'];
      selectedLead.primary_concern = Array.isArray(user_primary_concern) ? user_primary_concern.join(', ') : (user_primary_concern || selectedLead.primary_concern || 'Not Specified');
      selectedLead.financial_exposure_min = financial_exposure_min;
      selectedLead.financial_exposure_max = financial_exposure_max;
      
      const resilience = 100 - (selectedLead.score || 0);
      selectedLead.resilience_score = resilience > 0 ? resilience : 0;
      
      if (selectedLead.estimated_premium > 0) {
        selectedLead.premium_range = `₦${selectedLead.estimated_premium.toLocaleString()}`;
      } else {
        selectedLead.premium_range = 'Pending';
      }
      
      // Dynamic calculations for Lead Intelligence
        
      let next_action = copilot_data?.next_actions?.[0] || 'Contact Lead';
      if (!copilot_data) {
        if (selectedLead.status === 'New Lead' || selectedLead.status === 'hot') next_action = 'Initial Outreach';
        else if (selectedLead.status === 'WhatsApp Engaged' || selectedLead.status === 'warm') next_action = 'Follow up on WhatsApp';
        else if (selectedLead.status === 'Proposal Sent') next_action = 'Review Proposal';
      }
      selectedLead.next_best_action = next_action;
      
      if (copilot_data) {
        talkingPoints = copilot_data.recommended_questions || [];
        selectedLead.objections = copilot_data.likely_objections || [];
      }

      if (aiRecommendations.length > 0) {
        selectedLead.recommended_product = aiRecommendations[0].product;
      }
    }

    const proposals = await all('SELECT * FROM proposals ORDER BY created_at DESC');

    const summary = await reportGenerator.getDashboardSummary(req.user.id, req.user.role, { all, get });
    summary.estPremium = summary.estPremium > 1000000 
      ? `₦${(summary.estPremium/1000000).toFixed(1)}M` 
      : `₦${summary.estPremium.toLocaleString()}`;
    summary.activePipelineValue = summary.activePipelineValue > 1000000 
      ? `₦${(summary.activePipelineValue/1000000).toFixed(1)}M` 
      : `₦${summary.activePipelineValue.toLocaleString()}`;
    summary.conversionRate = `${summary.conversionRate}%`;

    res.render('advisor/dashboard', {
      layout: false,
      user: req.user,
      leads: leads.slice(0, 3),
      proposals,
      summary,
      aiRecommendations,
      talkingPoints,
      selectedLead,
      path: '/advisor/dashboard'
    });
  } catch (err) {
    console.error('Advisor dashboard error:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/proposal-writer/:leadId', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const lead = await get('SELECT * FROM leads WHERE id = ?', [req.params.leadId]);
    if (!lead) return res.status(404).send('Lead not found');

    const proposal = await get('SELECT * FROM proposals WHERE lead_id = ? ORDER BY id DESC LIMIT 1', [lead.id]) || null;

    let ratingProducts = [];
    let totalPremium = 0;
    let productCount = 0;
    if (proposal && proposal.content) {
      try {
        const content = JSON.parse(proposal.content);
        if (content.ratingProducts) {
          ratingProducts = content.ratingProducts;
          productCount = ratingProducts.length;
          totalPremium = ratingProducts.reduce((s, p) => s + p.premium, 0);
        } else if (content.totalPremium) {
          totalPremium = content.totalPremium;
        }
      } catch (e) { /* silent */ }
    }
    if (!totalPremium) totalPremium = proposal?.amount || 0;

    let location = 'N/A';
    if (lead.assessment_data) {
      try {
        const ad = JSON.parse(lead.assessment_data);
        if (ad.answers) {
          const prefix = ad.answers.template_selection?.template_id;
          if (prefix) location = ad.answers[`${prefix}_008`] || 'N/A';
        }
      } catch (e) {}
    }

    res.render('advisor/proposal-writer', {
      layout: 'admin',
      user: req.user,
      lead,
      proposal,
      ratingProducts,
      totalPremium,
      productCount,
      location,
      path: '/advisor/dashboard'
    });
  } catch (err) {
    console.error('Error loading proposal writer:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/follow-up', authenticatePage, requireSalesOrAdmin, (req, res) => {
  res.redirect('/advisor/follow-up/1');
});

router.get('/follow-up/:leadId', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const lead = await get('SELECT * FROM leads WHERE id = ?', [req.params.leadId]);
    if (!lead) return res.status(404).send('Lead not found');

    res.render('advisor/follow-up', {
      layout: 'admin',
      user: req.user,
      lead,
      activePage: 'more'
    });
  } catch (err) {
    console.error('Error loading follow up screen:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/risk-report', authenticatePage, requireSalesOrAdmin, (req, res) => {
  res.redirect('/advisor/risk-report/1');
});

router.get('/risk-report/:leadId', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const lead = await get('SELECT * FROM leads WHERE id = ?', [req.params.leadId]);
    if (!lead) return res.status(404).send('Lead not found');

    res.render('advisor/risk-report', {
      layout: 'admin',
      user: req.user,
      lead,
      activePage: 'assessments'
    });
  } catch (err) {
    console.error('Error loading risk report screen:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/notifications', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const notifications = await all(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `, [req.user.id]);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const grouped = {
      all: notifications,
      unread: notifications.filter(n => !n.is_read),
      leads: notifications.filter(n => ['lead_assigned', 'new_opportunity'].includes(n.type)),
      quotes: notifications.filter(n => ['stage_update', 'quote_generated'].includes(n.type)),
      system: notifications.filter(n => ['follow_up_scheduled'].includes(n.type))
    };
    res.render('advisor/notifications', {
      layout: 'admin',
      user: req.user,
      activePage: 'notifications',
      notifications,
      unreadCount,
      grouped
    });
  } catch (err) {
    console.error('Error loading notifications:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/api/notifications/unread-count', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const row = await get('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ count: row?.count || 0 });
  } catch (err) {
    res.json({ count: 0 });
  }
});

router.post('/api/notifications/:id/read', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    await run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.get('/tasks', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const tasks = await all(`
      SELECT t.*, l.name as lead_name, l.business_name 
      FROM tasks t 
      JOIN leads l ON t.lead_id = l.id 
      WHERE l.advisor_id = ? AND t.status != 'completed'
      ORDER BY t.due_date ASC
    `, [req.user.id]);
    
    // Group tasks into overdue, today, week, completed
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59);
    
    const tasksData = {
      overdue: [],
      today: [],
      week: [],
      completed: []
    };
    
    tasks.forEach(t => {
      const due = new Date(t.due_date || now);
      if (t.status === 'completed') {
        tasksData.completed.push(t);
      } else if (due < todayStart) {
        tasksData.overdue.push(t);
      } else if (due <= todayEnd) {
        tasksData.today.push(t);
      } else if (due <= weekEnd) {
        tasksData.week.push(t);
      }
    });

    let myLeads;
    if (req.user.role === 'admin') {
      myLeads = await all("SELECT id, name, business_name FROM leads ORDER BY name ASC");
    } else {
      myLeads = await all("SELECT id, name, business_name FROM leads WHERE advisor_id = ? ORDER BY name ASC", [req.user.id]);
    }

    res.render('advisor/tasks', {
      layout: 'admin',
      user: req.user,
      activePage: 'more',
      tasksData,
      myLeads
    });
  } catch (err) {
    console.error('Error loading tasks:', err);
    res.status(500).send('Server Error');
  }
});

async function getPipelineData(userId, userRole, activeType, period, filterFrom, filterTo) {
  let sql = "SELECT * FROM leads WHERE opportunity_type = ?";
  let params = [activeType];

  if (userRole !== 'admin') {
    sql += " AND advisor_id = ?";
    params.push(userId);
  }

  let prevSql = sql;
  let prevParams = [...params];
  let hasPeriodFilter = false;

  if (period === 'this_month') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const from = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    sql += " AND date(created_at) >= ? AND date(created_at) <= ?";
    params.push(from, to);
    hasPeriodFilter = true;
    const prevFrom = `${year}-${month === '01' ? 12 : String(Number(month)-1).padStart(2,'0')}-01`;
    const prevMonth = month === '01' ? 12 : Number(month)-1;
    const prevYear = month === '01' ? year-1 : year;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevTo = `${prevYear}-${String(prevMonth).padStart(2,'0')}-${String(prevLastDay).padStart(2,'0')}`;
    prevSql += " AND date(created_at) >= ? AND date(created_at) <= ?";
    prevParams.push(prevFrom, prevTo);
  } else if (period === 'this_week') {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    sql += " AND date(created_at) >= ? AND date(created_at) <= ?";
    params.push(fmt(monday), fmt(sunday));
    hasPeriodFilter = true;
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevSunday = new Date(prevMonday);
    prevSunday.setDate(prevMonday.getDate() + 6);
    prevSql += " AND date(created_at) >= ? AND date(created_at) <= ?";
    prevParams.push(fmt(prevMonday), fmt(prevSunday));
  } else if (period === 'today') {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    sql += " AND date(created_at) = ?";
    params.push(today);
    hasPeriodFilter = true;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
    prevSql += " AND date(created_at) = ?";
    prevParams.push(yStr);
  }
  if (filterFrom) {
    sql += " AND date(created_at) >= ?";
    params.push(filterFrom);
  }
  if (filterTo) {
    sql += " AND date(created_at) <= ?";
    params.push(filterTo);
  }

  sql += " ORDER BY updated_at DESC";
  const leads = await all(sql, params);

  const pipelineData = {
    stage1: leads.filter(l => Number(l.pipeline_stage) === 1),
    stage2: leads.filter(l => Number(l.pipeline_stage) === 2),
    stage3: leads.filter(l => Number(l.pipeline_stage) === 3),
    stage4: leads.filter(l => Number(l.pipeline_stage) === 4),
    stage5: leads.filter(l => Number(l.pipeline_stage) === 5),
    stage6: leads.filter(l => Number(l.pipeline_stage) === 6),
  };

  const activeLeads = leads.filter(l => [1, 2, 3, 4].includes(Number(l.pipeline_stage)));
  const activePipelineValue = activeLeads.reduce((sum, l) => sum + (l.estimated_premium || 0), 0);
  const activePipelineValueFormatted = activePipelineValue > 1000000
    ? `₦${(activePipelineValue/1000000).toFixed(1)}M`
    : `₦${activePipelineValue.toLocaleString()}`;

  const totalDeals = pipelineData.stage3.length + pipelineData.stage4.length + pipelineData.stage6.length;
  const weightedPremium = leads.reduce((sum, l) => sum + ((l.estimated_premium || 0) * (({3:0.7,4:0.5,5:0.3,6:1})[Number(l.pipeline_stage)] || 0.1)), 0);
  const weightedPremiumFormatted = weightedPremium > 1000000 ? `₦${(weightedPremium/1000000).toFixed(1)}M` : `₦${weightedPremium.toLocaleString()}`;
  const bestCasePremium = [3,4,5,6].reduce((sum,s) => sum + pipelineData[`stage${s}`].reduce((acc,l) => acc + (l.estimated_premium||0), 0), 0);
  const bestCaseFormatted = bestCasePremium > 1000000 ? `₦${(bestCasePremium/1000000).toFixed(1)}M` : `₦${bestCasePremium.toLocaleString()}`;
  const commitPremium = pipelineData.stage4.reduce((sum,l) => sum + (l.estimated_premium||0), 0) + pipelineData.stage6.reduce((sum,l) => sum + (l.estimated_premium||0), 0);
  const commitFormatted = commitPremium > 1000000 ? `₦${(commitPremium/1000000).toFixed(1)}M` : `₦${commitPremium.toLocaleString()}`;
  const wonPremium = pipelineData.stage6.reduce((sum,l) => sum + (l.estimated_premium||0), 0);
  const wonFormatted = wonPremium > 1000000 ? `₦${(wonPremium/1000000).toFixed(1)}M` : `₦${wonPremium.toLocaleString()}`;
  const conversionRate = leads.length > 0 ? ((pipelineData.stage6.length / leads.length) * 100).toFixed(1) : '0.0';
  const quotesSentCount = pipelineData.stage3.length;
  const quotesValueFormatted = pipelineData.stage3.reduce((sum,l) => sum + (l.estimated_premium||0), 0);
  const quotesValue = quotesValueFormatted > 1000000 ? `₦${(quotesValueFormatted/1000000).toFixed(1)}M` : `₦${quotesValueFormatted.toLocaleString()}`;
  const negotiationCount = pipelineData.stage4.length;

  let trendPercent = '';
  if (hasPeriodFilter) {
    prevSql += " ORDER BY updated_at DESC";
    const prevLeads = await all(prevSql, prevParams);
    const prevActive = prevLeads.filter(l => [1,2,3,4].includes(Number(l.pipeline_stage)));
    const prevValue = prevActive.reduce((sum,l) => sum + (l.estimated_premium||0), 0);
    trendPercent = prevValue > 0 ? `${((activePipelineValue - prevValue) / prevValue * 100).toFixed(1)}%` : '+100%';
  } else {
    const now = new Date();
    const currMonthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevMonthStart = `${prevMonthEnd.getFullYear()}-${String(prevMonthEnd.getMonth()+1).padStart(2,'0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currMonthEnd = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;

    if (!filterFrom && !filterTo) {
      const currMonthLeads = await all("SELECT estimated_premium, pipeline_stage FROM leads WHERE opportunity_type = ? AND date(created_at) >= ? AND date(created_at) <= ?", [activeType, currMonthStart, currMonthEnd]);
      const prevMonthLeads = await all("SELECT estimated_premium, pipeline_stage FROM leads WHERE opportunity_type = ? AND date(created_at) >= ? AND date(created_at) <= ?", [activeType, prevMonthStart, `${prevMonthEnd.getFullYear()}-${String(prevMonthEnd.getMonth()+1).padStart(2,'0')}-${String(prevMonthEnd.getDate()).padStart(2,'0')}`]);
      const currActive = currMonthLeads.filter(l => [1,2,3,4].includes(Number(l.pipeline_stage)));
      const prevActive = prevMonthLeads.filter(l => [1,2,3,4].includes(Number(l.pipeline_stage)));
      const currVal = currActive.reduce((sum,l) => sum + (l.estimated_premium||0), 0);
      const prevVal = prevActive.reduce((sum,l) => sum + (l.estimated_premium||0), 0);
      trendPercent = prevVal > 0 ? `${((currVal - prevVal) / prevVal * 100).toFixed(1)}%` : (currVal > 0 ? '+100%' : '0.0%');
    } else {
      trendPercent = 'N/A';
    }
  }
  trendPercent = trendPercent === '0.0%' || trendPercent === 'N/A' ? trendPercent : (trendPercent.startsWith('-') ? trendPercent : `+${trendPercent}`);
  const trendUp = !trendPercent.startsWith('-');

  return {
    pipelineData,
    activePipelineValue,
    activePipelineValueFormatted,
    leads,
    totalDeals,
    weightedPremium,
    weightedPremiumFormatted,
    bestCasePremium,
    bestCaseFormatted,
    commitPremium,
    commitFormatted,
    wonPremium,
    wonFormatted,
    conversionRate,
    quotesSentCount,
    quotesValue,
    negotiationCount,
    trendPercent,
    trendUp
  };
}

router.get('/api/pipeline/data', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const activeType = req.query.type === 'personal' ? 'PERSONAL' : 'BUSINESS';
    const period = req.query.period || '';
    const filterFrom = req.query.from || '';
    const filterTo = req.query.to || '';

    const result = await getPipelineData(req.user.id, req.user.role, activeType, period, filterFrom, filterTo);

    res.json({
      stageCounts: {
        stage1: result.pipelineData.stage1.length,
        stage2: result.pipelineData.stage2.length,
        stage3: result.pipelineData.stage3.length,
        stage4: result.pipelineData.stage4.length,
        stage5: result.pipelineData.stage5.length,
        stage6: result.pipelineData.stage6.length
      },
      activePipelineValue: result.activePipelineValue,
      activePipelineValueFormatted: result.activePipelineValueFormatted,
      totalDeals: result.totalDeals,
      weightedPremiumFormatted: result.weightedPremiumFormatted,
      bestCaseFormatted: result.bestCaseFormatted,
      commitFormatted: result.commitFormatted,
      wonFormatted: result.wonFormatted,
      conversionRate: result.conversionRate,
      quotesSentCount: result.quotesSentCount,
      quotesValue: result.quotesValue,
      negotiationCount: result.negotiationCount,
      trendPercent: result.trendPercent,
      trendUp: result.trendUp,
      opportunities: result.pipelineData.stage3.map(l => ({
        id: l.id,
        business_name: l.business_name || l.name || 'Unknown',
        industry: l.industry || '',
        estimated_premium: l.estimated_premium || 0,
        sales_score: l.sales_score || 0
      }))
    });
  } catch (err) {
    console.error('Error loading pipeline data:', err);
    res.status(500).json({ error: 'Failed to load pipeline data' });
  }
});

router.get('/profile', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const leads = await all("SELECT pipeline_stage, estimated_premium FROM leads WHERE advisor_id = ?", [req.user.id]);
    
    const leadsAdded = leads.length;
    const assessments = leads.filter(l => Number(l.pipeline_stage) >= 2).length;
    const quotesSent = leads.filter(l => Number(l.pipeline_stage) >= 3).length;
    const premiumPipeline = leads.filter(l => [1,2,3,4].includes(Number(l.pipeline_stage))).reduce((acc, l) => acc + (l.estimated_premium || 0), 0);
    const premiumFormatted = premiumPipeline > 1000000 ? `₦${(premiumPipeline/1000000).toFixed(1)}M` : `₦${premiumPipeline.toLocaleString()}`;

    const stats = {
      leadsAdded,
      assessments,
      quotesSent,
      premiumFormatted
    };

    res.render('advisor/profile', {
      layout: 'admin',
      user: req.user,
      activePage: 'more',
      stats
    });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/calendar', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const tasks = await all(`
      SELECT t.*, l.name as lead_name, l.business_name 
      FROM tasks t 
      JOIN leads l ON t.lead_id = l.id 
      WHERE l.advisor_id = ? AND t.status != 'completed'
      ORDER BY t.due_date ASC
    `, [req.user.id]);

    // Same grouping logic as tasks for simplicity, or just pass all
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    const todayTasks = [];
    const upcomingTasks = [];
    
    tasks.forEach(t => {
      const due = new Date(t.due_date || now);
      if (due <= todayEnd) todayTasks.push(t);
      else upcomingTasks.push(t);
    });

    res.render('advisor/calendar', {
      layout: 'admin',
      user: req.user,
      activePage: 'calendar',
      events: tasks
    });
  } catch (err) {
    console.error('Error loading calendar:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/pipeline', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const activeType = req.query.type === 'personal' ? 'PERSONAL' : 'BUSINESS';
    const period = req.query.period || '';
    const filterFrom = req.query.from || '';
    const filterTo = req.query.to || '';

    const {
      pipelineData, activePipelineValueFormatted, totalDeals,
      weightedPremiumFormatted, bestCaseFormatted, commitFormatted, wonFormatted,
      conversionRate, quotesSentCount, quotesValue, negotiationCount,
      trendPercent, trendUp
    } = await getPipelineData(req.user.id, req.user.role, activeType, period, filterFrom, filterTo);

    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const y = now.getFullYear();
    const m = now.getMonth();
    const currentMonthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const currentMonthEnd = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const currentMonthRange = `${monthNames[m]} 1 – ${monthNames[m]} ${lastDay}, ${y}`;

    res.render('advisor/pipeline', {
      layout: 'admin',
      user: req.user,
      activePage: 'pipeline',
      pipelineData,
      activePipelineValueFormatted,
      totalDeals,
      weightedPremiumFormatted,
      bestCaseFormatted,
      commitFormatted,
      wonFormatted,
      conversionRate,
      quotesSentCount,
      quotesValue,
      negotiationCount,
      trendPercent,
      trendUp,
      activeType: activeType.toLowerCase(),
      activeTypeTitle: activeType === 'BUSINESS' ? 'Business' : 'Personal',
      period,
      filterFrom,
      filterTo,
      currentMonthStart,
      currentMonthEnd,
      currentMonthRange
    });
  } catch (err) {
    console.error('Error loading pipeline:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/leaderboard', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const salesUsers = await all("SELECT id, name FROM users WHERE role IN ('sales', 'admin')");
    const wonLeads = await all("SELECT advisor_id, estimated_premium FROM leads WHERE pipeline_stage = 6 AND advisor_id IS NOT NULL");
    
    let advisorsStats = salesUsers.map(user => {
      const userLeads = wonLeads.filter(l => l.advisor_id === user.id);
      const deals = userLeads.length;
      const premium = userLeads.reduce((sum, l) => sum + (l.estimated_premium || 0), 0);
      const points = (deals * 10) + Math.floor(premium / 500000); // arbitrary point logic
      
      const premiumFormatted = premium > 1000000 
        ? `₦${(premium/1000000).toFixed(1)}M` 
        : `₦${premium.toLocaleString()}`;

      return {
        id: user.id,
        name: user.name,
        deals,
        premium,
        premiumFormatted,
        points,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
      };
    });

    advisorsStats.sort((a, b) => b.points - a.points);
    
    advisorsStats = advisorsStats.map((adv, index) => ({
      ...adv,
      rank: index + 1,
      isCurrentUser: adv.id === req.user.id
    }));

    const currentUserStats = advisorsStats.find(a => a.id === req.user.id) || { rank: '-', premiumFormatted: '₦0', deals: 0, points: 0 };
    
    const podium = advisorsStats.slice(0, 3);
    const restList = advisorsStats.slice(3);

    res.render('advisor/leaderboard', {
      layout: 'admin',
      user: req.user,
      activePage: 'leaderboard',
      currentUserStats,
      podium,
      restList,
      hasFirst: podium.length > 0,
      firstPlace: podium[0],
      hasSecond: podium.length > 1,
      secondPlace: podium[1],
      hasThird: podium.length > 2,
      thirdPlace: podium[2]
    });
  } catch (err) {
    console.error('Error loading leaderboard:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/academy', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const levels = await all("SELECT * FROM academy_levels ORDER BY order_index ASC");
    const modules = await all("SELECT * FROM academy_modules WHERE status IS NULL OR status != 'archived' ORDER BY order_index ASC");
    const courses = await all("SELECT * FROM academy_courses ORDER BY order_index ASC");
    const progress = await all("SELECT * FROM academy_progress WHERE user_id = ?", [req.user.id]);
    const enrollments = await all("SELECT course_id FROM academy_enrollments WHERE user_id = ?", [req.user.id]);
    const enrolledCourseIds = new Set(enrollments.map(e => e.course_id));
    
    // Process levels and attach modules and progress
    let totalModules = 0;
    let completedModules = 0;
    let inProgressCount = 0;

    // Track continue learning candidate
    let continueModule = null;

    const processedLevels = levels.map(level => {
      const levelModules = modules.filter(m => m.level_id === level.id).map(m => {
        totalModules++;
        const p = progress.find(pr => pr.module_id === m.id);
        const status = p ? p.status : 'pending';
        if (status === 'completed') completedModules++;
        const enriched = { ...m, status };
        if (status === 'in_progress' && !continueModule) {
          continueModule = enriched;
        }
        if (status === 'pending' && !continueModule && !p) {
          continueModule = enriched;
        }
        return enriched;
      });
      
      const isSplitTrack = level.order_index === 3;
      let personalModules = [];
      let businessModules = [];
      let coreModules = [];
      
      if (isSplitTrack) {
        personalModules = levelModules.filter(m => m.track === 'PERSONAL');
        businessModules = levelModules.filter(m => m.track === 'BUSINESS');
      } else {
        coreModules = levelModules;
      }

      const modsWithStatus = isSplitTrack ? [...personalModules, ...businessModules] : coreModules;
      const completedInLevel = modsWithStatus.filter(m => m.status === 'completed').length;
      const completedPct = modsWithStatus.length > 0 ? Math.round((completedInLevel / modsWithStatus.length) * 100) : 0;

      const firstModuleId = !isSplitTrack && coreModules.length > 0 ? coreModules[0].id : null;
      const firstPersonalModuleId = isSplitTrack && personalModules.length > 0 ? personalModules[0].id : null;
      const firstBusinessModuleId = isSplitTrack && businessModules.length > 0 ? businessModules[0].id : null;

      return { 
        ...level, 
        modules: coreModules,
        isSplitTrack,
        personalModules,
        businessModules,
        completedPct,
        firstModuleId,
        firstPersonalModuleId,
        firstBusinessModuleId
      };
    });

    const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    // Compute achievements
    const pointsEarned = completedModules * 50 + inProgressCount * 10;
    const currentStreak = inProgressCount > 0 ? Math.min(inProgressCount * 2, 30) : 0;

    // Process courses for Level 1 (CCA) with progress
    const ccaCourses = courses.filter(c => c.level_id === 1).map(course => {
      const courseMods = modules.filter(m => m.course_id === course.id);
      let completed = 0;
      let inProgress = false;
      let firstPending = null;
      courseMods.forEach(m => {
        const p = progress.find(pr => pr.module_id === m.id);
        const status = p ? p.status : 'pending';
        if (status === 'completed') completed++;
        if (status === 'in_progress') inProgress = true;
        if (status === 'pending' && !firstPending) firstPending = m;
      });
      return {
        ...course,
        lessonCount: courseMods.length,
        completedLessons: completed,
        progressPct: courseMods.length > 0 ? Math.round((completed / courseMods.length) * 100) : 0,
        inProgress,
        enrolled: enrolledCourseIds.has(course.id),
        firstLessonId: firstPending ? firstPending.id : (courseMods[0] ? courseMods[0].id : null)
      };
    });

    // Featured: pick first course from each level
    const featuredCourses = [];
    for (const level of levels) {
      const levelCourses = courses.filter(c => c.level_id === level.id);
      if (levelCourses.length > 0) {
        featuredCourses.push({ ...levelCourses[0], levelName: level.name, enrolled: enrolledCourseIds.has(levelCourses[0].id) });
      }
      if (featuredCourses.length >= 4) break;
    }

    // Certificates earned
    let certificates = [];
    try {
      certificates = await all("SELECT c.*, co.title as course_title, co.code as course_code FROM academy_certificates c JOIN academy_courses co ON co.id = c.course_id WHERE c.user_id = ?", [req.user.id]);
    } catch(e) { /* table may not exist yet on first run */ }

    res.render('advisor/academy', {
      layout: 'admin',
      user: req.user,
      activePage: 'academy',
      levels: processedLevels,
      ccaCourses,
      progressPercentage,
      completedModules,
      totalModules,
      continueModule,
      featuredCourses,
      certificates,
      streaks: currentStreak,
      pointsEarned,
      badgesUnlocked: completedModules >= 5 ? Math.floor(completedModules / 5) : 0
    });
  } catch (err) {
    console.error('Error loading academy:', err);
    res.status(500).send('Server Error');
  }
});

// ── Academy Course Detail ─────────────────────────────────────────────────
router.get('/academy/course/:id', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const course = await get("SELECT c.*, l.name as level_name FROM academy_courses c JOIN academy_levels l ON l.id = c.level_id WHERE c.id = ?", [courseId]);
    if (!course) return res.status(404).send('Course not found');

    const lessons = await all("SELECT * FROM academy_modules WHERE course_id = ? ORDER BY lesson_number ASC, order_index ASC", [courseId]);
    const progress = await all("SELECT module_id, status FROM academy_progress WHERE user_id = ? AND module_id IN (" + (lessons.length ? lessons.map(m => m.id).join(',') : '0') + ")", [req.user.id]);
    const enrollment = await get("SELECT id, enrolled_at FROM academy_enrollments WHERE user_id = ? AND course_id = ?", [req.user.id, courseId]);
    let completed = 0;
    let totalMin = 0;
    let inProgressLesson = null;
    const enrichedLessons = lessons.map(m => {
      const p = progress.find(pr => pr.module_id === m.id);
      const status = p ? p.status : 'pending';
      if (status === 'completed') completed++;
      if (status === 'in_progress' && !inProgressLesson) inProgressLesson = m;
      totalMin += (m.duration_minutes || 15);
      return { ...m, status };
    });

    const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;
    const continueLesson = inProgressLesson || (enrichedLessons.find(m => m.status === 'pending') || enrichedLessons[0]);
    const hasProgress = completed > 0 || enrichedLessons.some(m => m.status === 'in_progress');

    res.render('advisor/academy-course', {
      layout: 'admin',
      user: req.user,
      activePage: 'academy',
      course,
      lessons: enrichedLessons,
      completed,
      total: lessons.length,
      pct,
      totalMin,
      continueLesson,
      enrolled: !!(enrollment || hasProgress)
    });
  } catch (err) {
    console.error('Error loading course:', err);
    res.status(500).send('Server Error');
  }
});

// ── Academy Module Detail ─────────────────────────────────────────────────
router.get('/academy/module/:id', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    const mod = await get("SELECT * FROM academy_modules WHERE id = ?", [moduleId]);
    if (!mod) return res.status(404).send('Module not found');

    const level = await get("SELECT * FROM academy_levels WHERE id = ?", [mod.level_id]);

    // Get course info if assigned
    let course = null;
    if (mod.course_id) {
      course = await get("SELECT * FROM academy_courses WHERE id = ?", [mod.course_id]);
    }

    // Enforce enrollment gate
    if (mod.course_id) {
      const enrollment = await get("SELECT id FROM academy_enrollments WHERE user_id = ? AND course_id = ?", [req.user.id, mod.course_id]);
      const hadProgress = await get("SELECT id FROM academy_progress WHERE user_id = ? AND module_id IN (SELECT id FROM academy_modules WHERE course_id = ?) LIMIT 1", [req.user.id, mod.course_id]);
      if (!enrollment && !hadProgress) return res.redirect('/advisor/academy/course/' + mod.course_id);
    }

    // Get all modules in this level for progress calculation
    const levelModules = await all("SELECT id FROM academy_modules WHERE level_id = ? AND (status IS NULL OR status != 'archived') ORDER BY order_index", [mod.level_id]);
    const levelProgress = await all("SELECT module_id, status FROM academy_progress WHERE user_id = ? AND module_id IN (" + levelModules.map(m => m.id).join(',') + ")", [req.user.id]);
    const levelCompleted = levelProgress.filter(p => p.status === 'completed').length;
    const levelTotal = levelModules.length;
    const levelPct = levelTotal > 0 ? Math.round((levelCompleted / levelTotal) * 100) : 0;

    // User's status for this module
    const progress = await get("SELECT status FROM academy_progress WHERE user_id = ? AND module_id = ?", [req.user.id, moduleId]);
    const status = progress ? progress.status : 'pending';

    // Get prev/next modules in the same course (or level if no course)
    let prevModule = null;
    let nextModule = null;
    if (mod.course_id) {
      const courseMods = await all("SELECT id, title, lesson_number FROM academy_modules WHERE course_id = ? ORDER BY lesson_number ASC, order_index ASC", [mod.course_id]);
      const curIdx = courseMods.findIndex(m => m.id === moduleId);
      prevModule = curIdx > 0 ? courseMods[curIdx - 1] : null;
      nextModule = curIdx < courseMods.length - 1 ? courseMods[curIdx + 1] : null;

      // Sequential gate: the previous lesson must be completed before accessing the next one
      if (prevModule) {
        const prevProgress = await get("SELECT status FROM academy_progress WHERE user_id = ? AND module_id = ?", [req.user.id, prevModule.id]);
        if (!prevProgress || prevProgress.status !== 'completed') {
          return res.redirect('/advisor/academy/module/' + prevModule.id + '?locked=1');
        }
      }
    } else {
      const allMods = await all("SELECT id, title, order_index FROM academy_modules WHERE level_id = ? AND (status IS NULL OR status != 'archived') ORDER BY order_index", [mod.level_id]);
      const curIdx = allMods.findIndex(m => m.id === moduleId);
      prevModule = curIdx > 0 ? allMods[curIdx - 1] : null;
      nextModule = curIdx < allMods.length - 1 ? allMods[curIdx + 1] : null;
    }

    // Parse quiz data
    let quizData = null;
    if (mod.quiz_data) {
      try { quizData = JSON.parse(mod.quiz_data); } catch(e) { quizData = null; }
    }

    // Whether the user has passed this lesson's quiz (required to complete the lesson)
    let quizPassed = false;
    if (mod.quiz_data) {
      const passedResult = await get("SELECT id FROM academy_quiz_results WHERE user_id = ? AND module_id = ? AND passed = 1 LIMIT 1", [req.user.id, moduleId]);
      quizPassed = !!passedResult;
    }

    // Convert workbook "Write your notes here" placeholder boxes into editable textareas
    let workbookContent = mod.workbook_content || null;
    if (workbookContent) {
      let noteIndex = 0;
      workbookContent = workbookContent.replace(
        /<div[^>]*dashed[^>]*>[\s\S]*?Write your notes here[\s\S]*?<\/div>/gi,
        () => `<textarea class="wb-note" data-note-index="${noteIndex++}" rows="4" placeholder="Write your notes here"></textarea>`
      );
    }
    let caseStudy = mod.case_study || null;
    let resources = null;
    if (mod.resources) {
      try { resources = JSON.parse(mod.resources); } catch(e) { resources = null; }
    }

    // Get AI Coach conversation history for this module
    let coachHistory = null;
    try {
      coachHistory = await all("SELECT role, message, created_at FROM academy_coach_history WHERE user_id = ? AND module_id = ? ORDER BY created_at ASC",
        [req.user.id, moduleId]);
    } catch(e) { /* table may not exist yet */ }

    res.render('advisor/academy-module', {
      layout: 'admin',
      user: req.user,
      activePage: 'academy',
      module: mod,
      level,
      course,
      status,
      levelProgress: levelPct,
      levelCompleted,
      levelTotal,
      prevModule,
      nextModule,
      quizData,
      quizPassed,
      locked: !!req.query.locked,
      workbookContent,
      caseStudy,
      resources,
      coachHistory,
      hasQuiz: !!quizData,
      hasWorkbook: !!workbookContent,
      hasCaseStudy: !!caseStudy,
      hasResources: !!resources,
      videoUrl: mod.video_url,
      videoScript: mod.video_script
    });
  } catch (err) {
    console.error('Error loading module:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/api/academy/progress', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const { moduleId, status } = req.body;
    if (!moduleId || !['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }

    // A lesson with a quiz cannot be marked completed until the quiz is passed
    if (status === 'completed') {
      const mod = await get("SELECT quiz_data FROM academy_modules WHERE id = ?", [moduleId]);
      if (mod && mod.quiz_data) {
        const passedResult = await get("SELECT id FROM academy_quiz_results WHERE user_id = ? AND module_id = ? AND passed = 1 LIMIT 1", [req.user.id, moduleId]);
        if (!passedResult) {
          return res.status(400).json({ success: false, error: 'Pass the lesson quiz before completing this lesson' });
        }
      }
    }

    const existing = await get("SELECT id FROM academy_progress WHERE user_id = ? AND module_id = ?", [req.user.id, moduleId]);

    if (existing) {
      await run("UPDATE academy_progress SET status = ? WHERE id = ?", [status, existing.id]);
    } else {
      await run(
        "INSERT INTO academy_progress (user_id, module_id, status, completed_at) VALUES (?, ?, ?, ?)",
        [req.user.id, moduleId, status === 'completed' ? 'completed' : 'in_progress', status === 'completed' ? "datetime('now')" : null]
      );
    }

    res.json({ success: true, message: status === 'completed' ? '🎉 Lesson completed!' : status === 'in_progress' ? 'Progress saved' : 'Progress reset' });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ success: false, error: 'Failed to update progress' });
  }
});

// ── Academy Enrollment ──────────────────────────────────────────────────
router.post('/api/academy/enroll/:courseId', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const course = await get("SELECT id FROM academy_courses WHERE id = ?", [courseId]);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    await run(
      "INSERT OR IGNORE INTO academy_enrollments (user_id, course_id, status) VALUES (?, ?, 'enrolled')",
      [req.user.id, courseId]
    );

    res.json({ success: true, message: '🎓 Enrolled in course!' });
  } catch (err) {
    console.error('Error enrolling:', err);
    res.status(500).json({ success: false, error: 'Failed to enroll' });
  }
});

// ── Quiz Submission ──────────────────────────────────────────────────────
router.post('/api/academy/quiz/submit', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const { moduleId, answers } = req.body;
    if (!moduleId || !answers) return res.status(400).json({ success: false, error: 'Missing moduleId or answers' });

    const mod = await get("SELECT quiz_data FROM academy_modules WHERE id = ?", [moduleId]);
    if (!mod || !mod.quiz_data) return res.status(404).json({ success: false, error: 'Quiz not found' });

    const quiz = JSON.parse(mod.quiz_data);
    let score = 0;
    const total = quiz.length;
    const results = quiz.map(q => {
      const userAnswer = answers[q.id];
      const correct = userAnswer === q.correctIndex;
      if (correct) score++;
      return {
        questionId: q.id,
        question: q.question,
        correct,
        correctIndex: q.correctIndex,
        userAnswer,
        explanation: q.explanation
      };
    });

    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;

    // Store quiz result
    await run(`INSERT INTO academy_quiz_results (user_id, module_id, score, total, percentage, passed, answers, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [req.user.id, moduleId, score, total, percentage, passed ? 1 : 0, JSON.stringify(answers)]);

    // Auto-mark as completed if passed
    if (passed) {
      const existing = await get("SELECT id FROM academy_progress WHERE user_id = ? AND module_id = ?", [req.user.id, moduleId]);
      if (existing) {
        await run("UPDATE academy_progress SET status = 'completed', completed_at = datetime('now') WHERE id = ?", [existing.id]);
      } else {
        await run("INSERT INTO academy_progress (user_id, module_id, status, completed_at) VALUES (?, ?, 'completed', datetime('now'))",
          [req.user.id, moduleId]);
      }
    }

    res.json({ success: true, score, total, percentage, passed, results });
  } catch (err) {
    console.error('Error submitting quiz:', err);
    res.status(500).json({ success: false, error: 'Failed to submit quiz' });
  }
});

// ── AI Learning Coach ────────────────────────────────────────────────────
router.post('/api/academy/coach/ask', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const { moduleId, message } = req.body;
    if (!moduleId || !message) return res.status(400).json({ success: false, error: 'Missing moduleId or message' });

    const mod = await get("SELECT title, content FROM academy_modules WHERE id = ?", [moduleId]);
    if (!mod) return res.status(404).json({ success: false, error: 'Module not found' });

    // Save user message
    await run(`INSERT INTO academy_coach_history (user_id, module_id, role, message, created_at) VALUES (?, ?, 'user', ?, datetime('now'))`,
      [req.user.id, moduleId, message]);

    // Get conversation history
    const history = await all("SELECT role, message FROM academy_coach_history WHERE user_id = ? AND module_id = ? ORDER BY created_at ASC",
      [req.user.id, moduleId]);

    const lessonContext = mod.content ? mod.content.replace(/<[^>]*>/g, '').substring(0, 1500) : '';
    const conversationContext = history.slice(-6).map(h => `${h.role}: ${h.message}`).join('\n');

    const prompt = `You are the CoverScore AI Learning Coach, a Socratic tutor helping a student learn about "${mod.title}".
Use the Socratic method — never give answers directly, instead ask guiding questions that lead the student to discover the answer themselves.
Keep responses concise (2-4 sentences) and encouraging.

LESSON CONTENT:
${lessonContext}

CONVERSATION SO FAR:
${conversationContext}

Student: ${message}
Coach:`;

    // Call AI service (using the existing AI configuration from the app)
    const response = await fetch(process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY || process.env.OPENAI_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    let coachReply = 'I am here to help you learn. Could you tell me what you understand about this topic so far?';

    if (response.ok) {
      const data = await response.json();
      coachReply = data.choices?.[0]?.message?.content || coachReply;
    } else if (response.status === 503) {
      // Provider request queue is full — signal the client to retry shortly.
      return res.status(503).json({ success: false, retryable: true, error: 'The request queue is full. Please try again.' });
    } else {
      const errText = await response.text().catch(() => '');
      console.error('AI Coach upstream error:', response.status, errText.slice(0, 300));
    }

    // Save coach response
    await run(`INSERT INTO academy_coach_history (user_id, module_id, role, message, created_at) VALUES (?, ?, 'coach', ?, datetime('now'))`,
      [req.user.id, moduleId, coachReply]);

    res.json({ success: true, message: coachReply });
  } catch (err) {
    console.error('Error in AI Coach:', err);
    // Return fallback response on error
    res.json({ success: true, message: 'That is a great question! Think about what you have learned in this lesson so far. What part of the concept would you like me to help clarify?' });
  }
});

// ── Certificate Generation ───────────────────────────────────────────────
router.get('/api/academy/certificate/:courseId', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const course = await get("SELECT * FROM academy_courses WHERE id = ?", [courseId]);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const lessons = await all("SELECT id FROM academy_modules WHERE course_id = ?", [courseId]);
    if (!lessons.length) return res.status(404).json({ success: false, error: 'No lessons in course' });

    const completed = await all("SELECT module_id FROM academy_progress WHERE user_id = ? AND module_id IN (" + lessons.map(m => m.id).join(',') + ") AND status = 'completed'", [req.user.id]);
    if (completed.length < lessons.length) {
      return res.status(400).json({ success: false, error: 'Complete all lessons first', completed: completed.length, total: lessons.length });
    }

    // Check if certificate already exists
    let cert = await get("SELECT * FROM academy_certificates WHERE user_id = ? AND course_id = ?", [req.user.id, courseId]);

    if (!cert) {
      const certId = 'CSC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const userName = req.user.name || req.user.email || 'Learner';
      await run(`INSERT INTO academy_certificates (certificate_id, user_id, course_id, user_name, issued_at) VALUES (?, ?, ?, ?, datetime('now'))`,
        [certId, req.user.id, courseId, userName]);
      cert = await get("SELECT * FROM academy_certificates WHERE certificate_id = ?", [certId]);
    }

    res.json({ success: true, certificate: cert });
  } catch (err) {
    console.error('Error generating certificate:', err);
    res.status(500).json({ success: false, error: 'Failed to generate certificate' });
  }
});

router.get('/copilot', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const leadId = parseInt(req.query.lead) || null;
    let selectedLead = null;
    let copilotBrief = null;
    let rieData = null;
    let followUp = null;

    if (leadId) {
      selectedLead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
    } else {
      selectedLead = await get('SELECT * FROM leads WHERE assessment_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1');
    }

    if (selectedLead) {
      if (selectedLead.assessment_data) {
        try {
          const ad = typeof selectedLead.assessment_data === 'string'
            ? JSON.parse(selectedLead.assessment_data)
            : selectedLead.assessment_data;
          if (ad.rie) {
            rieData = ad.rie;
            copilotBrief = ad.rie.copilotBrief || null;
            followUp = ad.rie.followUp || null;
          }
        } catch (e) { /* silent */ }
      }

      if (!rieData && selectedLead.assessment_id) {
        const assessment = await get('SELECT answers, ai_report FROM assessments WHERE id = ?', [selectedLead.assessment_id]);
        if (assessment && assessment.ai_report) {
          try {
            const aiData = JSON.parse(assessment.ai_report);
            rieData = { copilotBrief: aiData.copilot || null };
            copilotBrief = aiData.copilot || null;
          } catch (e) { /* silent */ }
        }
      }

      if (selectedLead.assessment_data && !rieData) {
        try {
          const ad = typeof selectedLead.assessment_data === 'string'
            ? JSON.parse(selectedLead.assessment_data)
            : selectedLead.assessment_data;
          if (ad.rieMetadata) {
            rieData = { rieMetadata: ad.rieMetadata };
          }
        } catch (e) { /* silent */ }
      }
    }

    res.render('advisor/copilot', {
      layout: false,
      user: req.user,
      activePage: 'copilot',
      selectedLead,
      copilotBrief,
      rieData,
      followUp,
      leadId: selectedLead?.id || null
    });
  } catch (err) {
    console.error('Error loading copilot:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/api/copilot-chat', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId, message } = req.body;
    if (!leadId || !message) {
      return res.status(400).json({ error: 'Missing leadId or message' });
    }

    const lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    let assessmentAnswers = null;
    let aiReport = null;
    if (lead.assessment_id) {
      const assessment = await get('SELECT answers, ai_report FROM assessments WHERE id = ?', [lead.assessment_id]);
      if (assessment) {
        assessmentAnswers = assessment.answers ? JSON.parse(assessment.answers) : null;
        aiReport = assessment.ai_report ? JSON.parse(assessment.ai_report) : null;
      }
    }

    let chatHistory = [];
    try {
      const parsed = JSON.parse(lead.chat_history || '{}');
      chatHistory = Array.isArray(parsed.__messages) ? parsed.__messages : [];
    } catch(e) {}

    const leadContext = {
      lead_profile: {
        name: lead.name,
        business_name: lead.business_name,
        industry: lead.industry,
        employees: lead.employees,
        risk_level: lead.risk_level,
        score: lead.score,
        status: lead.status,
        sales_score: lead.sales_score,
        estimated_premium: lead.estimated_premium
      },
      assessment: assessmentAnswers,
      ai_report_summary: aiReport,
      whatsapp_history: chatHistory.slice(-20) // Only send last 20 messages to save tokens
    };

    const response = await handleAdvisorCopilotChat(leadContext, message);
    res.json({ response });

  } catch (err) {
    console.error('Copilot Chat API Error:', err);
    res.status(500).json({ error: 'Failed to process copilot request' });
  }
});

router.post('/api/export-docx', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const { htmlContent, filename } = req.body;
    if (!htmlContent) return res.status(400).json({ error: 'No htmlContent provided' });

    const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'proposal'}.docx"`);
    res.send(docxBuffer);
  } catch (err) {
    console.error('DOCX Export Error:', err);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

router.post('/api/leads/:id/assign', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const leadId = req.params.id;
    const advisorId = req.user.id;
    const lead = await get('SELECT name FROM leads WHERE id = ?', [leadId]);
    await run('UPDATE leads SET advisor_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [advisorId, leadId]);
    notify(advisorId, 'lead_assigned', 'Lead Assigned', `You have been assigned ${lead?.name || 'a new lead'}`, `/advisor/pipeline`);
    res.json({ success: true });
  } catch (err) {
    console.error('Assign Error:', err);
    res.status(500).json({ error: 'Failed to assign lead' });
  }
});

router.post('/api/leads/:id/stage', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const leadId = req.params.id;
    const stage = parseInt(req.body.stage);
    
    if (isNaN(stage) || stage < 1 || stage > 6) {
      return res.status(400).json({ error: 'Invalid stage. Must be 1-6' });
    }

    const stageLabels = ['', 'New', 'Assessment', 'Quote', 'Negotiation', 'Closed Won', 'Lost'];
    const lead = await get('SELECT name, advisor_id FROM leads WHERE id = ?', [leadId]);
    await run('UPDATE leads SET pipeline_stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [stage, leadId]);
    if (lead?.advisor_id) {
      notify(lead.advisor_id, 'stage_update', 'Pipeline Stage Updated', `${lead.name} moved to ${stageLabels[stage] || stage}`, `/advisor/pipeline`);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Pipeline Update Error:', err);
    res.status(500).json({ error: 'Failed to update pipeline stage' });
  }
});

// --- PERSONAL OPPORTUNITIES MODULE ---

router.get('/opportunities', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const { all } = require('../config/database');
    const filter = req.query.filter || 'all';
    let query = `
      SELECT o.*, l.name as lead_name, l.phone as lead_phone 
      FROM opportunities o
      LEFT JOIN leads l ON o.lead_id = l.id
      WHERE o.advisor_id = ? AND o.stage != 'Closed Lost'
    `;
    let params = [req.user.id];

    if (filter === 'new') {
      query += ` AND o.stage = 'unassigned'`;
    } else if (filter === 'nurture') {
      query += ` AND o.stage = 'Nurture'`;
    }

    query += ` ORDER BY 
      CASE WHEN o.opportunity_priority = 'Urgent' THEN 1
           WHEN o.opportunity_priority = 'High' THEN 2
           WHEN o.opportunity_priority = 'Standard' THEN 3
           ELSE 4 END, o.updated_at DESC`;

    const rawOpps = await all(query, params);
    
    // Process opportunities for view
    const opportunities = rawOpps.map(o => {
      let topPriorities = [];
      try { topPriorities = JSON.parse(o.top_priorities || '[]'); } catch(e) {}
      
      const badgeClass = o.opportunity_priority === 'Urgent' ? 'bg-red-500' : 
                         o.opportunity_priority === 'High' ? 'bg-orange-500' : 'bg-blue-500';

      let nextAction = 'Review Assessment';
      if (o.stage === 'unassigned') nextAction = 'Assign to self';
      else if (o.stage === 'assigned') nextAction = 'Send first message';
      else if (o.stage === 'Contact Attempted') nextAction = 'Record outcome';
      else if (o.stage === 'Conversation Started') nextAction = 'Book Review';

      return {
        ...o,
        lead_initial: o.lead_name ? o.lead_name.charAt(0) : 'U',
        top_priority: topPriorities[0]?.name || 'General Protection',
        badgeClass,
        nextAction
      };
    });

    const counts = {
      active: opportunities.length,
      high_priority: opportunities.filter(o => o.opportunity_priority === 'High' || o.opportunity_priority === 'Urgent').length,
      due_today: 0 // Mock for now until tasks are linked
    };

    res.render('advisor/opportunities', {
      title: 'My Opportunities',
      activePage: 'opportunities',
      layout: false,
      opportunities,
      counts,
      activeFilter: filter
    });
  } catch (err) {
    console.error('Opportunities Error:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/opportunities/:id', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const { get, all } = require('../config/database');
    const opp = await get(`
      SELECT o.*, l.name as lead_name, l.phone as lead_phone, l.state as lead_state 
      FROM opportunities o
      LEFT JOIN leads l ON o.lead_id = l.id
      WHERE o.id = ? AND (o.advisor_id = ? OR o.advisor_id IS NULL)
    `, [req.params.id, req.user.id]);

    if (!opp) return res.status(404).send('Opportunity not found');

    const timeline = await all(`SELECT * FROM audit_logs WHERE entity_id = ? AND entity_type = 'opportunity' ORDER BY created_at DESC`, [opp.id]);
    
    let riskDna = [];
    let topPriorities = [];
    try { riskDna = JSON.parse(opp.risk_dna || '[]'); } catch(e) {}
    try { topPriorities = JSON.parse(opp.top_priorities || '[]'); } catch(e) {}

    let nextAction = { label: 'Send first WhatsApp message', type: 'message' };
    if (opp.stage === 'Contact Attempted') nextAction = { label: 'Log Contact Outcome', type: 'log' };
    else if (opp.stage === 'Conversation Started') nextAction = { label: 'Book Protection Review', type: 'book' };

    res.render('advisor/opportunity-detail', {
      title: 'Opportunity Detail',
      layout: false,
      opp: {
        ...opp,
        lead_initial: opp.lead_name ? opp.lead_name.charAt(0) : 'U',
        risk_dna: riskDna,
        top_priorities: topPriorities,
        nextAction
      },
      timeline
    });
  } catch (err) {
    console.error('Opportunity Detail Error:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/api/opportunities/:id/stage', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const oppId = req.params.id;
    const { stage, reason, nextDate } = req.body;
    
    await run('UPDATE opportunities SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [stage, oppId]);
    await run('INSERT INTO audit_logs (id, event_type, entity_type, entity_id, actor_id, metadata) VALUES (?, ?, ?, ?, ?, ?)', [
      Date.now().toString(), 'STAGE_CHANGE', 'opportunity', oppId, req.user.id, JSON.stringify({ new_stage: stage, reason })
    ]);

    const opp = await get('SELECT lead_name, advisor_id FROM opportunities WHERE id = ?', [oppId]);
    if (opp?.advisor_id) {
      notify(opp.advisor_id, 'opportunity_update', 'Opportunity Updated', `${opp.lead_name || 'An opportunity'} moved to ${stage}`, `/advisor/opportunities/${oppId}`);
    }
    
    // Auto-create task if necessary
    if (stage === 'Contact Attempted') {
      await run('INSERT INTO tasks (title, description, status, due_date, created_by) VALUES (?, ?, ?, ?, ?)', [
        'Follow up after contact attempt', reason || '', 'pending', nextDate || new Date().toISOString(), req.user.id
      ]);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Stage Update Error:', err);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

router.get('/team-queue', authenticatePage, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
  try {
    const { all } = require('../config/database');
    const queue = await all(`
      SELECT o.*, l.name as lead_name
      FROM opportunities o
      LEFT JOIN leads l ON o.lead_id = l.id
      WHERE o.stage = 'unassigned' OR o.opportunity_priority = 'Urgent'
      ORDER BY o.created_at DESC
    `);
    
    res.render('advisor/team-queue', {
      title: 'Team Queue',
      layout: false,
      activePage: 'team-queue',
      queue
    });
  } catch (err) {
    console.error('Team Queue Error:', err);
    res.status(500).send('Server Error');
  }
});

// ===== Quote Builder =====

router.get('/quote-builder/:leadId', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const { get } = require('../config/database');
    const ratingEngine = require('../rating/engine');
    const { recommendProducts } = require('../rating/recommender');
    const lead = await get('SELECT * FROM leads WHERE id = ?', [req.params.leadId]);
    if (!lead) return res.status(404).send('Lead not found');

    let prefix = null;
    let assessmentData = {};
    if (lead.assessment_data) {
      try {
        const ad = typeof lead.assessment_data === 'string' ? JSON.parse(lead.assessment_data) : lead.assessment_data;
        assessmentData = ad;
        if (ad.answers && ad.answers.template_selection) prefix = ad.answers.template_selection.template_id;
      } catch (e) {}
    }

    let assessmentWithReport = null;
    if (lead.assessment_id) {
      const a = await get('SELECT answers, ai_report FROM assessments WHERE id = ?', [lead.assessment_id]);
      if (a) {
        assessmentWithReport = a;
        if (!prefix && a.answers) {
          try {
            const parsed = typeof a.answers === 'string' ? JSON.parse(a.answers) : a.answers;
            if (parsed.template_selection) prefix = parsed.template_selection.template_id;
          } catch (e) {}
        }
      }
    }
    if (!prefix && lead.industry) {
      const flowMap = { school: 'SCH', hospital: 'HOS', manufacturing: 'MFG', church: 'CHR', sme: 'SME', business: 'BUS', personal: 'FAM', individual: 'FAM' };
      prefix = flowMap[lead.industry.toLowerCase()] || null;
    }

    const allRatingProducts = await ratingEngine.getProducts('BUSINESS');
    const recommended = await recommendProducts(lead, assessmentWithReport || assessmentData, allRatingProducts, prefix);

    const productsWithClasses = await Promise.all(recommended.map(async (p) => {
      const classInfo = await ratingEngine.suggestClasses(p.code, prefix);
      return {
        code: p.code,
        name: p.name,
        description: p.description,
        icon: p.icon,
        inputSchema: p.inputSchema,
        classes: classInfo.classes,
        suggestedClass: classInfo.suggested,
        selected: true,
        priority: p.priority,
        reason: p.reason,
        pillarScore: p.pillarScore,
      };
    }));

    productsWithClasses.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] || 2) - (order[b.priority] || 2);
    });

    res.render('advisor/quote-builder', {
      layout: false,
      user: req.user,
      activePage: 'quote-builder',
      lead,
      products: JSON.stringify(productsWithClasses),
      prefix: prefix || 'FAM',
      hasRie: !!assessmentWithReport,
      totalMin: 0,
      totalMax: 0
    });
  } catch (err) {
    console.error('Quote Builder Error:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/api/quote-builder/generate', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const { run, get } = require('../config/database');
    const { leadId, products: selectedProducts } = req.body;

    if (!leadId || !selectedProducts || !Array.isArray(selectedProducts)) {
      return res.status(400).json({ error: 'leadId and products array required' });
    }

    const lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const activeProducts = selectedProducts.filter(p => p.selected !== false);

    const productData = activeProducts.map(p => ({
      product: p.product,
      reason: p.reason || 'Recommended based on assessment',
      estimatedPremium: { min: p.premiumMin || 10000, max: p.premiumMax || 50000 }
    }));

    const assessmentData = {
      name: lead.name,
      business_name: lead.business_name,
      email: lead.email,
      score: lead.score || 50,
      risk_level: lead.risk_level || 'Moderate',
      scored_pillars: {},
      answers: {}
    };

    if (lead.assessment_id) {
      const assessment = await get('SELECT answers, ai_report FROM assessments WHERE id = ?', [lead.assessment_id]);
      if (assessment) {
        assessmentData.scored_pillars = {};
        if (assessment.ai_report) {
          try {
            const aiData = JSON.parse(assessment.ai_report);
            if (aiData.pillar_scores) assessmentData.scored_pillars = aiData.pillar_scores;
          } catch (e) { /* silent */ }
        }
        if (assessment.answers) {
          try {
            const parsed = JSON.parse(assessment.answers);
            if (parsed.answers) assessmentData.answers = parsed.answers;
          } catch (e) { /* silent */ }
        }
      }
    }

    const { generateProposal } = require('../proposals/generator');
    const result = generateProposal(assessmentData, productData, {
      name: req.user?.name || 'CoverScore Advisor',
      phone: process.env.WHATSAPP_BOT_NUMBER,
      email: process.env.ADMIN_EMAIL || 'advisor@coverscore.ai'
    });

    const crypto = require('crypto');
    const token = crypto.randomBytes(16).toString('hex');
    const totalPremium = activeProducts.reduce((s, p) => s + (p.premiumMax || 0), 0);

    const proposalId = (await run(
      'INSERT INTO proposals (lead_id, advisor_id, title, content, amount, status, token) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [leadId, req.user?.id,
       `CoverScore Proposal - ${lead.business_name || lead.name} - ${new Date().toLocaleDateString()}`,
       JSON.stringify(result), totalPremium, 'Generated', token]
    )).lastInsertRowid;

    const proposal = await get('SELECT * FROM proposals WHERE id = ?', [proposalId]);

    await run('UPDATE leads SET status = "Proposal Ready", pipeline_stage = 3, estimated_premium = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [totalPremium, leadId]);

    res.json({
      success: true,
      proposal,
      proposalUrl: `/advisor/proposal-writer/${leadId}`,
      htmlUrl: result.htmlUrl,
      pdfUrl: result.pdfUrl
    });

    // Notify advisor
    notify(req.user.id, 'quote_generated', 'Proposal Generated', `Proposal ready for ${lead.business_name || lead.name} — ₦${totalPremium.toLocaleString()} total`, `/advisor/proposal-writer/${leadId}`);
  } catch (err) {
    console.error('Quote Builder Generate Error:', err);
    res.status(500).json({ error: 'Failed to generate proposal' });
  }
});

module.exports = router;
