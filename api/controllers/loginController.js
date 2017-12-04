'use strict';
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  jwt = require('jsonwebtoken'),
  fs = require('fs'),
  rand = require('csprng'),
  crypto = require('crypto');
var secret = JSON.parse(fs.readFileSync("key.json")).secret;

exports.login1 = function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) res.json({ success: false });

    if (!user) {
      res.json({ success: false}); // Login failed. User not found.
    } else if (user) {
      // Generate new challenge
      var challenge = rand(50,10);
      // Update the database document for this user
      user.challenge = challenge;
      user.save(function(err) {
        if (err)
          console.log("Error saving challenge for " + user.name);
      });
      res.json({
        salt: user.salt,
        challenge: user.challenge
      });
    }
  });
};
exports.login2 = function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) res.json({ success: false });

    if (!user) {
      res.json({ success: false }); // Login failed. User not found.
    } else if (user) {
      var hmacServer = crypto.createHmac('sha256', user.password).update(user.challenge).digest('hex');
      var hmacClient = req.body.tag;
      if (hmacServer == hmacClient) {
        // They match so return a JWT to client.
        const payload = {
          name: user.name
        };
        var token = jwt.sign(payload, secret, {
          expiresIn: 60*60*24 // expires in 24 hours
        });
        res.json({
          success: true,
          token: token
        });
      } else {
        res.json({ success: false });
      }
    }
  });
};

exports.register = function(req, res) {

  User.find({name: req.body.name}, function(err, found) {
    if (err)
      res.json({ success: false });
    if (found == '') {
      // Apply password policies
      if (req.body.password.length >= 8) {

        var salt = rand(50,10);
        var hash = crypto.createHash('sha256').update(req.body.password + salt);
        var newUser = {
          name: req.body.name,
          password: hash.digest('hex'),
          challenge: "",
          salt: salt
        };

        var new_user = new User(newUser);
        new_user.save(function(err, message) {
          if (err)
            res.json({ success: false });
          res.json({ success: true });
        });
      } else {
        res.json({ success: false}); // Must be at least 8 characters.
      }
    } else {
      // This user already exists, can't use that!
      res.json({ success: false }); // That user is taken.
    }
  });
};

exports.users = function(req, res) {
  User.find({}, function(err, message) {
    if (err)
      res.json({ success: false });
    res.json(message);
  });
};
exports.flush = function(req, res) {
  User.remove({}, function(err, message) {
    if (err)
      res.json({ success: false })
    res.json({ success: true })
  });
};
