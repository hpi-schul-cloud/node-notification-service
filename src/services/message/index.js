'use strict';

const Mongoose = require('mongoose');
const service = require('feathers-mongoose');
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
    return Notification
      .find({'message._id': new Mongoose.Types.ObjectId(id)})
      .then(notifications => {
        console.log(' - ' + notifications.length + ' Notifications found...');
        if (notifications.length === 0) {
          return new errors.NotFound('Unknown id.');
        }
        let result = notifications.map(function (notification) {
          return { // create some stats about which user has notifications clicked
            user: notification.user,
            clicked: notification.state === Constants.NOTIFICATION_STATES.CLICKED,
            devices: notification.devices
          };
        });
        return result;
      })
      .catch(err => {
        // will be thrown on wrong id format
        return new errors.GeneralError(err);
      });
  }

  create(data, params) {
    let message = new Message({
      title: data.title,
      body: data.body,
      scopeIds: data.scopeIds,
      applicationId: data.author.id
    });

    let message = new Message(data);
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
            message: { // copy required content only
              _id: message._id,
              title: message.title,
              body: message.body,
              action: message.action,
              priority: message.priority
            },
            user: userId
          }).save();
          return notifications.concat(notification);
        }, []);
        return Promise.all(notifications);
      })
      .then(notifications => {
        return Orchestration.orchestrate(notifications);
      })
      .then(()=> {
        return message; // TODO remove unnecessary data from model
      });
  }
}

module.exports = function () {
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
