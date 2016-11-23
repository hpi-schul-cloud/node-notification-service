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
  service: { type: String, enum: ['firebase', 'apn', 'email'], required: true },
  type: { type: String, enum: ['web', 'mobile', 'email'], required: true },
  token: { type: String, required: true },
  active: { type: Boolean, default: false }
  // TODO: necessary? plattform: { type: String, required: true }
});

const userSchema = new Schema({
  name: { type: String, required: true },
  devices: { type: [deviceSchema], required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
