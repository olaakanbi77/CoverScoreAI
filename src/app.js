const express = require('express');
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
    json: (obj) => JSON.stringify(obj)
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

app.get('/auth/login', (req, res) => {
  res.render('auth/login', { title: 'Sign In', layout: false });
});

app.get('/auth/register', (req, res) => {
  res.render('auth/register', { title: 'Sign Up', layout: false });
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
  if (req.user && ['admin', 'sales', 'analyst'].includes(req.user.role)) {
    return res.redirect('/admin/dashboard');
  }
  res.render('dashboard/index', { title: 'Dashboard', activePage: 'dashboard', layout: 'main' });
});

app.get('/admin/dashboard', authenticatePage, (req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard', activePage: 'admin', layout: 'main' });
});

app.get('/admin/leads', authenticatePage, (req, res) => {
  res.render('admin/dashboard', { title: 'Lead Management', activePage: 'admin', layout: 'main' });
});

app.get('/admin/analytics', authenticatePage, (req, res) => {
  res.render('admin/analytics', { title: 'Analytics', activePage: 'admin', layout: false });
});

app.get(['/quote', '/request-quote'], (req, res) => {
  res.render('request-quote', { title: 'Request a Quote', layout: false });
});

app.get(['/consultation', '/book-consultation'], (req, res) => {
  res.render('book-consultation', { title: 'Book a Consultation', layout: false });
});

app.get('/auth/password-reset', (req, res) => {
  res.render('auth/forgot-password', { title: 'Reset Password', layout: false });
});

app.get('/auth/reset-password', (req, res) => {
  res.render('auth/reset-password', { title: 'Set New Password', layout: false });
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

app.use(notFoundHandler);
app.use(errorHandler);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;
