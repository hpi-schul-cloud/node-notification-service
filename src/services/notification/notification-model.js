'use strict';

// notification-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Constants = require('../constants');
const Util = require('../util');

const callbackSchema = new Schema({
  type: { type: String, enum:['received','clicked'], required: true},  //
  createdAt: { type: Date, 'default': Date.now }
});

const messageSchema = new Schema({
  messageId: { type: String, ref: "message", required: true},
  title: { type: String, required: true },
  body: { type: String, required: true },
  action: { type: String, required: false },
  priority: { type: String, default: Constants.MESSAGE_PRIORITIES.MEDIUM, enum: Util.getEnumValues(Constants.MESSAGE_PRIORITIES) }
});

// TODO notification model for db
const notificationSchema = new Schema({
  message: { type: messageSchema, required: true },
  user: { type: String, ref: 'user', required: true },
  state: { type: String, default: 'created', enum:  Util.getEnumValues(Constants.NOTIFICATION_STATES)},
  stateHistory: [],
  callbacks: [callbackSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

notificationSchema.methods.changeState = function changeState(newState) {
  this.stateHistory.push({'state': this.state, 'timestamp': Date.now});
  this.state = newState;
};

const notificationModel = mongoose.model('notification', notificationSchema);

module.exports = notificationModel;
