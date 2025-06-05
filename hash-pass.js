const bcrypt = require('bcrypt');

const password = '123'; // The plain-text password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) throw err;
  console.log('Hashed password:', hash);  // This is the password you will insert
});