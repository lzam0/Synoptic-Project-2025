const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();

// Import the database connection pool (db.js is in the SAME directory as server.js within 'node/')
const pool = require('./db'); // Corrected: Use './db' for sibling file

// Import authentication middleware (middleware/ is inside the 'node/' folder)
const authenticateToken = require('./middleware/authMiddleware'); // Corrected: Use './middleware/' for sibling folder
// Import existing authentication and admin routes (routes/ is inside the 'node/' folder)
const authRoutes = require('./routes/authRouter'); // Corrected: Use './routes/' for sibling folder
const adminRouter = require('./routes/adminRouter'); // Corrected: Use './routes/' for sibling folder


// Load environment variables from the .env file (assuming .env is in project root, one level up from node/)
require('dotenv').config(); // Assuming .env is at Synoptic-Project-2025/.env

// Get the port from environment variables, or default to 3000
const port = process.env.PORT || 3000;

// Set views directory. CORRECTED: views/ is directly inside node/
app.set("views", path.join(__dirname, 'views')); // CORRECTED: path.join(__dirname, 'views')
app.set("view engine", "pug");

// Serve static files from the 'public' directory.
// CORRECTED: 'public/' is directly inside 'node/' as per screenshot.
app.use(express.static(path.join(__dirname, 'public'))); // Corrected: path.join(__dirname, 'public')
// Serve uploaded files.
// ASSUMPTION: 'uploads/' is in the project root, one level up from 'node/'.
app.use(express.static(path.join(__dirname, '../uploads'))); // Assuming uploads is at Synoptic-Project-2025/uploads/

// Middleware to parse URL-encoded form data (e.g., from HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

// --- Global Middleware: Authenticate User and make req.user available to templates ---
// Apply authenticateToken globally to make user data available across all routes that render the navbar.
// This needs to be placed AFTER `cookieParser()` if your `authenticateToken` relies on cookies.
app.use(authenticateToken);

// Middleware to expose req.user to res.locals for Pug templates.
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// --- Database Data Mapping for Visualizations ---
const stationMapping = {
  'A5H006YRPK': 'A5H006', // Limpopo River Station
  'D1H003YRPK': 'D1H003', // Orange River Station
  // Add more mappings here if you have more data visualization links
};

// --- Human-readable River Names for Display ---
const displayRiverNames = {
  'A5H006': 'Limpopo River',
  'D1H003': 'Orange River',
  // Add more station to river name mappings for display purposes
};

// --- Application Routes ---

// Use authentication and admin routes
app.use('/', authRoutes);
app.use('/', adminRouter);

// Home route: Renders the default index page.
app.get('/', (req, res) => {
  res.render('index');
});

/**
 * Route for the initial Data Visualisation page load (no specific river selected).
 * This will display empty graphs and options to choose a river.
 */
app.get('/data-visualisation', (req, res) => {
  console.log('Server: Rendering initial data-visualisation page (no river selected).');
  res.render('data-visualisation', {
    title: 'Data Visualizations',
    selectedRiverCode: null
  });
});


/**
 * Route for displaying data visualizations for a specific river.
 * Fetches data from the PostgreSQL database based on the file code.
 * The ':fileCode' URL parameter (e.g., 'A5H006YRPK') is mapped to a station name.
 */
app.get('/data-visualisation/:fileCode', async (req, res) => {
  const requestedFileCode = req.params.fileCode.toUpperCase();
  const stationName = stationMapping[requestedFileCode];

  console.log(`Server: Request for data-visualisation for fileCode: ${requestedFileCode}, mapped to station: ${stationName}`);

  // Check if a valid station mapping exists
  if (!stationName) {
    console.warn(`Server: No station mapping found for file code: ${requestedFileCode}`);
    return res.status(404).render('error', { message: 'Data visualization not found for this river code.' });
  }

  let client;
  try {
    client = await pool.connect();
    console.log('Server: Database client connected for data fetch.');

    // Query the database to get all relevant columns for charting and table display.
    // Includes 'year' for client-side yearly aggregation.
    const result = await client.query(
      `SELECT
         station,
         year,
         to_char(date, 'YYYY-MM-DD') AS date,
         time,
         level,
         flow
       FROM river
       WHERE station = $1
       ORDER BY year ASC, date ASC, time ASC`,
      [stationName]
    );

    const dataForRiver = result.rows;
    console.log(`Server: Fetched ${dataForRiver.length} rows for station: ${stationName}`);

    // If no data is found for the station, render an error or a message
    if (dataForRiver.length === 0) {
      console.warn(`Server: No data found in the database for station: ${stationName}`);
      return res.status(404).render('error', { message: `No data found for ${displayRiverNames[stationName] || stationName}. Please ensure data is uploaded.` });
    }

    // Determine the human-readable river name for the page title and chart titles
    const riverName = displayRiverNames[stationName] || stationName;

    // Render the 'data-visualisation.pug' template, passing all necessary data.
    res.render('data-visualisation', {
      title: `Data Visualization for ${riverName}`,
      file: requestedFileCode,
      riverName,
      stationName,
      data: dataForRiver,
      selectedRiverCode: requestedFileCode
    });
  } catch (err) {
    console.error(`Server: Error fetching data for ${stationName}:`, err);
    res.status(500).render('error', { message: 'Server error while fetching data.' });
  } finally {
    if (client) {
      client.release();
      console.log('Server: Database client released.');
    }
  }
});

// Start the Express server
const server = app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port} 🚀`);
});

module.exports = server;
