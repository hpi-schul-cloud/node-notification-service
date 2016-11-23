'use strict';

// callback-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const callbackSchema = new Schema({
  _creator: { type: Schema.ObjectId, ref:'notification'},
  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
});

const callbackModel = mongoose.model('callback', callbackSchema);

module.exports = callbackModel;