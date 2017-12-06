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
var chats = [];

io.on('connection', socketioJwt.authorize({
    secret: JSON.parse(fs.readFileSync("key.json")).secret,
    timeout: 15000 // 15 seconds to send the authentication message
  })).on('authenticated', function(socket) {
    // Socket Authenticated.
    console.log(Date.now() + ' :: User has connected ::  ' + socket.decoded_token.name);
    socket.isWaitingFor = "";
    socket.isChatting = false;
    clients.push(socket);

    // Listen for requests to start a chat.
    socket.on('request', function (data) {
      socket.isWaitingFor = "";
      User.findOne({name: data.name}, function(err, found) {
        if (err) socket.emit('error', "");
        if (found) {
          // Found that user!
          console.log(socket.decoded_token.name + " is searching for " + found.name + ", " + found.challenge);
          clients.forEach(function(receiverSocket) {
            if (socket.decoded_token.name != receiverSocket.decoded_token.name &&
                receiverSocket.decoded_token.name == data.name) {
                  if (receiverSocket.isWaitingFor == socket.decoded_token.name) {
                    // That user was already waiting for the same user to respond
                    // So we can initiate the chat.
                    socket.isChatting = true;
                    receiverSocket.isChatting = true;
                    chats.push({a: socket, b: receiverSocket});
                    socket.emit('chatting', receiverSocket.decoded_token.name);
                    receiverSocket.emit('chatting', socket.decoded_token.name);
                    console.log(socket.decoded_token.name + " is chatting with " + data.name);
                  } else {
                    // Inform this user that someone wants to chat.
                    receiverSocket.emit('request', socket.decoded_token.name);
                    socket.emit('requestSuccess', "waiting");
                    socket.isWaitingFor = data.name
                    console.log(socket.decoded_token.name + " is waiting for " + data.name);
                  }
            }
          });
          if (socket.isWaitingFor == "" && !socket.isChatting) {
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
                receiverSocket.isWaitingFor == socket.decoded_token.name) {
              receiverSocket.emit('decline', socket.decoded_token.name);
              receiverSocket.isWaitingFor = "";
            }
          });
        } // else: didn't find that user
      });
    });

    // Listen for cancels to start a chat.
    socket.on('cancel', function (data) {
      socket.isWaitingFor = "";
      User.findOne({name: data.name}, function(err, found) {
        if (err) socket.emit('error', "");
        if (found) {
          // Found that user!
          clients.forEach(function(receiverSocket) {
            if (receiverSocket.decoded_token.name == found) {
              receiverSocket.emit('cancel', socket.decoded_token.name);
            }
          });
        }
      });
    });

    // Listen for stops to a chat.
    socket.on('stop', function (data) {
      chats.forEach(function(chat) {
        if (chat.a == socket) {
          chat.b.emit('stop', "");
        } else if (chat.b == socket) {
          chat.a.emit('stop', "");
        }
        chat.a.isChatting = false;
        chat.b.isChatting = false;
        var i = chats.indexOf(chat);
        chats.splice(i, 1);
        return;
      });
    });

    // Listen for messages sent in chats
    socket.on('message', function (data) {
      clients.forEach(function(clientSocket) {
        clientSocket.emit('response', (socket.decoded_token.name + ": " + data));
      });
    });

    // Listen for disconnections
    socket.on('disconnect', function (data) {
      if (socket.isChatting) {
        chats.forEach(function(chat) {
          if (chat.a == socket) {
            chat.b.emit('stop', "");
          } else if (chat.b == socket) {
            chat.a.emit('stop', "");
          }
          chat.a.isChatting = false;
          chat.b.isChatting = false;
          var i = chats.indexOf(chat);
          chats.splice(i, 1);
          return;
        });
      } else
      if (socket.isWaitingFor != "") {
        // They are waiting for a response
        User.findOne({name: socket.isWaitingFor}, function(err, found) {
          if (found) {
            // Found that user! Inform them that the user has canceled request.
            clients.forEach(function(receiverSocket) {
              if (receiverSocket.decoded_token.name == found) {
                receiverSocket.emit('cancel', socket.decoded_token.name);
              }
            });
          }
        });
      }
      console.log(Date.now() + ' :: User has disconnected ::  ' + socket.decoded_token.name);
      var i = clients.indexOf(socket);
      clients.splice(i, 1);
    });
});

console.log('Message RESTful API server started on: ' + port);
