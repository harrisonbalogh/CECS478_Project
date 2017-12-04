'use strict';
var mongoose = require('mongoose'),
  Message = mongoose.model('Message');

exports.connect = function(req, res) {
  var io = req.app.get('socketio');
  console.log("Socketio obtained: " + io);
  io.emit('A response!!!');
}

// exports.upload_message = function(req, res) {
//   var new_message = new Message(req.body);
//   new_message.save(function(err, message) {
//     if (err)
//       res.send(err);
//     res.json(message);
//   });
// };
//
// exports.download_messages = function(req, res) {
//   Message.find({}, function(err, message) {
//     if (err)
//       res.send(err);
//     res.json(message);
//   });
// };

/*
exports.download_messages = function(req, res) {
  Message.find({}, function(err, message) {
    if (err)
      res.send(err);
    res.json(message);
  });
};

exports.read_a_task = function(req, res) {
  Message.findById(req.params.taskId, function(err, task) {
    if (err)
      res.send(err);
    res.json(task);
  });
};


exports.update_a_task = function(req, res) {
  Task.findOneAndUpdate({_id: req.params.taskId}, req.body, {new: true}, function(err, task) {
    if (err)
      res.send(err);
    res.json(task);
  });
};

exports.delete_a_task = function(req, res) {
  Task.remove({
    _id: req.params.taskId
  }, function(err, task) {
    if (err)
      res.send(err);
    res.json({ message: 'Task successfully deleted' });
  });
};
*/
