const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const session = require('express-session');


// Load environment variables from the .env file
require('dotenv').config();

const port = process.env.PORT

// Start the server
const server = app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port} 🚀`);
});

module.exports = server;