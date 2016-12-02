'use strict';

const service       = require('feathers-mongoose');
const Message       = require('./message-model');
const hooks         = require('./hooks');
const errors        = require('feathers-errors');
const Util          = require('../util');
const Resolve       = require('../resolve');
const Orchestration = require('../orchestration');
const Notification  = require('../notification/notification-model');

class Service {
  constructor(options) {
    this.options = options || {};
  }

  create(data, params) {
    if (!Util.isAllSet([data.title, data.body, data.authToken, data.userId, data.scopeIds]))
      return Promise.reject(new errors.BadRequest('Parameters missing.'));

    let message = new Message(data);

    return new Promise((resolve, reject) => {
      message.save()
        .then( message => {
          return Resolve.verifyService(message.authToken);
        })
        .then( authToken => {
          return Resolve.verifyUser(message.userId);
        })
        .then( userId => {
          return Resolve.resolveUser(message.scopeIds);
        })
        .then( userIds => {
          // set resolved userIds
          message.userIds = userIds;
          return Promise.resolve(message);
        })
        .then( message => {
          // create notification for each user
          let notifications = message.userIds.reduce((notifications, userId) => {
            let notification = new Notification({
              message: message,
              user: userId
            }).save();
            return notifications.concat(notification);
          }, []);

          return Promise.all(notifications);
        })
        .then( notifications => {
          Orchestration.orchestrate(notifications);
          resolve(message);
        })
        .catch( error => {
          reject(error);
        });
    });

  }
}

module.exports = function() {
  const app = this;

  // Initialize our service with any options it requires
  app.use('/messages', new Service());

  // Get our initialize service to that we can bind hooks
  const messageService = app.service('/messages');

  // Set up our before hooks
  messageService.before(hooks.before);

  // Set up our after hooks
  messageService.after(hooks.after);
};

module.exports.Service = Service;
