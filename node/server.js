const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// Load environment variables
require('dotenv').config();

// Import routes and middleware
const authenticateToken = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRouter');
const adminRoutes = require('./routes/adminRouter');
const dataVisRoutes = require('./routes/dataVisRouter');
const infoRoutes = require('./routes/infoRouter');
const aboutRoutes = require('./routes/aboutRouter');

const app = express();
const port = process.env.PORT || 3000;

// Set up views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../uploads')));

// Parse form data and JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Public landing route
app.get('/', (req, res) => {
  res.render('index');
});

// Routes
app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/', dataVisRoutes);
app.use('/', infoRoutes);
app.use('/', aboutRoutes);

// Public route bypass for auth
app.use((req, res, next) => {
  const publicPaths = ['/login', '/register', '/', '/data-visualisation', '/information', '/about'];
  if (publicPaths.some(pathPrefix => req.path.startsWith(pathPrefix))) {
    return next();
  }
  authenticateToken(req, res, next);
});

// Make user data available in views
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Run river parser at startup if enabled
if (process.env.IMPORT_CSV_ON_START === 'true') {
  const { main } = require('./parser/riverParser');
  main().catch(err => {
    console.error('❌ CSV import failed at startup:', err.message);
  });
}

// Only start server if NOT in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port} 🚀`);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received: closing server');
    process.exit(0);
  });
}

module.exports = app;
