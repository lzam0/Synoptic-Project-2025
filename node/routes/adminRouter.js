const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { parseCSVFile } = require('../parser/riverParser.js');
const fs = require('fs');
const pool = require('../db');
const { Parser } = require('json2csv');

// Set up multer for file upload
const upload = multer({
  dest: path.join(__dirname, '../../uploads')
});

// GET /admin - Admin dashboard
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        river_id, 
        station, 
        location, 
        year, 
        to_char(date, 'YYYY-MM-DD') AS formatted_date, 
        time, 
        level, 
        flow
      FROM river
      ORDER BY date DESC
      LIMIT 100
    `);

    res.render('admin', { user: req.user, riverData: result.rows });
  } catch (err) {
    console.error('Error fetching river data:', err);
    res.render('admin', { user: req.user, riverData: [] });
  }
});

// POST /admin/add-data - Add new CSV data
router.post('/admin/add-data', authenticateToken, upload.single('csvFile'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const datePeriod = req.body.datePeriod;

    console.log('Adding data:', filePath, datePeriod);

    // Parse the CSV and insert data
    await parseCSVFile(filePath);

    // Delete uploaded file after parsing
    fs.unlinkSync(filePath);

    res.redirect('/admin');
  } catch (err) {
    console.error('Error adding data:', err);
    res.status(500).send('Error adding data');
  }
});

// POST /admin/remove-data - Remove data
router.post('/admin/remove-data', authenticateToken, async (req, res) => {
  const { referenceNumber, removeDatePeriod } = req.body;

  try {
    if (referenceNumber) {
      // Remove by river_id
      await pool.query('DELETE FROM river WHERE river_id = $1', [referenceNumber]);
      console.log(`Deleted river_id: ${referenceNumber}`);
    } else if (removeDatePeriod) {
      // Remove by date
      await pool.query('DELETE FROM river WHERE date = $1', [removeDatePeriod]);
      console.log(`Deleted rows with date: ${removeDatePeriod}`);
    } else {
      return res.status(400).send('Please provide a reference number or date.');
    }

    res.redirect('/admin');
  } catch (err) {
    console.error('Error removing data:', err);
    res.status(500).send('Error removing data');
  }
});

// GET /admin/export-data - Export data as CSV
router.get('/admin/export-data', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        river_id, 
        station, 
        location, 
        year, 
        to_char(date, 'YYYY-MM-DD') AS date, 
        time, 
        level, 
        flow
      FROM river
      ORDER BY date DESC
    `);

    const data = result.rows;

    // Convert JSON to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);

    // Set CSV headers and send file
    res.header('Content-Type', 'text/csv');
    res.attachment('river_data_export.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).send('Error exporting data');
  }
});

module.exports = router;
