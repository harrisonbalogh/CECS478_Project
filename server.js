var express = require('express'),
  app = express(),
  port = process.env.PORT || 8080,
  mongoose = require('mongoose'),
  Message = require('./api/models/messengerModel'), //created model loading here
  User = require('./api/models/userModel'),
  bodyParser = require('body-parser'),
  jwt = require('jsonwebtoken'),
  config = require('./config.js'),
  rand = require('csprng'),
  fs = require('fs');

// Generate JWT secret key
var bytes = rand(128,10);
var obj = {
   secret: bytes
};
var json = JSON.stringify(obj);
fs.writeFileSync('key.json', json);

// Mongoose instance connection url
mongoose.Promise = global.Promise;
mongoose.connect(config.message_database);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var middleware = require('./api/middleware');
var messengerRoutes = require('./api/routes/messengerRoutes'); //importing route
var userRoutes = require('./api/routes/userRoutes'); //importing route

userRoutes(app); //register the routes
middleware(app); //NOTE: Order that the middleware gets loaded is important.
// All routes loaded below the middleware must have JWT authentication.
messengerRoutes(app); //register the routes

// Nginx is acting as a reverse proxy with HTTPS setup and redicts from HTTP.
// This application can go through port 8080 to access HTTPS.
app.listen(port);

console.log('Message RESTful API server started on: ' + port);
