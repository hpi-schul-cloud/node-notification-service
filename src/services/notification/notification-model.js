'use strict';

// notification-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const messageSchema = mongoose.model('message').schema;


// TODO notification model for db
const notificationSchema = new Schema({
  message: { type: messageSchema, required: true },
  user: { type: Schema.ObjectId, ref: 'user', required: true },
  state: { type: String, default: 'created' },
  stateHistory: [],
  callbacks: [{                                   // hier machen wir eine referenz zu dem callback model
      type: Schema.ObjectId,
      ref: 'callback'
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

notificationSchema.methods.changeState = function changeState(newState) {
  this.stateHistory.push({'state': this.state, 'timestamp': Date.now});
  this.state = newState;
}

const notificationModel = mongoose.model('notification', notificationSchema);

module.exports = notificationModel;
