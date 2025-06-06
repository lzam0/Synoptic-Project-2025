const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Login page (GET)
router.get('/login', (req, res) => {
  res.render('login');
});

// Login (POST)router.post('/login', (req, res, next) => {
router.post('/login', (req, res, next) => {
  console.log('POST /login received with body:', req.body);
  next();  // important!
}, AuthController.login);

router.post('/logout', (req, res) => {
  res.clearCookie('token');  // Clear the cookie holding the JWT
  res.redirect('/login');    // Or send JSON response if API
});

module.exports = router;
