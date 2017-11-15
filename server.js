var express = require('express'),
  app = express(),
  port = process.env.PORT || 8080,
  mongoose = require('mongoose'),
  Task = require('./api/models/messengerModel'), //created model loading here
  bodyParser = require('body-parser'),
  expressJWT = require('express-jwt'),
  jwt = require('jsonwebtoken');

// mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/Tododb');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(expressJWT({ secret: 'supersecret' }).unless({}))

var routes = require('./api/routes/messengerRoutes'); //importing route
routes(app); //register the route

app.listen(port);

console.log('todo list RESTful API server started on: ' + port);
