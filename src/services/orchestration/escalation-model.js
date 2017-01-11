'use strict';

// escalation-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Util = require("../util.js");
const Constants = require("../constants.js");

const escalationSchema = new Schema({
  notification: {type: String, ref: 'notification', required: true},
  priority: {
    type: String,
    enum: Util.getEnumValues(Constants.MESSAGE_PRIORITIES),
    default: Constants.MESSAGE_PRIORITIES.MEDIUM,
    required: true
  },
  nextEscalationType: {
    type: String,
    enum: Util.getEnumValues(Constants.DEVICE_TYPES),
    default: Constants.DEVICE_TYPES.NONE,
    required: true
  },
  nextEscalationDue: {type: Date, 'default': Date.now},
  createdAt: {type: Date, 'default': Date.now},
  updatedAt: {type: Date, 'default': Date.now}
});

const escalationModel = mongoose.model('escalation', escalationSchema);

module.exports = escalationModel;
