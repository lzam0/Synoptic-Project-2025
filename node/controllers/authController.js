// controllers/AuthController.js
const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');

class AuthController {
  static async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await UserModel.findByEmail(email);
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

      // For now, simple success (later: use JWT/session)
      res.status(200).json({ message: 'Login successful', user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async register(req, res) {
    const { email, password } = req.body;

    try {
      const existing = await UserModel.findByEmail(email);
      if (existing) return res.status(400).json({ message: 'Email already exists' });

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await UserModel.create(email, passwordHash);

      res.status(201).json({ message: 'User registered', user: newUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = AuthController;
