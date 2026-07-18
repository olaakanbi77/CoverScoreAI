const express = require('express');
const { all, get, db, computeLeadScore } = require('./config/database');
const exphbs = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessment');
const leadsRoutes = require('./routes/leads');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const publicRoutes = require('./routes/public');
const whatsappRoutes = require('./routes/whatsapp');
const crmRoutes = require('./routes/crm');
const advisorRoutes = require('./routes/advisor');
const proposalsRoutes = require('./routes/proposals');
const documentsRoutes = require('./routes/documents');
const reportsRoutes = require('./routes/reports');
const ratingRoutes = require('./routes/rating');

const { authenticate, authenticatePage, optionalAuth } = require('./middleware/auth');

const app = express();
app.set('trust proxy', 1);
app.set('view cache', false);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: false,
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  helpers: {
    eq: (a, b) => a === b,
    ne: (a, b) => a !== b,
    or: (a, b) => a || b,
    and: (a, b) => a && b,
    not: (a) => !a,
    userInitials: (name) => {
      if (!name) return '??';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    },
    formatDate: (date) => new Date(date).toLocaleDateString(),
    formatDateShort: (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },
    formatNumber: (num) => {
      if (num == null) return '0';
      return Number(num).toLocaleString('en-US');
    },
    gte: (a, b) => Number(a) >= Number(b),
    lte: (a, b) => Number(a) <= Number(b),
    substring: (str, start, len) => String(str || '').substring(start, len),
    json: (obj) => JSON.stringify(obj),
    toLowerCase: (str) => String(str).toLowerCase(),
    titleCase: (str) => String(str || '').replace(/\b\w/g, c => c.toUpperCase()),
    avatarColor: (status) => {
      const map = { Generated: 'orange', Draft: 'orange', Sent: 'green', Expired: 'red' };
      return map[status] || 'blue';
    },
    statusBadgeClass: (status) => {
      const map = { Generated: 'orange', Draft: 'orange', Sent: 'green', Expired: 'red' };
      return map[status] || 'orange';
    },
    statusIcon: (status) => {
      if (status === 'Sent') return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="10" height="10"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>';
      if (status === 'Expired') return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="10" height="10"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
      return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="10" height="10"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>';
    },
    notifColor: (type) => {
      const map = { lead_assigned: 'c-indigo', new_opportunity: 'c-purple', follow_up_scheduled: 'c-orange', stage_update: 'c-blue', high_priority_opportunity: 'c-red', quote_generated: 'c-teal' };
      return map[type] || 'c-blue';
    },
    notifIcon: (type) => {
      const icons = {
        lead_assigned: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
        new_opportunity: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
        follow_up_scheduled: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
        stage_update: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>',
        high_priority_opportunity: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
        quote_generated: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'
      };
      return icons[type] || icons.stage_update;
    },
    timeAgo: (date) => {
      if (!date) return '';
      const now = new Date();
      const d = new Date(date);
      const diff = Math.floor((now - d) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
      return d.toLocaleDateString();
    },
    relativeDate: (date) => {
      if (!date) return '';
      const now = new Date();
      const d = new Date(date);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diffDays = Math.floor((today - target) / 86400000);
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return diffDays + 'd ago';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },
    slice: (arr, start, end) => {
      if (!arr || !Array.isArray(arr)) return [];
      return arr.slice(start, end);
    }
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too Many Requests', message: 'Please try again later' }
});
app.use('/api', limiter);

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

const industryContent = require('./data/industry_content.json');

app.get('/', (req, res) => {
  res.render('landing', { 
    title: 'CoverScore AI', 
    layout: false,
    trigger: industryContent['school'].trigger,
    data: industryContent['school']
  });
});

