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


    // Load environment variables from the .env file (assuming .env is in project root, one level up from node/)
    require('dotenv').config();

    // Get the port from environment variables, or default to 3000
    const port = process.env.PORT || 3000;

    // Set views directory. views/ is directly inside node/
    app.set("views", path.join(__dirname, 'views'));
    app.set("view engine", "pug");

    // Serve static files from the 'public' directory.
    // THIS IS THE CRITICAL LINE TO CHECK FOR YOUR TEAMMATES.
    // It currently assumes 'public/' is directly inside 'node/' (sibling to server.js).
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
    app.get('/', (req, res) => {
      res.render('index');
    });
    app.use('/', authRoutes);

    /**
     * Route for the initial Data Visualisation page load (no specific river selected).
     * This will display empty graphs and options to choose a river.
     * MOVED HERE TO BE PUBLICLY ACCESSIBLE.
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
     * MOVED HERE TO BE PUBLICLY ACCESSIBLE.
     */
    const stationMapping = {
      'A5H006YRPK': 'A5H006', // Limpopo River Station
      'D1H003YRPK': 'D1H003', // Orange River Station
    };

    const displayRiverNames = {
      'A5H006': 'Limpopo River',
      'D1H003': 'Orange River',
    };

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

        if (dataForRiver.length === 0) {
          console.warn(`Server: No data found in the database for station: ${stationName}`);
          return res.render('data-visualisation', {
            title: `Data Visualization for ${displayRiverNames[stationName] || stationName}`,
            riverName: displayRiverNames[stationName] || stationName,
            stationName: stationName,
            data: [],
            selectedRiverCode: requestedFileCode
          });
        }

        const riverName = displayRiverNames[stationName] || stationName;

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


    // --- GLOBAL AUTHENTICATION MIDDLEWARE ---
    app.use((req, res, next) => {
      const publicPaths = ['/login', '/register', '/', '/data-visualisation'];

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


    // Start the Express server
    const server = app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port} 🚀`);
    });

    module.exports = server;
    