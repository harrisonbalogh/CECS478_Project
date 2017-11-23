var jwt = require('jsonwebtoken'),
    config = require('../config.js'),
    fs = require('fs'),
    secret = JSON.parse(fs.readFileSync("key.json")).secret;

module.exports = function(app) {
  app.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

      // verifies secret and checks exp
      jwt.verify(token, secret, function(err, decoded) {
        if (err) {
          return res.json({ success: false, message: 'Failed to authenticate token with secret: ' + secret });
        } else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;
          next();
        }
      });

    } else {

      // if there is no token
      // return an error
      return res.status(403).send({
          success: false,
          message: 'No token provided.'
      });
    }
  });
};
