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
  socketioJwt = require("socketio-jwt");

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
var server = app.listen(port);

// Setup socket
var io = require('socket.io')(server);
// io.on('connection', socketioJwt.authorize({
//     secret: JSON.parse(fs.readFileSync("key.json")).secret,
//     timeout: 15000 // 15 seconds to send the authentication message
//   })).on('authenticated', function(socket) {
//     //this socket is authenticated, we are good to handle more events from it.
//     console.log('hello! ' + socket.decoded_token.name);
// });
io.on('connection', function (socket) {
  console.log("On connection...");
  socket.emit('message', {content: 'somemessage'});
  socket.on('received', function(data) {
    console.log("Received this data: " + data);
  });
  // socket.emit('news', { hello: 'world' });
  // socket.on('my other event', function (data) {
  //   console.log(data);
  // });
});
// app.set('socketio', io);

console.log('Message RESTful API server started on: ' + port);
