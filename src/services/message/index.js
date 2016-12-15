'use strict';

const service = require('feathers-mongoose');
const Message = require('./message-model');
const hooks = require('./hooks');
const errors = require('feathers-errors');
const Util = require('../util');
const Resolve = require('../resolve');
const Orchestration = require('../orchestration');
const Notification = require('../notification/notification-model');

class Service {

  constructor(options) {
    this.options = options || {};

    this.docs = {
      description: 'A service to send messages',
      definitions: {  // Define the corresponding payload Model
        messages: {
          type: "object",
          required: [
            "title", "body", "token", "scopeIds"
          ],
          properties: {
            title: {
              type: "string",
              description: "Title of the Notification"
            },
            body: {
              type: "string",
              description: "Body of the Notification"
            },
            action: {
              type: "string",
              description: "Action to be done when the user clicks the notification"
            },
            priority: {
              type: "string",
              description: "either low, medium or high"
            },
            timeToLive: {
              type: "date-time",
              description: ""
            },
            token: {
              type: "string",
              description: "Token of the initiating service or user"
            },
            scopeIds: {
              type: "array",
              items: {
                type: "string"
              },
              description: "One or more scope Ids that either represent a single user or a group of users"
            }
          },
          example: {
            title: "New Notification",
            body: "You have a new Notification",
            token: "servicetoken2",
            scopeIds: ["userIdOrScopeId", "testScopeId"]
          }
        }
      },
      create: {
        summary: 'Send a Notification',
        description: 'Post a Message to the Service that will be resolved to one or many notifications',
        responses: {
          201: {
            description: 'Message was created and will be delivered to the specified user/group of users'
          },
          400: {
            description: 'The Provided payload is either incomplete or one or more values are invalid'
          },
          500: {
            description: 'internal error try again later.'
          }
        }
      }
    }
  }

  get(id, params) {
    console.log('[INFO] get message ' + id);
    return Notification
      .find({'message.messageId': id})
      .then(notifications => {
        let data = [];
        notifications.forEach(notification => {
          data.push({
            user: notification.user,
            status: notification.callbacks.length
          });
        });
        return data;
      })
  }


  create(data, params) {
    if (!Util.isAllSet([data.title, data.body, data.token, data.scopeIds]))
      return Promise.reject(new errors.BadRequest('Parameters missing.'));

    let message = new Message(data);

    return new Promise((resolve, reject) => {
      // check if the provided token belongs to a service or user with authorities to push notifications
      Resolve.verifyService(data.token)
        .then(serviceOrUserId => {
          message.initiatorId = serviceOrUserId;
          return Resolve.resolveUser(message.scopeIds);
        })
        .then(userIds => {
          // set resolved userIds
          message.userIds = userIds;
          return message.save()
        })
        .then(message => {
          // create notification for each user
          let notifications = message.userIds.reduce((notifications, userId) => {
            let notification = new Notification({
              message: {
                messageId: message._id,
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
          Orchestration.orchestrate(notifications);
          resolve(message);
        })
        .catch(error => {
          reject(error);
        });
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
