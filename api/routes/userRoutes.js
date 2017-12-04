'use strict';

module.exports = function(app) {
  var loginController = require('../controllers/loginController');

  // Login Route
  app.route('/login1')
    .post(loginController.login1);
  app.route('/login2')
    .post(loginController.login2);
  app.route('/register')
    .post(loginController.register);
  app.route('/users')
    .get(loginController.users);
};
