'use strict';

module.exports = function(app) {
  var loginController = require('../controllers/loginController');

  // Login Route
  app.route('/login')
    .post(loginController.login);
  app.route('/register')
    .post(loginController.register);
  app.route('/users')
    .get(loginController.users);
};
