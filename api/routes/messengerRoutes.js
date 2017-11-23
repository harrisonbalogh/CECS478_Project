'use strict';

module.exports = function(app) {
  var messageList = require('../controllers/messengerController');

  // Message Post Route
  app.route('/messages')
    .post(messageList.upload_message)
    .get(messageList.download_messages);
};
