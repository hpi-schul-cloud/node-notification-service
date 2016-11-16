'use strict';

const hooks = require('./hooks');
const errors = require('feathers-errors');
const util = require('../util');
const orchestration = require('../orchestration');
const notification = require('../notification/notification-model');

class Service {

  constructor(options) {
    this.options = options || {};
  }

  // create maps to HTTP POST
  create(data, params) {

    // check if all necessary information was provided
    if (!util.isAllSet([data.title,data.text]))
      return Promise.reject(new errors.BadRequest('Parameter Missing'));

    console.log('[INFO] New notification Request with title ' + data.title);
    debugger;

    // create a new notification object
    const newNotification = new notification({
      title: data.title,
      text: data.text
    });

    // save the new notification to db
    return new Promise((resolve, reject) => {
        newNotification.save()
            .then( notification => {
                // saving was successful, moving on to orchestration
                return orchestration.orchestrate(notification);
            })
            .then( notification => {
                // all the orchestration and sending was succesful. saving notification in new state
                return notification.save();
            })
            .then( notification => {
                // saving was successful
                resolve(notification);
            })
            .catch( err => {
                reject(new errors.GeneralError('Internal Error'));
            })
    });

  }

}

module.exports = function(){
  const app = this;

  // Initialize our service with any options it requires
  app.use('/resolve', new Service());

  // Get our initialize service to that we can bind hooks
  const resolveService = app.service('/resolve');

  // Set up our before hooks
  resolveService.before(hooks.before);

  // Set up our after hooks
  resolveService.after(hooks.after);
};

module.exports.Service = Service;
