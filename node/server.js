const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const session = require('express-session');


// Load environment variables from the .env file
require('dotenv').config();

// Run off .env file for port
const port = process.env.PORT

// Set views and view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Start the server
const server = app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port} 🚀`);
});

module.exports = server;