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

const deviceSchema = new Schema({
  token: { type: String, required: true, unique: true },
  type: { type: String, enum: ['mobile', 'desktop', 'email'], required: true },
  service: { type: String, enum: ['firebase', 'apn', 'email'], required: true },
  OS: { type: String, required: true},
  name: { type: String, required: true},
  state: {type: String, enum: ['registered','failed','removed'], required: true},
  active: { type: Boolean, default: false }, // Active device at the moment
  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
});

const userSchema = new Schema({
  schulcloudId: { type: String, required: true, unique: true },
  devices: { type: [deviceSchema], required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
