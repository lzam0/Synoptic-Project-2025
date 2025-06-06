const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

router.get('/admin', authenticateToken, (req, res) => {
  res.render('admin', { user: req.user });
});

module.exports = router;