app.get('/:industry', (req, res, next) => {
  const industryKey = req.params.industry.toLowerCase();
  
  // Ignore reserved routes so they fall through
  const reserved = ['login', 'api', 'webhook', 'whatsapp', 'admin', 'advisor', 'dashboard', 'wipe-db-xyz123', 'quote-request', 'consultation-request', 'personal'];
  if (reserved.includes(industryKey)) return next();

  if (industryContent[industryKey]) {
    res.render('landing', { 
      title: industryContent[industryKey].title, 
      layout: false,
      trigger: industryContent[industryKey].trigger,
      data: industryContent[industryKey]
    });
  } else {
    next(); // 404 or fall through
  }
});

app.get('/wipe-db-xyz123', async (req, res) => {
  const { run } = require('./config/database');
  try {
    await run('DELETE FROM policies');
    await run('DELETE FROM proposals');
    await run('DELETE FROM activities');
    await run('DELETE FROM tasks');
    await run('DELETE FROM leads');
    await run('DELETE FROM assessments');
    await run('DELETE FROM sqlite_sequence WHERE name IN ("leads", "assessments", "policies", "proposals", "activities", "tasks")');
    res.send('<h1>Database leads and assessments wiped successfully!</h1><a href="/advisor/dashboard">Go to Dashboard</a>');
  } catch (err) {
    res.status(500).send('Error wiping db: ' + err.message);
  }
});

app.get('/auth/login', (req, res) => {
  res.render('auth/login', { title: 'Sign In', layout: 'auth' });
});

app.get('/auth/register', (req, res) => {
  res.render('auth/register', { title: 'Sign Up', layout: 'auth' });
});

app.get('/start-whatsapp', (req, res) => {
  const botNumber = process.env.WHATSAPP_BOT_NUMBER || '2349165304629';
  const textMsg = req.query.text || 'START ASSESSMENT';
  const text = encodeURIComponent(textMsg);
  res.redirect(`https://wa.me/${botNumber}?text=${text}`);
});

