const pool = require('../db');

class UserModel {
  static async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }
}

module.exports = UserModel;
