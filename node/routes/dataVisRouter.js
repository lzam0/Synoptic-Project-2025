const express = require('express');
const router = express.Router();
const pool = require('../db'); // IMPORTANT: Correct path to db.js from routes/dataVisRouter.js


// --- Database Data Mapping for Visualizations ---
const stationMapping = {
  'A5H006YRPK': 'A5H006', // Limpopo River Station
  'D1H003YRPK': 'D1H003', // Orange River Station
  'B1H001YRPK': 'B1H001',
};

const displayRiverNames = {
  'A5H006': 'Limpopo River',
  'D1H003': 'Orange River',
  'B1H001': 'Olifants River @ Mooifontein',
};

/**
 * Route for the initial Data Visualisation page load (no specific river selected).
 * This will display empty graphs and options to choose a river.
 */
router.get('/data-visualisation', (req, res) => {
  console.log('Router: Rendering initial data-visualisation page (no river selected).');
  res.render('data-visualisation', {
    title: 'Data Visualizations',
    selectedRiverCode: null // Indicates to Pug that no specific river data is being sent yet
  });
});


/**
 * Route for displaying data visualizations for a specific river.
 */
router.get('/data-visualisation/:fileCode', async (req, res) => {
  const requestedFileCode = req.params.fileCode.toUpperCase();
  const stationName = stationMapping[requestedFileCode];

  console.log(`Router: Request for data-visualisation for fileCode: ${requestedFileCode}, mapped to station: ${stationName}`);

  // Check if a valid station mapping exists
  if (!stationName) {
    console.warn(`Router: No station mapping found for file code: ${requestedFileCode}`);
    return res.status(404).render('error', { message: 'Data visualization not found for this river code.' });
  }

  let client; // Declare client for finally block scope
  try {
    client = await pool.connect(); // Get a client from the database connection pool
    console.log('Router: Database client connected for data fetch.');

    // Query the database to get all relevant columns for charting and table display.
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
       ORDER BY year ASC, date ASC, time ASC`, // Order chronologically for consistent data processing
      [stationName]
    );

    const dataForRiver = result.rows; // The fetched array of data objects
    console.log(`Router: Fetched ${dataForRiver.length} rows for station: ${stationName}`);

    // If no data is found for the station, render an error or a message
    if (dataForRiver.length === 0) {
      console.warn(`Router: No data found in the database for station: ${stationName}`);
      return res.render('data-visualisation', {
        title: `Data Visualization for ${displayRiverNames[stationName] || stationName}`,
        riverName: displayRiverNames[stationName] || stationName,
        stationName: stationName,
        data: [], // Pass an empty array to show "No Data Found" message in Pug
        selectedRiverCode: requestedFileCode
      });
    }

    // Determine the human-readable river name for the page title and chart titles
    const riverName = displayRiverNames[stationName] || stationName;

    // Render the 'data-visualisation.pug' template.
    // Pass all necessary data to the template.
    res.render('data-visualisation', {
      title: `Data Visualization for ${riverName}`, // Page title
      file: requestedFileCode, // The URL code, might be useful
      riverName, // river name for display
      stationName, // Database station name
      data: dataForRiver, // The actual raw data to be displayed
      selectedRiverCode: requestedFileCode // Indicates a river has been selected
    });
  } catch (err) {
    console.error(`Router: Error fetching data for ${stationName}:`, err);
    res.status(500).render('error', { message: 'Server error while fetching data.' });
  } finally {
    // Always release the database client back to the pool
    if (client) {
      client.release();
      console.log('Router: Database client released.');
    }
  }
});

module.exports = router;