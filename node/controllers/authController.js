const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

class AuthController {
  static async login(req, res) {
    const { username, password } = req.body;

    try {
      const user = await UserModel.findByUsername(username);
      if (!user) {
        // Render login page again with error message
        return res.status(401).render('login', { error: 'Username or password is incorrect' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        // Render login page again with error message
        return res.status(401).render('login', { error: 'Username or password is incorrect' });
      }

      const token = jwt.sign(
        { user_id: user.user_id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.cookie('token', token, { httpOnly: true });
      res.redirect('/admin');
    } catch (err) {
      console.error(err);
      res.status(500).render('login', { error: 'Server error, please try again later' });
    }
  }
}

module.exports = AuthController;
