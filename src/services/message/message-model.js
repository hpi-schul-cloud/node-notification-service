'use strict';

// message-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sourceSchema = new Schema({
  serviceId: { type: ObjectId, required: true },
  author: { type: String, required: true },
  authenticationToken: {type: String, required: true }
});

const userSchema = new Schema({
  userId: { type: ObjectId, required:true },
  clicked: { type: Boolean, 'default': false }
});

const messageSchema = new Schema({
  // TODO: priority
  title: { type: String, required: true },
  body: { type: String, required: true },
  icon: { type: String, required: false },
  action: { type: String, required: false },
  source: { type: sourceSchema, required: true },
  scope: { type: [ObjectId], required: true },
  users: { type: [userSchema], required: false },
  validTo: { type: Date, required: false },
  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
});

const messageModel = mongoose.model('message', messageSchema);

module.exports = messageModel;
