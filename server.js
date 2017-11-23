var express = require('express'),
  app = express(),
  port = process.env.PORT || 8080,
  mongoose = require('mongoose'),
  Message = require('./api/models/messengerModel'), //created model loading here
  User = require('./api/models/userModel'),
  bodyParser = require('body-parser'),
  jwt = require('jsonwebtoken'),
  config = require('./config.js');
  //,
  //expressJWT = require('express-jwt'),
  //jwt = require('jsonwebtoken');

// mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect(config.message_database);
app.set('appSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(expressJWT({ secret: 'supersecret' }).unless({}))

var routes = require('./api/routes/messengerRoutes'); //importing route
routes(app); //register the route

app.listen(port);

console.log('Message RESTful API server started on: ' + port);
