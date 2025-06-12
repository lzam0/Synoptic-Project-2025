const express = require('express');
const router = express.Router();
const pool = require('../db'); 

//Route for the initial Data Visualisation page 
router.get('/data-visualisation', async (req, res) => {
  console.log('Router: Rendering initial data-visualisation page (fetching available rivers dynamically).');

  let client;
  try {
    client = await pool.connect();

    // Select distinct station and location from the river table.
    const result = await client.query('SELECT DISTINCT station, location FROM river ORDER BY station ASC;');
    const uniqueRiversFromDb = result.rows;

    // Prepare a list of river objects for the Pug template.
    const availableRivers = uniqueRiversFromDb.map(row => {
      const stationCode = row.station;
      const fullLocationName = row.location;

      const displayName = fullLocationName.includes(' @ ') ? fullLocationName.split(' @ ')[0].trim() : fullLocationName;

      const urlCode = `${stationCode}YRPK`;

      return { code: urlCode, name: displayName };
    });

    res.render('data-visualisation', {
      title: 'Data Visualizations',
      selectedRiverCode: null, 
      availableRivers: availableRivers 
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


//Route for displaying data visualizations for a specific river.

router.get('/data-visualisation/:fileCode', async (req, res) => {
  const requestedFileCode = req.params.fileCode.toUpperCase();
  const stationCode = requestedFileCode.replace('YRPK', '');

  console.log(`Router: Request for data-visualisation for fileCode: ${requestedFileCode}, derived station code: ${stationCode}`);

  let client;
  try {
    client = await pool.connect();
    console.log('Router: Database client connected for data fetch.');

    // Fetch the full location name for the given station from the database
    const locationResult = await client.query(
      `SELECT DISTINCT location FROM river WHERE station = $1 LIMIT 1`,
      [stationCode]
    );

    let riverName = stationCode; 
    if (locationResult.rows.length > 0) {
      const fullLocationName = locationResult.rows[0].location;
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
      [stationCode] 
    );

    const dataForRiver = dataResult.rows;
    console.log(`Router: Fetched ${dataForRiver.length} rows for station: ${stationCode}`);

    // If no data is found for the station, render a message
    if (dataForRiver.length === 0) {
      console.warn(`Router: No data found in the database for station: ${stationCode}`);
      return res.render('data-visualisation', {
        title: `Data Visualization for ${riverName}`,
        riverName: riverName,
        stationName: stationCode, 
        data: [], 
        selectedRiverCode: requestedFileCode
      });
    }

    // Render the 'data-visualisation.pug' template.
    res.render('data-visualisation', {
      title: `Data Visualization for ${riverName}`, 
      file: requestedFileCode, 
      riverName: riverName, 
      stationName: stationCode,
      data: dataForRiver,
      selectedRiverCode: requestedFileCode 
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
