const express = require('express');
const router = express.Router();

router.get('/information', (req, res) => {
  res.render('information', { user: req.user });
});

module.exports = router;