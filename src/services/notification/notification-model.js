'use strict';

// notification-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;


// TODO notification model for db
const notificationSchema = new Schema({
  title: { type: String, required: true },
  text: { type: String, required: false },
  state: { type: String, default: 'created' },
  stateHistory: [],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

notificationSchema.methods.changeState = function changeState(newState) {
  this.stateHistory.push({'state': this.state, 'timestamp': Date.now});
  this.state = newState;
}

const notificationModel = mongoose.model('notification', notificationSchema);

module.exports = notificationModel;