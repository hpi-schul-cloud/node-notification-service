'use strict';

const Message = require('./message-model');
const hooks = require('./hooks');
const errors = require('feathers-errors');
const Resolve = require('../resolve');
const Orchestration = require('../orchestration');
const Notification = require('../notification/notification-model');

const docs = require('./docs.json')

class Service {

  constructor(options) {
    this.options = options || {};
    this.docs = docs;
  }

  get(id, params) {
    console.log('[INFO] get message ' + id);
    return Message.findOne({ _id: id });
  }

  create(data, params) {
    let message = new Message({
      title: data.title,
      body: data.body,
      scopeIds: data.scopeIds,
      applicationId: data.author.id
    });

    return Resolve
      .resolveScope(message.scopeIds).then(userIds => {
        // set resolved userIds
        message.userIds = userIds;
        return message.save()
      })
      .then(message => {
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
      .then(notifications => {
        return Orchestration.orchestrate(notifications);
        // resolve(message);
      })
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
