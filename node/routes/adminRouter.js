const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const parseCSVFile = require('../parser/riverParser.js');
const fs = require('fs');
const pool = require('../db');

// Set up multer for file upload
const upload = multer({
  dest: path.join(__dirname, '../../uploads')
});

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

// POST add-data
router.post('/admin/add-data', authenticateToken, upload.single('csvFile'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const datePeriod = req.body.datePeriod;

    console.log('Adding data:', filePath, datePeriod);

    // Call your existing parser
    await parseCSVFile(filePath);

    // Optional: delete file after parsing
    fs.unlinkSync(filePath);

    res.redirect('/admin');
  } catch (err) {
    console.error('Error adding data:', err);
    res.status(500).send('Error adding data');
  }
});

// POST remove-data
router.post('/admin/remove-data', authenticateToken, async (req, res) => {
  const { referenceNumber, removeDatePeriod } = req.body;

  try {
    if (referenceNumber) {
      // Remove by referenceNumber 
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

module.exports = router;
