const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

class AuthController {
  static async login(req, res) {
    const { username, password } = req.body;

    try {
      const user = await UserModel.findByUsername(username);
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

      // Create JWT token
      const token = jwt.sign(
        { user_id: user.user_id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Set token as a cookie (or you can use session or localStorage on client side)
      res.cookie('token', token, { httpOnly: true });

      // Redirect to admin page after login success
      res.redirect('/admin');
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
}


module.exports = AuthController;
