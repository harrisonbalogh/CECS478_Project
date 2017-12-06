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
  http = require('http'),
  mongoose = require('mongoose'),
  User = mongoose.model('User');

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
// Register routes. Order that the middleware gets loaded is important.
userRoutes(loginApp);
// NOTE: Middleware and messengerRoutes were replaced by websocket protocol message exchange.
// middleware(loginApp); // routes loaded below middleware must have JWT authentication.
// messengerRoutes(loginApp);
// Nginx is acting as a reverse proxy with HTTPS setup and redicts from HTTP.
// Nginx listens locally on the server to port 8080 responding to http://127.0.0.1
loginApp.listen(port); // http://127.0.0.1:8080

// =============== Websocket Server (10001) ===============
// Setup socket
var socketServer = messageApp.listen(10001); // http://127.0.0.1:10001
var io = require('socket.io')(socketServer)
var clients = [];

io.on('connection', socketioJwt.authorize({
    secret: JSON.parse(fs.readFileSync("key.json")).secret,
    timeout: 15000 // 15 seconds to send the authentication message
  })).on('authenticated', function(socket) {
    // Socket Authenticated.
    console.log(Date.now() + ' :: User has connected ::  ' + socket.decoded_token.name);
    socket.waitingFor = undefined;
    socket.partner = undefined;
    socket.isExchanged = false;
    clients.push(socket);

    // Listen for requests to start a chat.
    socket.on('request', function (data) {
      socket.waitingFor = undefined;
      User.findOne({name: data.name}, function(err, found) {
        if (err) socket.emit('error', "");
        if (found) {
          // Found that user!
          console.log(socket.decoded_token.name + " is searching for " + found.name);
          var clientIsOffline = true;
          clients.forEach(function(receiverSocket) {
            if (socket.decoded_token.name != receiverSocket.decoded_token.name &&
                receiverSocket.decoded_token.name == data.name) {
                  if (receiverSocket.waitingFor == socket) {
                    // That user was already waiting for the same user to respond
                    // So we can initiate the chat.
                    socket.partner = receiverSocket;
                    receiverSocket.partner = socket;
                    socket.waitingFor = undefined;
                    receiverSocket.waitingFor = undefined;
                    socket.emit('chatting', receiverSocket.decoded_token.name);
                    receiverSocket.emit('chatting', socket.decoded_token.name);
                    console.log(socket.decoded_token.name + " is chatting with " + data.name);
                  } else {
                    // Inform this user that someone wants to chat.
                    receiverSocket.emit('request', socket.decoded_token.name);
                    socket.emit('requestSuccess', "waiting");
                    socket.waitingFor = receiverSocket;
                    console.log(socket.decoded_token.name + " is waiting for " + data.name);
                  }
                  clientIsOffline = false;
                  return;
            }
          });
          if (clientIsOffline) {
            socket.emit('requestFailed', "User is not online.");
          }
        } else {
          // Didn't find that user...
          socket.emit('requestFailed', "User not found.");
        }
      });
    });

    // Listen for declines to start a chat.
    socket.on('decline', function (data) {
      User.findOne({name: data.name}, function(err, found) {
        if (err) socket.emit('error', "");
        if (found) {
          // Found that user!
          clients.forEach(function(receiverSocket) {
            if (receiverSocket.decoded_token.name == found.name &&
                receiverSocket.waitingFor == socket) {
              receiverSocket.emit('decline', socket.decoded_token.name);
              receiverSocket.waitingFor = undefined;
            }
          });
        } // else: didn't find that user
      });
    });

    // Listen for cancels to start a chat.
    socket.on('cancel', function (data) {
      socket.waitingFor = undefined;
      User.findOne({name: data.name}, function(err, found) {
        if (err) socket.emit('error', "");
        if (found) {
          // Found that user!
          clients.forEach(function(receiverSocket) {
            if (receiverSocket.decoded_token.name == found.name) {
              receiverSocket.emit('cancel', socket.decoded_token.name);
            }
          });
        }
      });
    });

    // Listen for stops to a chat.
    socket.on('stop', function (data) {
      if (socket.partner) {
        socket.partner.emit('stop', "");
        socket.partner.partner = undefined;
        socket.partner.isExchanged = false;
        socket.partner = undefined;
        socket.isExchanged = false;
      }
    });

    socket.on('exchange', function (data) {
      // exchange keys / validate TODO:
      if (socket.partner) {
        socket.isExchanged = true;
        socket.partner.emit('exchange', data.key);
      }
    });

    // Listen for messages sent in chats
    socket.on('message', function (data) {
      if (socket.partner && socket.isExchanged) {
        var msg = socket.decoded_token.name + ": " + data
        socket.partner.emit('message', msg);
        socket.emit('message', msg);
      }
    });

    // Listen for disconnections
    socket.on('disconnect', function (data) {
      if (socket.partner) {
        socket.partner.emit('stop', "");
        socket.partner.partner = undefined;
        socket.partner.isExchanged = false;
        socket.partner = undefined;
        socket.isExchanged = false;
      } else
      if (socket.waitingFor) {
        socket.waitingFor.emit('cancel', socket.decoded_token.name);
      }
      console.log(Date.now() + ' :: User has disconnected ::  ' + socket.decoded_token.name);
      var i = clients.indexOf(socket);
      clients.splice(i, 1);
    });
});

console.log('Message RESTful API server started on: ' + port);
