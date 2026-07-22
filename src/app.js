require('dotenv').config();
const express = require('express');
const session = require('express-session');
const csrf = require('csurf');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { requireAuth } = require('./middlewares/authMiddleware');

const app = express();
const port = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');

// Static files & body parsers
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'catatku_secret_session_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: false, // Set to true if using HTTPS in production
      sameSite: 'lax',
    },
  })
);

// CSRF Protection
const csrfProtection = csrf();
app.use(csrfProtection);

// Global locals for views (CSRF Token & Logged-in User)
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.user = req.session.user || null;
  next();
});

// Error handling for CSRF tokens
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('auth/login', {
      title: 'CatatKu - Masuk',
      error: 'Formulir kadaluarsa atau sesi CSRF tidak valid. Silakan coba lagi.',
      formData: { email: '' },
    });
  }
  next(err);
});

// Routes
// Public landing page
app.get('/', (req, res) => {
  res.render('index', { title: 'CatatKu - Beranda' });
});

// Auth routes (Login, Register, Logout)
app.use('/auth', authRoutes);

// Protected routes (Protected by requireAuth middleware)
app.use('/dashboard', requireAuth, dashboardRoutes);
app.use('/categories', requireAuth, categoryRoutes);
app.use('/transactions', requireAuth, transactionRoutes);
app.use('/budgets', requireAuth, budgetRoutes);
app.use('/reports', requireAuth, reportRoutes);

app.listen(port, () => {
  console.log(`CatatKu app listening at http://localhost:${port}`);
});
