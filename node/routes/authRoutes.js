const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Login page (GET)
router.get('/login', (req, res) => {
  res.render('login');
});

// Login (POST)
router.post('/login', AuthController.login);

module.exports = router;
