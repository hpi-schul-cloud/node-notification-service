'use strict';

// user-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

// was created by feathers, we could use it for mocking schulcloud users

// Add a table for devices

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Constants = require('../constants');
const Util = require('../util');

const deviceSchema = new Schema({
  token: { type: String, required: true, unique: true },
  type: { type: String, enum: Util.getEnumValues(Constants.DEVICE_TYPES), required: true },
  service: { type: String, enum: Util.getEnumValues(Constants.SEND_SERVICES), required: true },
  OS: { type: String, required: true},
  name: { type: String, required: true},
  state: {type: String, enum: Util.getEnumValues(Constants.DEVICE_STATES), required: true},
  active: { type: Boolean, default: false }, // Active device at the moment
  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
});

const userSchema = new Schema({
  applicationId: { type: String, required: true, unique: true },
  devices: { type: [deviceSchema], required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userModel = mongoose.model('user', userSchema);

userModel.typename_device = 'device';
userModel.attributes_device = {
  id: '_id',
  attributes: [
    'token',
    'service',
    'state'
  ]
}

userModel.typename = 'user';
userModel.attributes = {
  id: '_id',
  attributes: [
    'applicationId',
    'createdAt',
    'updatedAt',
    'devices'
  ],
  devices: {
    ref: '_id',
    include: true,
    attributes: userModel.attributes_device.attributes
  }
};

module.exports = userModel;
