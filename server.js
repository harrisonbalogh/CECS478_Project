var express = require('express'),
  loginApp = express(),
  messageApp = express(),
  port = process.env.PORT || 8080,
  mongoose = require('mongoose'),
  Message = require('./api/models/messengerModel'), //created model loading here
  User = require('./api/models/userModel'),
  bodyParser = require('body-parser'),
  jwt = require('jsonwebtoken'),
  config = require('./config.js'),
  rand = require('csprng'),
  fs = require('fs'),
  socketioJwt = require("socketio-jwt"),
  http = require('http');

// Generate JWT secret key
var bytes = rand(128,10);
var obj = {
   secret: bytes
};
var json = JSON.stringify(obj);
fs.writeFileSync('key.json', json);

messageApp.use(bodyParser.urlencoded({ extended: true }));
messageApp.use(bodyParser.json());

// =============== Login App Server (8080) ===============
loginApp.use(bodyParser.urlencoded({ extended: true }));
loginApp.use(bodyParser.json());
// Mongoose instance connection url
mongoose.Promise = global.Promise;
mongoose.connect(config.message_database);
// Routes
var middleware = require('./api/middleware');
var messengerRoutes = require('./api/routes/messengerRoutes');
var userRoutes = require('./api/routes/userRoutes');
// Register routes. NOTE: Order that the middleware gets loaded is important.
userRoutes(loginApp);
middleware(loginApp); // routes loaded below middleware must have JWT authentication.
// messengerRoutes(loginApp);
// Nginx is acting as a reverse proxy with HTTPS setup and redicts from HTTP.
// Nginx listens locally on the server to port 8080 responding to http://127.0.0.1
loginApp.listen(port); // http://127.0.0.1:8080

// =============== Websocket Server (10001) ===============
// Setup socket
var socketServer = messageApp.listen(10001); // http://127.0.0.1:10001
var io = require('socket.io')(socketServer).of('/messages');
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
// loginApp.set('socketio', io);

console.log('Message RESTful API server started on: ' + port);
