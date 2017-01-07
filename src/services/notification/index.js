'use strict';

const service = require('feathers-mongoose');
const notification = require('./notification-model');
const hooks = require('./hooks');

const docs = require('./docs.json');


// This service is designed to access the central notification database
// maybe, this will also be used as auditing service not sure right now
module.exports = function() {
  const app = this;

  const options = {
    Model: notification,
    paginate: {
      default: 5,
      max: 25
    }
  };


  // hack to trick swagger into not documenting disabled routes
  let s = service(options);
  s.create = null;
  s.patch = null;
  s.update = null;
  s.remove = null;

  s.docs = docs;

  // Initialize our service with any options it requires
  app.use('/notifications', s);

  // Get our initialize service to that we can bind hooks
  const notificationService = app.service('/notifications');

  // Set up our before hooks
  notificationService.before(hooks.before);

  // Set up our after hooks
  notificationService.after(hooks.after);
};
