'use strict';
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  jwt = require('jsonwebtoken'),
  fs = require('fs');
var secret = JSON.parse(fs.readFileSync("key.json")).secret;

exports.login = function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err)
      res.send(err);

    if (!user) {
      res.json({ success: false, message: 'Login failed. User not found.' });
    } else if (user) {
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Login failed. Wrong password.' });
      } else {

        const payload = {
          name: user.name
        };
        var token = jwt.sign(payload, secret, {
          expiresIn: 60*60*24 // expires in 24 hours
        });
        res.json({
          success: true,
          message: 'Token produced!',
          token: token
        });
      }
    }
  });
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
