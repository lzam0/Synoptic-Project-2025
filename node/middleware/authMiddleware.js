const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  console.log('Authenticating token...');
  const token = req.cookies.token;
  console.log('Token:', token);

  if (!token) {
    console.log('No token found, redirecting to /login');
    return res.redirect('/login');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err);
      return res.redirect('/login');
    }
    console.log('Token verified, user:', user);
    req.user = user;
    next();
  });
}


module.exports = authenticateToken;
