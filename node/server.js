const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();

// Import the database connection pool
const pool = require('./db'); // Assuming db.js exports the pool

// Import existing authentication and admin routes
const authRoutes = require('./routes/authRouter');
const adminRouter = require('./routes/adminRouter');

// Load environment variables from the .env file (e.g., for PORT)
require('dotenv').config();

// Get the port from environment variables, or default to 3000
const port = process.env.PORT || 3000;

// Set views directory and view engine to Pug
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Serve static files from the 'public' directory (e.g., CSS, client-side JS)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads'))); // To serve uploaded files if needed

// Middleware to parse URL-encoded form data (e.g., from HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

// --- Database Data Mapping for Visualizations ---
// This map connects the URL file codes (from your navbar links)
// to the 'station' names as they are stored in your PostgreSQL database.
// Based on your provided 'Current River Data', these mappings are confirmed.
const stationMapping = {
  'A5H006YRPK': 'A5H006', // Limpopo River
  'D1H003YRPK': 'D1H003', // Orange River
  // Add more mappings here if you have more data visualization links
};

// --- Human-readable River Names for Display ---
const displayRiverNames = {
  'A5H006': 'Limpopo River',
  'D1H003': 'Orange River',
  // Add more station to river name mappings for display purposes
};

// --- Application Routes ---

// Use existing authentication and admin routes
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
  res.render('data-visualisation', {
    title: 'Data Visualizations',
    // No 'data' or 'riverName' is passed here, so the Pug template knows to show selection options
    selectedRiverCode: null // Indicate that no river is selected
  });
});


/**
 * Route for displaying data visualizations for a specific river.
 * Fetches data from the PostgreSQL database.
 * The ':fileCode' URL parameter captures the identifier (e.g., 'A5H006YRPK').
 */
app.get('/data-visualisation/:fileCode', async (req, res) => {
  const requestedFileCode = req.params.fileCode.toUpperCase();
  // Get the database 'station' name using the mapping
  const stationName = stationMapping[requestedFileCode];

  if (!stationName) {
    // If no mapping found for the requested file code
    console.warn(`No station mapping found for file code: ${requestedFileCode}`);
    return res.status(404).render('error', { message: 'Data visualization not found for this code.' });
  }

  let client; // Declare client here to ensure it's in scope for finally block
  try {
    client = await pool.connect(); // Get a client from the connection pool

    // Query the database to get station, date, time, level, and flow for the specific station.
    // to_char(date, 'YYYY-MM-DD') formats the date as a string for client-side use.
    const result = await client.query(
      `SELECT
         station,
         to_char(date, 'YYYY-MM-DD') AS date,
         time,
         level,
         flow
       FROM river
       WHERE station = $1
       ORDER BY date ASC, time ASC`, // Order by date and time for correct chronological display
      [stationName]
    );

    const dataForRiver = result.rows; // The fetched data

    if (dataForRiver.length === 0) {
      console.warn(`No data found in the database for station: ${stationName}`);
      return res.status(404).render('error', { message: `No data found for ${displayRiverNames[stationName] || stationName}.` });
    }

    // Determine the human-readable river name for the title
    const riverName = displayRiverNames[stationName] || stationName;

    // Render the 'data-visualisation.pug' template
    // Pass the fetched data, stationName, and riverName to the template
    res.render('data-visualisation', {
      title: `Data Visualization for ${riverName}`,
      file: requestedFileCode, // Keep for potential future use in template
      riverName,
      stationName, // Pass the station name for client-side use
      data: dataForRiver, // This 'data' will be passed to window.rawData on client-side
      selectedRiverCode: requestedFileCode // Indicate which river is selected
    });
  } catch (err) {
    console.error(`Error fetching data for ${stationName}:`, err);
    res.status(500).render('error', { message: 'Server error while fetching data.' });
  } finally {
    if (client) {
      client.release(); // Release the client back to the pool
    }
  }
});

// Start the Express server
const server = app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port} 🚀`);
});

module.exports = server; // Export the server instance