app.get('/family', (req, res) => {
  res.render('coverscore-personal-family', { 
    title: 'Free Family Protection Score™ | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/family/calculator', (req, res) => {
  res.render('coverscore-personal-family-calculator', { 
    title: 'Family Exposure Calculator | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/retirement', (req, res) => {
  res.render('coverscore-personal-retirement', { 
    title: 'Free Retirement Readiness Score™ | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/retirement/calculator', (req, res) => {
  res.render('coverscore-personal-retirement-calculator', { 
    title: 'Retirement Exposure Calculator | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/health-protection', (req, res) => {
  res.render('coverscore-personal-health', { 
    title: 'Free Health Protection Score™ | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/health/calculator', (req, res) => {
  res.render('coverscore-personal-health-calculator', { 
    title: 'Health Exposure Calculator | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/income', (req, res) => {
  res.render('coverscore-personal-income', { 
    title: 'Free Income Protection Score™ | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/income/calculator', (req, res) => {
  res.render('coverscore-personal-income-calculator', { 
    title: 'Income Exposure Calculator | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/young-professional', (req, res) => {
  res.render('coverscore-personal-young-professional', { 
    title: 'Free Young Pro Score™ | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/young-professional/calculator', (req, res) => {
  res.render('coverscore-personal-young-professional-calculator', { 
    title: 'Wealth Gap Calculator | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/entrepreneur', (req, res) => {
  res.render('coverscore-personal-entrepreneur', { 
    title: 'Free Entrepreneur Score™ | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/entrepreneur/calculator', (req, res) => {
  res.render('coverscore-personal-entrepreneur-calculator', { 
    title: 'Business Risk Calculator | CoverScore Personal', 
    layout: false,
    whatsappNumber: process.env.WHATSAPP_BOT_NUMBER || '2349165304629'
  });
});

app.get('/assessment/start', optionalAuth, (req, res) => {
  res.redirect('/start-whatsapp');
});

app.get('/assessment/result/:id', optionalAuth, (req, res) => {
  res.render('assessment/result', { title: 'Assessment Results', activePage: 'assessment', layout: false });
});

app.get('/assessment/report/:id', (req, res) => {
  res.redirect(`/assessment/result/${req.params.id}`);
});

app.get('/assessment/email-capture', optionalAuth, (req, res) => {
  res.render('assessment/email-capture', { title: 'Get Your Report', activePage: 'assessment', layout: false });
});

app.get('/assessment/final-cta', optionalAuth, (req, res) => {
  res.render('assessment/final-cta', { title: 'Final Step - Get Your Report', activePage: 'assessment', layout: false });
});

app.get('/dashboard', authenticatePage, (req, res) => {
  if (req.user && req.user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  } else if (req.user && ['sales', 'analyst'].includes(req.user.role)) {
    return res.redirect('/advisor/dashboard');
  }
  res.render('dashboard/index', { title: 'Dashboard', activePage: 'dashboard', layout: 'main' });
});

app.get('/admin', authenticatePage, (req, res) => {
  if (req.user.role !== 'admin') return res.redirect('/dashboard');
  res.redirect('/admin/dashboard');
});

app.get('/admin/dashboard', authenticatePage, (req, res) => {
  if (req.user.role !== 'admin') return res.redirect('/dashboard');
  res.render('admin/dashboard', { title: 'Admin Dashboard', activePage: 'dashboard', layout: 'admin' });
});

app.get('/admin/leads', authenticatePage, async (req, res) => {
  try {
    const rawLeads = await all(`
      SELECT l.*, a.answers as assessment_answers
      FROM leads l
      LEFT JOIN assessments a ON l.assessment_id = a.id
      ORDER BY l.updated_at DESC
    `);
    
    let counts = { all: 0, new: 0, contacted: 0, qualified: 0 };
    counts.all = rawLeads.length;

    const parsedLeads = rawLeads.map(lead => {
      let colorTheme = 'blue';
      let displayStatus = lead.status || 'Unknown';
      let statusLower = displayStatus.toLowerCase();

      if (statusLower.includes('new')) {
        colorTheme = 'green';
        displayStatus = 'New';
        counts.new++;
      } else if (statusLower.includes('qualified')) {
        colorTheme = 'purple';
        displayStatus = 'Qualified';
        counts.qualified++;
      } else if (statusLower.includes('engaged') || statusLower.includes('contacted') || statusLower.includes('sent')) {
        colorTheme = 'blue';
        displayStatus = 'Contacted';
        counts.contacted++;
      } else if (statusLower.includes('lost')) {
        colorTheme = 'pink';
      } else {
        colorTheme = 'orange';
      }

      let initials = 'NA';
      if (lead.business_name) {
        const words = lead.business_name.split(' ').filter(w => w.length > 0);
        if (words.length >= 2) {
          initials = (words[0][0] + words[1][0]).toUpperCase();
        } else if (words.length === 1) {
          initials = words[0].substring(0, 2).toUpperCase();
        }
      }

      let timeAgo = 'Just now';
      if (lead.created_at) {
        const diffMs = new Date() - new Date(lead.created_at);
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) timeAgo = `${diffMins || 1}m ago`;
        else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins/60)}h ago`;
        else timeAgo = `${Math.floor(diffMins/1440)}d ago`;
      }

      // Extract location and entity type from assessment answers
      let location = 'N/A';
      let entity_type = 'business';
      let businessPrefix = null;
      if (lead.assessment_answers) {
        try {
          const ans = typeof lead.assessment_answers === 'string' ? JSON.parse(lead.assessment_answers) : lead.assessment_answers;
          // Use template_selection for prefix
          businessPrefix = (ans.template_selection && ans.template_selection.template_id) || null;
          // Fallback: detect from keys
          if (!businessPrefix) {
            for (const key of Object.keys(ans)) {
              const m = key.match(/^(SCH|BUS|SME|HOS|MFG|CHU|YPR|FAM|INC|HLT|ENT|RET|CON|TRN)_/);
              if (m) { businessPrefix = m[1]; break; }
            }
          }
          // Location from city key
          const cityKey = businessPrefix ? `${businessPrefix}_008` : null;
          location = (cityKey && ans[cityKey]) || ans.city || 'N/A';
          // Entity type from prefix
          const prefixMap = { SCH: 'school', BUS: 'business', SME: 'business', HOS: 'hospital', MFG: 'manufacturing', CHU: 'church', YPR: 'personal', FAM: 'personal', INC: 'personal', HLT: 'personal', ENT: 'business', RET: 'personal', CON: 'construction', TRN: 'transport' };
          entity_type = prefixMap[businessPrefix] || lead.entity_type || 'business';
        } catch(e){}
      }

      const scoreInfo = computeLeadScore({ ...lead, entity_type });
      const leadDashOffset = (106.8 - (106.8 * scoreInfo.score / 100)).toFixed(1);
      return {
        ...lead,
        colorTheme,
        displayStatus,
        initials,
        dashOffset: leadDashOffset,
        timeAgo,
        location,
        entity_type,
        leadScore: scoreInfo.score,
        leadPriority: scoreInfo.priority
      };
    });

    res.render('advisor/leads', { title: 'Manage your prospects', activePage: 'leads', layout: false, parsedLeads, counts });
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/admin/analytics', authenticatePage, (req, res) => {
  res.render('admin/analytics', { title: 'Analytics', activePage: 'analytics', layout: 'admin' });
});

app.get('/admin/leads/:id', authenticatePage, async (req, res) => {
  try {
    const lead = await get(`
      SELECT l.*, a.answers as assessment_answers
      FROM leads l
      LEFT JOIN assessments a ON l.assessment_id = a.id
      WHERE l.id = ?
    `, [req.params.id]);
    if (!lead) return res.status(404).send('Lead not found');

    const activities = await all("SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC", [req.params.id]);

    const initials = (lead.business_name || lead.name || '??').substring(0, 2).toUpperCase();
    
    const score = lead.score || 0;
    const r = 17;
    const c = Math.PI * (r * 2);
    const dashOffset = ((100 - score) / 100) * c;
    
    const timeAgo = (dateString) => {
      if (!dateString) return 'Unknown';
      const diff = Date.now() - new Date(dateString).getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      return `${days} days ago`;
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Parse assessment answers for location, entity type, business-specific metrics
    let answers = {};
    let extractedLocation = null;
    let extractedEntityType = 'business';
    let businessPrefix = null;
    let metricLabel = 'Employees';
    let metricValue = null;
    let extractedPhone = null;
    let extractedContactPerson = null;
    if (lead.assessment_answers) {
      try {
        answers = typeof lead.assessment_answers === 'string' ? JSON.parse(lead.assessment_answers) : lead.assessment_answers;

        // Use template_selection for prefix detection (most reliable)
        businessPrefix = (answers.template_selection && answers.template_selection.template_id) || null;

        // Fallback: detect from answer keys (e.g. SCH_004, BUS_004)
        if (!businessPrefix) {
          for (const key of Object.keys(answers)) {
            const m = key.match(/^(SCH|BUS|SME|HOS|MFG|CHU|YPR)_/);
            if (m) { businessPrefix = m[1]; break; }
          }
        }

        // Extract location from template-specific city key
        const cityKey = businessPrefix ? `${businessPrefix}_008` : null;
        extractedLocation = (cityKey && answers[cityKey]) || answers.city || null;

        // Entity type based on prefix
        const prefixMap = { SCH: 'school', BUS: 'business', SME: 'business', HOS: 'hospital', MFG: 'manufacturing', CHU: 'church', YPR: 'personal' };
        extractedEntityType = prefixMap[businessPrefix] || lead.entity_type || 'business';

        // Extract contact person name and phone (key numbering differs by funnel type)
        // Business funnels (SCH, BUS, SME, HOS, MFG, CHU): _005 = name, _009 = phone
        // Personal funnels (HLT, INC, FAM, ENT, YPR, RET): _004 = name, _005 = email, _009 = age
        const personalPrefixes = ['HLT', 'INC', 'FAM', 'ENT', 'YPR', 'RET', 'HOM', 'MOT'];
        const isPersonal = businessPrefix && personalPrefixes.includes(businessPrefix);
        const nameKey = businessPrefix ? `${businessPrefix}_${isPersonal ? '004' : '005'}` : null;
        extractedContactPerson = (nameKey && answers[nameKey]) || answers.name || null;

        if (isPersonal) {
          extractedPhone = null; // Phone comes from WhatsApp, not assessment answers
        } else {
          const phoneKey = businessPrefix ? `${businessPrefix}_009` : null;
          extractedPhone = (phoneKey && answers[phoneKey]) || null;
        }

        // Business-specific metric
        if (businessPrefix === 'SCH') {
          metricLabel = 'Number of Students';
          metricValue = answers.SCH_013 || null;
        } else if (businessPrefix === 'HOS') {
          metricLabel = 'Patient Capacity';
          metricValue = answers.HOS_013 || null;
        } else if (businessPrefix === 'SME' || businessPrefix === 'BUS' || businessPrefix === 'MFG') {
          metricLabel = null; // Don't show separate metric row — Employees row already covers it
          metricValue = null;
        }
      } catch(e) { /* silent */ }
    }

    lead.added_time = timeAgo(lead.created_at);
    lead.added_formatted = formatDate(lead.created_at);
    lead.last_contact_time = timeAgo(lead.updated_at);
    lead.initials = initials;
    lead.dashOffset = dashOffset;
    lead.contact_person = extractedContactPerson || lead.contact_person || lead.name || 'N/A';
    lead.phone = extractedPhone || lead.phone || 'N/A';
    lead.email = lead.email || 'N/A';
    lead.address = extractedLocation || lead.location || 'N/A';
    lead.business_type_display = extractedEntityType.charAt(0).toUpperCase() + extractedEntityType.slice(1);
    lead.metric_label = metricLabel;
    lead.metric_value = metricValue || 'N/A';
    lead.employees = lead.employees || 'N/A';
    lead.owner = lead.assigned_agent || (req.user ? req.user.name : 'Unassigned');
    lead.lead_source = lead.lead_source || 'CoverScore AI';

    const leadScoreInfo = computeLeadScore({ ...lead, entity_type: extractedEntityType, phone: lead.phone || extractedPhone });
    lead.leadScore = leadScoreInfo.score;
    lead.leadPriority = leadScoreInfo.priority;

    let colorTheme = 'blue';
    let statusLower = (lead.status || '').toLowerCase();
    if (statusLower.includes('new')) colorTheme = 'green';
    else if (statusLower.includes('qualified')) colorTheme = 'purple';
    else if (statusLower.includes('lost')) colorTheme = 'pink';
    else if (statusLower.includes('won')) colorTheme = 'orange';
    lead.colorTheme = colorTheme;

    const parsedActivities = activities.map(act => ({
      ...act,
      formatted_date: formatDate(act.created_at)
    }));

    res.render('advisor/lead-details', { 
      title: 'Lead Details', 
      activePage: 'leads', 
      layout: false, 
      lead,
      activities: parsedActivities
    });
  } catch (err) {
    console.error('Error fetching lead details:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/admin/leads/:id/assessment', authenticatePage, async (req, res) => {
  try {
    const lead = await get("SELECT * FROM leads WHERE id = ?", [req.params.id]);
    if (!lead) return res.status(404).send('Lead not found');

    const initials = (lead.business_name || lead.name || '??').substring(0, 2).toUpperCase();
    lead.initials = initials;
    lead.address = lead.location || 'Abuja';
    lead.entity_type_display = lead.entity_type === 'hospital' ? 'Hospital' : 'Clinic';
    
    res.render('advisor/assessment', { 
      title: 'Assessment', 
      activePage: 'assessments', 
      layout: false, 
      lead
    });
  } catch (err) {
    console.error('Error fetching lead assessment:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/admin/settings', authenticatePage, (req, res) => {
  res.render('admin/settings', { title: 'Settings', activePage: 'settings', layout: 'admin' });
});

app.get('/admin/team', authenticatePage, (req, res) => {
  res.render('admin/team', { title: 'Team & Advisors', activePage: 'team', layout: 'admin' });
});

app.get('/admin/clients', authenticatePage, async (req, res) => {
  try {
    const clients = await all("SELECT * FROM leads WHERE status = 'Won' ORDER BY updated_at DESC");
    res.render('admin/clients', { title: 'Clients', activePage: 'clients', layout: 'admin', clients });
  } catch (error) {
    res.status(500).send('Error loading clients');
  }
});

app.get('/admin/assessments', authenticatePage, async (req, res) => {
  try {
    const rows = await all("SELECT a.*, u.name as user_name, l.business_name, l.name as lead_name FROM assessments a LEFT JOIN users u ON a.user_id = u.id LEFT JOIN leads l ON l.assessment_id = a.id ORDER BY a.created_at DESC");
    const assessments = rows.map(a => {
      let displayName = a.business_name || a.lead_name || null;
      if (!displayName && a.answers) {
        try {
          const parsed = JSON.parse(a.answers);
          displayName = parsed.business_name || parsed.contact_name || null;
          if (!displayName) {
            for (const key of Object.keys(parsed)) {
              const v = parsed[key];
              if (typeof v === 'string' && v.length > 2 && v.length < 100 && !key.startsWith('SCH_') && key !== 'template_selection') {
                const numKey = parseInt(key.split('_')[1]);
                if (numKey === 4 || numKey === 5) { displayName = v; break; }
              }
            }
          }
          if (!displayName) {
            for (const key of Object.keys(parsed)) {
              const v = parsed[key];
              if (typeof v === 'string' && /^[A-Z][a-z]/.test(v) && !v.includes('@') && v.length > 2) {
                displayName = v; break;
              }
            }
          }
        } catch (e) { /* silent */ }
      }
      return { ...a, business_name: displayName || 'Assessment #' + a.id };
    });

    const startedCount = await get("SELECT COUNT(*) as c FROM assessments WHERE score IS NULL AND (answers IS NULL OR answers = '{}' OR answers = '')");
    const inProgressCount = await get("SELECT COUNT(*) as c FROM assessments WHERE score IS NULL AND answers IS NOT NULL AND answers != '{}' AND answers != ''");
    const completedCount = await get("SELECT COUNT(*) as c FROM assessments WHERE score IS NOT NULL");
    const last30 = await get("SELECT COUNT(*) as total, SUM(CASE WHEN score IS NOT NULL THEN 1 ELSE 0 END) as done FROM assessments WHERE created_at >= datetime('now', '-30 days')");
    const completionRate = last30 && last30.total > 0 ? Math.round((last30.done / last30.total) * 100) : 0;

    res.render('admin/assessments', {
      title: 'Assessments', activePage: 'assessments', layout: 'admin', assessments,
      startedCount: startedCount.c || 0,
      inProgressCount: inProgressCount.c || 0,
      completedCount: completedCount.c || 0,
      completionRate
    });
  } catch (error) {
    res.status(500).send('Error loading assessments');
  }
});

app.get('/admin/opportunities', authenticatePage, async (req, res) => {
  try {
    const activeType = req.query.type === 'personal' ? 'PERSONAL' : 'BUSINESS';
    const filterMonth = req.query.month || '';
    const filterYear = req.query.year || '';
    const filterFrom = req.query.from || '';
    const filterTo = req.query.to || '';

    let sql = "SELECT * FROM leads WHERE opportunity_type = ?";
    let params = [activeType];

    if (!req.user || req.user.role !== 'admin') {
      sql += " AND advisor_id = ?";
      params.push(req.user.id);
    }

    if (filterMonth) {
      sql += " AND CAST(strftime('%m', created_at) AS INTEGER) = ?";
      params.push(parseInt(filterMonth));
    }
    if (filterYear) {
      sql += " AND strftime('%Y', created_at) = ?";
      params.push(filterYear);
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

    let rawLeads = await all(sql, params);

    const pipelineData = {
      stage1: rawLeads.filter(l => l.pipeline_stage === 1),
      stage2: rawLeads.filter(l => l.pipeline_stage === 2),
      stage3: rawLeads.filter(l => l.pipeline_stage === 3),
      stage4: rawLeads.filter(l => l.pipeline_stage === 4),
      stage5: rawLeads.filter(l => l.pipeline_stage === 5),
      stage6: rawLeads.filter(l => l.pipeline_stage === 6),
    };

    const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const hasActiveFilters = !!(filterMonth || filterYear || filterFrom || filterTo);

    res.render('admin/opportunities', { 
      title: 'Opportunities', 
      activePage: 'opportunities', 
      layout: 'admin',
      pipelineData,
      activeType: activeType.toLowerCase(),
      activeTypeTitle: activeType === 'BUSINESS' ? 'Business' : 'Personal',
      filterMonth,
      filterYear,
      filterFrom,
      filterTo,
      filterMonthName: MONTHS[parseInt(filterMonth)] || '',
      hasActiveFilters
    });
  } catch (error) {
    console.error('[opportunities]', error);
    res.status(500).send('Error loading opportunities');
  }
});

app.get('/admin/more', authenticatePage, async (req, res) => {
  res.render('admin/more', { title: 'More', activePage: 'more', layout: 'admin' });
});

app.get('/admin/consultations', authenticatePage, async (req, res) => {
  try {
    const requested = await all("SELECT * FROM leads WHERE consultation_preference IS NOT NULL AND status != 'Won' ORDER BY created_at DESC");
    const scheduled = await all("SELECT t.*, l.name, l.business_name FROM tasks t JOIN leads l ON t.lead_id = l.id WHERE t.type = 'consultation' AND t.status != 'completed' ORDER BY t.due_date ASC");
    const completed = await all("SELECT t.*, l.name, l.business_name FROM tasks t JOIN leads l ON t.lead_id = l.id WHERE t.type = 'consultation' AND t.status = 'completed' ORDER BY t.due_date DESC");
    res.render('admin/consultations', { title: 'Consultations', activePage: 'consultations', layout: 'admin', requested, scheduled, completed });
  } catch (error) {
    res.status(500).send('Error loading consultations');
  }
});

app.get('/admin/calendar', authenticatePage, async (req, res) => {
  try {
    const leads = await all("SELECT id, name, business_name FROM leads ORDER BY name ASC");
    res.render('admin/calendar', { title: 'Calendar', activePage: 'calendar', layout: 'admin', leads });
  } catch (error) {
    res.status(500).send('Error loading calendar');
  }
});

app.get('/admin/templates', authenticatePage, async (req, res) => {
  try {
    const templates = await all("SELECT * FROM templates ORDER BY id ASC");
    const businessTemplates = templates.filter(t => t.category === 'BUSINESS' || !t.category);
    const personalTemplates = templates.filter(t => t.category === 'PERSONAL');
    res.render('admin/templates', { 
      title: 'Templates', 
      activePage: 'templates', 
      layout: 'admin', 
      businessTemplates,
      personalTemplates
    });
  } catch (error) {
    res.status(500).send('Error loading templates');
  }
});

app.get('/admin/policies', authenticatePage, async (req, res) => {
  try {
    const policies = await all("SELECT p.*, l.name as client_name FROM policies p JOIN leads l ON p.lead_id = l.id ORDER BY p.created_at DESC");
    const leads = await all("SELECT id, name, business_name FROM leads ORDER BY name ASC");
    res.render('admin/policies', { title: 'Policies', activePage: 'policies', layout: 'admin', policies, leads });
  } catch (error) {
    res.status(500).send('Error loading policies');
  }
});

app.get('/admin/proposals', authenticatePage, async (req, res) => {
  try {
    const proposals = await all("SELECT p.*, l.name as lead_name, l.business_name FROM proposals p JOIN leads l ON p.lead_id = l.id ORDER BY p.created_at DESC");
    const draftCount = proposals.filter(p => p.status === 'Generated' || p.status === 'Draft').length;
    const sentCount = proposals.filter(p => p.status === 'Sent').length;
    const expiredCount = proposals.filter(p => p.status === 'Expired').length;
    const totalPremium = proposals.reduce((sum, p) => sum + (p.amount || 0), 0);
    res.render('admin/proposals', { title: 'Proposals', activePage: 'proposals', layout: 'admin', proposals, draftCount, sentCount, expiredCount, totalPremium });
  } catch (error) {
    res.status(500).send('Error loading proposals');
  }
});

app.get(['/quote', '/request-quote'], (req, res) => {
  res.render('request-quote', { title: 'Request a Quote', layout: false });
});

app.get(['/consultation', '/book-consultation'], (req, res) => {
  res.render('book-consultation', { title: 'Book a Consultation', layout: false });
});

app.get('/auth/password-reset', (req, res) => {
  res.render('auth/forgot-password', { title: 'Reset Password', layout: 'auth' });
});

app.get('/auth/reset-password', (req, res) => {
  res.render('auth/reset-password', { title: 'Set New Password', layout: 'auth' });
});

app.get('/features', (req, res) => {
  res.render('coming-soon', { title: 'Features', layout: false });
});

app.get('/pricing', (req, res) => {
  res.render('coming-soon', { title: 'Pricing', layout: false });
});

app.get('/demo', (req, res) => {
  res.render('coming-soon', { title: 'Demo', layout: false });
});

// Static pages
app.get('/privacy', (req, res) => res.render('privacy', { title: 'Privacy Policy', layout: false }));

app.get('/terms', (req, res) => res.render('terms', { title: 'Terms of Service', layout: false }));

app.get('/cookie-policy', (req, res) => res.render('cookie-policy', { title: 'Cookie Policy', layout: false }));

app.get('/security', (req, res) => res.render('security', { title: 'Security', layout: false }));

app.get('/about', (req, res) => res.render('about', { title: 'About Us', layout: false }));

app.get('/careers', (req, res) => res.render('careers', { title: 'Careers', layout: false }));

app.get('/contact', (req, res) => res.render('contact', { title: 'Contact Us', layout: false }));

app.get('/profile', (req, res) => {
  res.render('coming-soon', { title: 'Profile', layout: false });
});

app.get('/settings', (req, res) => {
  res.render('coming-soon', { title: 'Settings', layout: false });
});

const webhookRoutes = require('./routes/webhook');
const renewalRoutes = require('./routes/renewals');

app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/renewals', renewalRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/advisor', advisorRoutes);
app.use('/reports', reportsRoutes);
app.use(ratingRoutes);

// Serve QR code page for WhatsApp linking
app.get('/whatsapp-link', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'qrcode.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Email diagnostics endpoint — helps debug SMTP issues without exposing secrets
app.get('/health/email', async (req, res) => {
  try {
    const { getDiagnostics } = require('./services/emailService');
    const diag = await getDiagnostics();
    res.json({ status: 'ok', email: diag });
  } catch (err) {
    res.json({ status: 'error', error: err.message });
  }
});

app.get('/api/admin/tasks', authenticatePage, async (req, res) => {
  try {
    const tasks = await all("SELECT t.*, l.name as lead_name FROM tasks t JOIN leads l ON t.lead_id = l.id");
    const events = tasks.filter(t => t.due_date).map(t => ({
      id: t.id,
      title: `${t.type === 'consultation' ? 'Consultation' : 'Call'}: ${t.lead_name}`,
      start: t.due_date,
      className: t.type === 'consultation' ? 'event-consult' : 'event-call'
    }));
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load tasks' });
  }
});

app.use(notFoundHandler);

app.use(errorHandler);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Initialize renewal scheduler on startup (runs daily check)
const { runDailyRenewalCheck } = require('./renewals/scheduler');
runDailyRenewalCheck().catch(err => console.error('[Renewal Scheduler] Initial run error:', err.message));
setInterval(() => {
  runDailyRenewalCheck().catch(err => console.error('[Renewal Scheduler] Interval run error:', err.message));
}, 24 * 60 * 60 * 1000);

module.exports = app;
