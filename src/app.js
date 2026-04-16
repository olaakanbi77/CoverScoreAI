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
  defaultLayout: 'main',
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
  res.render('auth/login', { title: 'Sign In' });
});

app.get('/auth/register', (req, res) => {
  res.render('auth/register', { title: 'Sign Up' });
});

app.get('/assessment/start', optionalAuth, (req, res) => {
  res.render('assessment/wizard', { title: 'Risk Assessment', activePage: 'assessment' });
});

app.get('/assessment/result/:id', optionalAuth, (req, res) => {
  res.render('assessment/result', { title: 'Assessment Results', activePage: 'assessment' });
});

app.get('/assessment/report/:id', (req, res) => {
  res.redirect(`/assessment/result/${req.params.id}`);
});

app.get('/assessment/email-capture', optionalAuth, (req, res) => {
  res.render('assessment/email-capture', { title: 'Get Your Report', activePage: 'assessment' });
});

app.get('/dashboard', authenticatePage, (req, res) => {
  if (req.user && ['admin', 'sales', 'analyst'].includes(req.user.role)) {
    return res.redirect('/admin/dashboard');
  }
  res.render('dashboard/index', { title: 'Dashboard', activePage: 'dashboard' });
});

app.get('/admin/dashboard', authenticatePage, (req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard', activePage: 'admin' });
});

app.get('/admin/leads', authenticatePage, (req, res) => {
  res.render('admin/dashboard', { title: 'Lead Management', activePage: 'admin' });
});

app.get('/admin/analytics', authenticatePage, (req, res) => {
  res.render('admin/analytics', { title: 'Analytics', activePage: 'admin' });
});

app.get('/quote', (req, res) => {
  res.render('request-quote', { title: 'Request a Quote' });
});

app.get('/consultation', (req, res) => {
  res.render('book-consultation', { title: 'Book a Consultation' });
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
app.get('/privacy', (req, res) => res.render('privacy', { title: 'Privacy Policy' }));

app.get('/terms', (req, res) => res.render('terms', { title: 'Terms of Service' }));

app.get('/cookie-policy', (req, res) => res.render('cookie-policy', { title: 'Cookie Policy' }));

app.get('/security', (req, res) => res.render('security', { title: 'Security' }));

app.get('/about', (req, res) => res.render('about', { title: 'About Us' }));

app.get('/careers', (req, res) => res.render('careers', { title: 'Careers' }));

app.get('/contact', (req, res) => res.render('contact', { title: 'Contact Us' }));

app.get('/profile', (req, res) => {
  res.render('coming-soon', { title: 'Profile' });
});

app.get('/settings', (req, res) => {
  res.render('coming-soon', { title: 'Settings' });
});

app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;
