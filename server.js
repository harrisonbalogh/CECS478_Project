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
  fs = require('fs'),
  https = require('https');

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

// Get LetsEncrypt SSL certificates to sign HTTPS.
var options = {
  key: fs.readFileSync('/etc/letsencrypt/live/hm478project.me/private.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/hm478project.me/cert.pem'),
  ca: fs.readFileSync('/etc/letsencrypt/live/hm478project.me/chain.pem')
}
console.log("Letsencrypt files are loaded: " + options.key)

// Redirect HTTP traffic to HTTPS if SSL didnt automatically do that.
http.createServer(function(req, res) {
        res.writeHead(301, {"Location": "https://" + req.headers['host'] + req.url});
        res.end();
}).listen(80);

https.createServer(options, app).listen(443);

// app.listen(port);

console.log('Message RESTful API server started on: ' + port);
