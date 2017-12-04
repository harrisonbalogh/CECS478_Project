'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Mongooose - Schema maps to MongoDB collection
// Create new model for Schema call Messages
module.exports = mongoose.model('Message', new Schema({
  sender: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  upload_date: {
    type: Date,
    required:  true
  }
}));
