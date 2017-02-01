'use strict';

// message-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Constants = require('../constants');
const Util = require('../util');

const messageSchema = new Schema({

  title: {type: String, required: true},
  body: {type: String, required: true},
  action: {type: String, required: false},
  image: {type: String, required: false},
  priority: {
    type: String,
    default: Constants.MESSAGE_PRIORITIES.MEDIUM,
    enum: Util.getEnumValues(Constants.MESSAGE_PRIORITIES)
  },
  timeToLive: {type: Date, required: false},

  applicationId: { type: String, required: true }, // ID (not token!!!) of the user or service that sent the message
  scopeIds: { type: [String], required: true },

  userIds: {type: [String], required: false},
  createdAt: {type: Date, 'default': Date.now},
  updatedAt: {type: Date, 'default': Date.now}

});

const messageModel = mongoose.model('message', messageSchema);

messageModel.typename = 'message';
messageModel.attributes = Object.assign({}, Constants.SERIALIZE, {
  attributes: [
    'title',
    'body',
    'action',
    'image',
    'priority',
    'initiatorId',
    'createdAt'
  ]
});

module.exports = messageModel;
