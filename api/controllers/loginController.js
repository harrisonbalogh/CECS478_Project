'use strict';
var mongoose = require('mongoose'),
  User = mongoose.model('User');

exports.login = function(req, res) {
  if (err)
    res.send(err);
  res.send(200);
};

exports.register = function(req, res) {
  var new_user = new User(req.body);
  new_user.save(function(err, message) {
    if (err)
      res.send(err);
    res.json(message);
  });
};

exports.users = function(req, res) {
  User.find({}, function(err, message) {
    if (err)
      res.send(err);
    res.json(message);
  });
};
