'use strict';

const hooks = require('./hooks');
const user = require('../user/user-model');
const Resolve = require('../resolve');
const errors = require('feathers-errors');
const Authentication = require('../authentication');
const Constants = require('../constants');

const docs = require('./docs.json');

class Service {

  constructor(options) {
    this.options = options || {};

    this.docs = docs;
  }

  // Adds a device for a user to the database
  create(data, params) {

    console.log('[DEVICE] ' + JSON.stringify(data));

    // Create device object
    const newDevice = {
      token: data.device_token,
      type: data.type,
      service: data.service,
      name: data.name,
      OS: data.OS,
      state: Constants.DEVICE_STATES.REGISTERED
    };

    let newUser = new user({
      applicationId: data.author.id,
      devices: [newDevice]
    });


    // Insert data into DB
    return user.findOne({ applicationId: data.author.id })
      .then(user => {
        if (!user) {
          user = newUser;
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

  remove(data, params) {
    console.log('[DEVICE REMOVE]' + JSON.stringify(params));
    // TODO: move auth in hooks
    // TODO: find better way then passing token as query param
    return user.findOne({ applicationId: params.author.id })
      .then(user => {
        if (user) {
          // find device
          let index = -1;
          for (let i = 0; i < user.devices.length; i++) {
            if (user.devices[i].token === data) {
              index = i;
              break;
            }
          }

          // remove device
          if (index > -1) {
            user.devices.splice(index, 1);
          }

          return user.save();
        }
      });
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
