'use strict';

// user-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

// was created by feathers, we could use it for mocking schulcloud users

// Add a table for devices

const mongoose = require('mongoose');
const messageModel = require('../message/message-model.js');
const Schema = mongoose.Schema;

const notificationStates = ['created', 'sent', 'seen', 'clicked', 'deleted', 'failed'];

const deviceSchema = new Schema({
  token: { type: String, required: true },
  type: { type: String, enum: ['mobile', 'desktop', 'email'], required: true },
  service: { type: String, enum: ['firebase', 'apn', 'email'], required: true },
  OS: { type: String, required: true},
  name: { type: String, required: true},
  state: {type: String, enum: ['registered','failed','removed'], required: true},
  active: { type: Boolean, default: false } // Active device at the moment
});

const userSchema = new Schema({
  name: { type: String, required: true },
  devices: { type: [deviceSchema], required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userModel = mongoose.model('user', userSchema);
const deviceModel = mongoose.model('device', deviceSchema);

module.exports = userModel;
module.exports = deviceModel;
