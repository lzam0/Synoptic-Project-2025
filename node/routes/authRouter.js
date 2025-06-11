const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Login page GET request
router.get('/login', (req, res) => {
  res.render('login');
});

// Login POST request
router.post('/login', (req, res, next) => {
  console.log('POST /login received with body:', req.body);
  next();
}, AuthController.login);

// Logout POST request
router.post('/logout', (req, res) => {
  res.clearCookie('token');  // Clear the cookie holding the JWT
  res.redirect('/login');
});

module.exports = router;
