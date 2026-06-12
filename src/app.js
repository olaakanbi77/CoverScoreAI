const express = require('express');
const { all, get, db } = require('./config/database');
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

const { authenticate, authenticatePage, optionalAuth } = require('./middleware/auth');

const app = express();
app.set('trust proxy', 1);

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
    or: (a, b) => a || b,
    and: (a, b) => a && b,
    not: (a) => !a,
    userInitials: (name) => {
      if (!name) return '??';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    },
    formatDate: (date) => new Date(date).toLocaleDateString(),
    formatNumber: (num) => {
      if (num == null) return '0';
      return Number(num).toLocaleString('en-US');
    },
    gte: (a, b) => Number(a) >= Number(b),
    lte: (a, b) => Number(a) <= Number(b),
    json: (obj) => JSON.stringify(obj),
    toLowerCase: (str) => String(str).toLowerCase()
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

app.get('/', (req, res) => {
  res.render('landing', { title: 'Home', layout: false });
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
  const text = encodeURIComponent('START ASSESSMENT');
  res.redirect(`https://wa.me/${botNumber}?text=${text}`);
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

app.get('/admin/leads', authenticatePage, (req, res) => {
  res.render('admin/dashboard', { title: 'Lead Management', activePage: 'leads', layout: 'admin' });
});

app.get('/admin/analytics', authenticatePage, (req, res) => {
  res.render('admin/analytics', { title: 'Analytics', activePage: 'analytics', layout: 'admin' });
});

app.get('/admin/leads/:id', authenticatePage, (req, res) => {
  res.render('admin/lead-details', { title: 'Lead Details', activePage: 'leads', layout: 'admin', leadId: req.params.id });
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
    const assessments = await all("SELECT a.*, u.name as user_name FROM assessments a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC");
    res.render('admin/assessments', { title: 'Assessments', activePage: 'assessments', layout: 'admin', assessments });
  } catch (error) {
    res.status(500).send('Error loading assessments');
  }
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
    res.render('admin/templates', { title: 'Templates', activePage: 'templates', layout: 'admin', templates });
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
    res.render('admin/proposals', { title: 'Proposals', activePage: 'proposals', layout: 'admin', proposals });
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
app.use('/advisor', advisorRoutes);

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

module.exports = app;
