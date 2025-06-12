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

// Helper function to fetch river data
async function fetchRiverData() {
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
  `);
  return result.rows;
}

// GET /admin - Admin dashboard
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    const riverData = await fetchRiverData();
    res.render('admin', { user: req.user, riverData });
  } catch (err) {
    console.error('Error fetching river data:', err);
    res.render('admin', { user: req.user, riverData: [], error: 'Error loading river data.' });
  }
});

// POST /admin/add-data - Add new CSV data
router.post('/admin/add-data', authenticateToken, upload.single('csvFile'), async (req, res) => {
  const filePath = req.file?.path;
  const originalName = req.file?.originalname;

  try {
    if (!filePath || !originalName) {
      const riverData = await fetchRiverData();
      return res.status(400).render('admin', { user: req.user, riverData, error: 'No file uploaded.' });
    }

    const fileExt = path.extname(originalName).toLowerCase();

    if (fileExt !== '.csv') {
      fs.unlinkSync(filePath); // Clean up
      const riverData = await fetchRiverData();
      return res.status(400).render('admin', { user: req.user, riverData, error: 'Invalid file type. Please upload a CSV file.' });
    }

    console.log('Adding data:', filePath);

    // Parse and insert CSV data
    await parseCSVFile(filePath);

    fs.unlinkSync(filePath);

    const riverData = await fetchRiverData();
    res.render('admin', { user: req.user, riverData, success: 'Data uploaded successfully!' });

  } catch (err) {
    console.error('Error adding data:', err.message);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const riverData = await fetchRiverData();
    res.status(500).render('admin', { user: req.user, riverData, error: 'Error adding data. Please check your CSV file and try again.' });
  }
});

// POST /admin/remove-data - Remove data
router.post('/admin/remove-data', authenticateToken, async (req, res) => {
  const { referenceNumber, removeDatePeriod } = req.body;

  try {
    let message = '';

    if (referenceNumber) {
      await pool.query('DELETE FROM river WHERE river_id = $1', [referenceNumber]);
      message = `Deleted river entry with ID: ${referenceNumber}`;
      console.log(message);
    } else if (removeDatePeriod) {
      await pool.query('DELETE FROM river WHERE date = $1', [removeDatePeriod]);
      message = `Deleted river entries with date: ${removeDatePeriod}`;
      console.log(message);
    } else {
      const riverData = await fetchRiverData();
      return res.status(400).render('admin', {
        user: req.user,
        riverData,
        error: 'Please provide a reference number or date to delete.'
      });
    }

    const riverData = await fetchRiverData();

    res.render('admin', {
      user: req.user,
      riverData,
      success: message
    });

  } catch (err) {
    console.error('Error removing data:', err);
    const riverData = await fetchRiverData();
    res.status(500).render('admin', {
      user: req.user,
      riverData,
      error: 'Error removing data. Please try again.'
    });
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

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('river_data_export.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).send('Error exporting data');
  }
});

module.exports = router;
