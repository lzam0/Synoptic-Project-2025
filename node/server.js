const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();

// Import the database connection pool (db.js is in the SAME directory as server.js within 'node/')
const pool = require('./db');

// Import authentication middleware (middleware/ is inside the 'node/' folder)
const authenticateToken = require('./middleware/authMiddleware');
// Import existing authentication and admin routes (routes/ is inside the 'node/' folder)
const authRoutes = require('./routes/authRouter');
const adminRouter = require('./routes/adminRouter');
const dataVisRouter = require('./routes/dataVisRouter');
const infoRouter = require('./routes/infoRouter');

// Load environment variables from the .env file (assuming .env is in project root, one level up from node/)
require('dotenv').config();

// Get the port from environment variables, or default to 3000
const port = process.env.PORT || 3000;

// Set views directory. views/ is directly inside node/
app.set("views", path.join(__dirname, 'views'));
app.set("view engine", "pug");

// Serve static files from the 'public' directory.
// This assumes 'public/' is directly inside 'node/' (sibling to server.js).
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded files.
// ASSUMPTION: 'uploads/' is in the project root, one level up from 'node/'.
app.use(express.static(path.join(__dirname, '../uploads')));

// Middleware to parse URL-encoded form data (e.g., from HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse cookies (MUST come before authentication if it uses cookies)
app.use(cookieParser());

// --- PUBLIC ROUTES (NO AUTHENTICATION REQUIRED) ---
// These routes must come BEFORE the global authentication middleware.
app.get('/', (req, res) => {
  res.render('index');
});
app.use('/', authRoutes);


// Routess
app.use((req, res, next) => {
  // Define paths that should NOT trigger authentication redirects
  const publicPaths = ['/login', '/register', '/', '/data-visualisation'];

  // If the requested path starts with one of the public paths, skip authentication.
  // This handles both /data-visualisation and /data-visualisation/A5H006YRPK
  if (publicPaths.some(pathPrefix => req.path.startsWith(pathPrefix))) {
    return next();
  }
  authenticateToken(req, res, next);
});


// Middleware to expose req.user to res.locals
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// --- PROTECTED ROUTES (THESE WILL NOW REQUIRE AUTHENTICATION) ---
app.use('/', adminRouter);
app.use('/', dataVisRouter);
app.use('/', infoRouter);

if (process.env.IMPORT_CSV_ON_START === 'true') {
  require('./parser/riverParser');
}

// Start the Express server
const server = app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port} 🚀`);
});

module.exports = server;
