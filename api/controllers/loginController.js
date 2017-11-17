'use strict';

exports.login = function(req, res) {
  var new_message = new Message(req.body);
  new_message.save(function(err, message) {
    if (err)
      res.send(err);
    res.json(message);
  });
  res.send(200);
};
