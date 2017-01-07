'use strict';

const hooks = require('./hooks');
const util = require('../util');
const constants = require('../constants');
const mongoose = require('mongoose');
const notification = require('../notification/notification-model');
const errors = require('feathers-errors');

const docs = require('./docs.json');

class Service {

  constructor(options) {
    this.options = options || {};
    this.docs = docs;
  }

  create(data, params) {

    if (!util.isSet(data.notificationId))
      return Promise.reject(new errors.BadRequest('Notification Id Missing'));

    return new Promise((resolve, reject) => {
      notification.findOne({ _id: data.notificationId })
        .then(foundNotification => {

          foundNotification.callbacks.push({ type: data.type });

          if (data.type === constants.CALLBACK_TYPES.CLICKED)
            foundNotification.state = constants.CALLBACK_TYPES.CLICKED;

          return foundNotification.save();
        })
        .then(pushedNot => {
          resolve(pushedNot);
        })
        .catch(err => {
          reject(new errors.BadRequest(err));
        })
    });

  }

}

module.exports = function() {
  const app = this;

  // Initialize our service with any options it requires
  app.use('/callback', new Service());

  // Get our initialize service to that we can bind hooks
  const callbackService = app.service('/callback');

  // Set up our before hooks
  callbackService.before(hooks.before);

  // Set up our after hooks
  callbackService.after(hooks.after);
};

module.exports.Service = Service;
