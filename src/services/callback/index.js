'use strict';

const hooks = require('./hooks');
const util = require('../util');
const mongoose = require('mongoose');
const notification = require('../notification/notification-model');
const callback = require('./callback-model');
const errors = require('feathers-errors');

class Service {
  constructor(options) {
    this.options = options || {};
  }

  create(data, params) {
    if (!util.isAllSet([data.notificationId]))
      return Promise.reject(new errors.BadRequest('Parameter Missing'));

    return new Promise((resolve, reject) => {

      var newCbId;

      notification.findOne({_id:data.notificationId})
        .then( notification => {
            const newCb = new callback({_creator: notification._id});
            return newCb.save();
        })
        .then ( newCb => {
            newCbId = newCb._id;
            return notification.findOne({_id:data.notificationId})
        })
        .then ( not => {
            not.callbacks.push(newCbId);
            return not.save();
        })
        .then ( pushedNot => {
            console.log(pushedNot);
            resolve(notification.findOne({_id:data.notificationId}).populate('callbacks'));
        })
        .catch( err => {
            return reject(new errors.BadRequest(err));
        })

    });

  }

}

module.exports = function(){
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
