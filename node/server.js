const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();

const authenticateToken = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRouter');
const adminRoutes = require('./routes/adminRouter');
const dataVisRoutes = require('./routes/dataVisRouter');
const infoRoutes = require('./routes/infoRouter');

// Load environment variables from the .env file
require('dotenv').config();

// Run off .env file for port
const port = process.env.PORT

// Set views and view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../uploads')));

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Protected Routes
app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/', dataVisRoutes);
app.use('/', infoRoutes);

// Public Routes
app.use((req, res, next) => {
  const publicPaths = ['/login', '/register', '/', '/data-visualisation', '/information'];
  
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

// Parse CSV files on server start up
if (process.env.IMPORT_CSV_ON_START === 'true') {
  require('./parser/riverParser');
}

// Start the server
const server = app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port} 🚀`);
});

module.exports = server;
