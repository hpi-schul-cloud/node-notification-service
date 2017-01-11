'use strict';

const hooks = require('./hooks');
const user = require('../user/user-model');
const Resolve = require('../resolve');
const errors = require('feathers-errors');

const docs = require('./docs.json');

class Service {

  constructor(options) {
    this.options = options || {};

    this.docs = docs;
  }

  // Adds a device for a user to the database
  create(data, params) {

    // Create device object
    const newDevice = {
      token: data.device_token,
      type: data.type,
      service: data.service,
      name: data.name,
      OS: data.OS,
      state: 'registered'
    };

    let newUser = new user({
      schulcloudId: data.schulcloudId,
      devices: [newDevice]
    });

    // Insert data into DB
    return user.findOne({ schulcloudId: data.schulcloudId })
      .then(user => {
        if (!user) {
          var user = newUser;
        } else {
          const deviceExists = user.devices.some(device => {
            if (device.token === newDevice.token) return true;
          });
          if (!deviceExists) {
            user.devices.push(newDevice);
          }
        }
        return user.save();
      })
  }
}

module.exports = function() {
  const app = this;

  // Initialize our service with any options it requires
  app.use('/devices', new Service());

  // Get our initialize service to that we can bind hooks
  const deviceService = app.service('/devices');

  // Set up our before hooks
  deviceService.before(hooks.before);

  // Set up our after hooks
  deviceService.after(hooks.after);
};

module.exports.Service = Service;
