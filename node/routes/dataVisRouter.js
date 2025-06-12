const express = require('express');
const router = express.Router();
const pool = require('../db'); // Correct path to db.js from routes/dataVisRouter.js (node/db.js relative to node/routes/)

// No more hardcoded stationMapping or displayRiverNames here!
// All information will be dynamically fetched from the database.

/**
 * Route for the initial Data Visualisation page load (no specific river selected).
 * This will fetch a list of available rivers from the database and display selection options.
 */
router.get('/data-visualisation', async (req, res) => {
  console.log('Router: Rendering initial data-visualisation page (fetching available rivers dynamically).');

  let client;
  try {
    client = await pool.connect();
    // Select distinct station and location from the river table.
    // Order by station for consistent display.
    const result = await client.query('SELECT DISTINCT station, location FROM river ORDER BY station ASC;');
    const uniqueRiversFromDb = result.rows;

    // Prepare a list of river objects for the Pug template.
    // Extract a cleaner name (e.g., "Orange River" from "Orange River @ Aliwal-North")
    // And construct the URL-friendly code (e.g., D1H003YRPK)
    const availableRivers = uniqueRiversFromDb.map(row => {
      const stationCode = row.station;
      const fullLocationName = row.location;

      // Assuming the display name is the part before " @ " or the full name if no " @ "
      const displayName = fullLocationName.includes(' @ ') ? fullLocationName.split(' @ ')[0].trim() : fullLocationName;

      // Construct the URL code by appending 'YRPK' to the station code
      const urlCode = `${stationCode}YRPK`;

      return { code: urlCode, name: displayName };
    });

    res.render('data-visualisation', {
      title: 'Data Visualizations',
      selectedRiverCode: null, // Indicates to Pug that no specific river data is being sent yet
      availableRivers: availableRivers // Pass the dynamically fetched list of rivers
    });
  } catch (err) {
    console.error('Router: Error fetching available rivers dynamically:', err);
    res.status(500).render('error', { message: 'Server error while fetching available river data.' });
  } finally {
    if (client) {
      client.release();
    }
  }
});


/**
 * Route for displaying data visualizations for a specific river.
 * Fetches data from the PostgreSQL database based on the file code.
 * The ':fileCode' URL parameter (e.g., 'A5H006YRPK') is mapped to a station name.
 * River name will be extracted dynamically from the database.
 */
router.get('/data-visualisation/:fileCode', async (req, res) => {
  const requestedFileCode = req.params.fileCode.toUpperCase();
  // Extract the raw station code from the fileCode (e.g., A5H006 from A5H006YRPK)
  const stationCode = requestedFileCode.replace('YRPK', '');

  console.log(`Router: Request for data-visualisation for fileCode: ${requestedFileCode}, derived station code: ${stationCode}`);

  let client;
  try {
    client = await pool.connect();
    console.log('Router: Database client connected for data fetch.');

    // First, fetch the full location name for the given station from the database
    const locationResult = await client.query(
      `SELECT DISTINCT location FROM river WHERE station = $1 LIMIT 1`,
      [stationCode]
    );

    let riverName = stationCode; // Default to station code if no location found
    if (locationResult.rows.length > 0) {
      const fullLocationName = locationResult.rows[0].location;
      // Extract a cleaner display name from the full location string
      riverName = fullLocationName.includes(' @ ') ? fullLocationName.split(' @ ')[0].trim() : fullLocationName;
    } else {
      console.warn(`Router: No location found for station: ${stationCode}. Using station code as river name.`);
    }

    // Now fetch the actual data for the charts
    const dataResult = await client.query(
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
      [stationCode] // Use the actual station code for the data query
    );

    const dataForRiver = dataResult.rows;
    console.log(`Router: Fetched ${dataForRiver.length} rows for station: ${stationCode}`);

    // If no data is found for the station, render a message
    if (dataForRiver.length === 0) {
      console.warn(`Router: No data found in the database for station: ${stationCode}`);
      return res.render('data-visualisation', {
        title: `Data Visualization for ${riverName}`,
        riverName: riverName,
        stationName: stationCode, // Pass the station code
        data: [], // Pass an empty array to show "No Data Found" message in Pug
        selectedRiverCode: requestedFileCode
      });
    }

    // Render the 'data-visualisation.pug' template.
    res.render('data-visualisation', {
      title: `Data Visualization for ${riverName}`, // Page title
      file: requestedFileCode, // The URL code
      riverName: riverName, // Human-readable name
      stationName: stationCode, // Database station name
      data: dataForRiver, // The actual raw data to be displayed
      selectedRiverCode: requestedFileCode // Indicates a river has been selected
    });
  } catch (err) {
    console.error(`Router: Error fetching data for ${stationCode}:`, err);
    res.status(500).render('error', { message: 'Server error while fetching data.' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
