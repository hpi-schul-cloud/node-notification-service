'use strict';

const hooks = require('./hooks');
const device = require('../user/index');
const resolve = require('../resolve/index');

class Service {

  constructor(options) {
    this.options = options || {};
  }

  // Adds a device for a user to the database
  create(data, params) {

    // Create device object
    const newDevice = new device({
      token: data.token,
      type: data.type,
      service: data.service,
      name: data.name,
      OS: data.OS,
      state: 'registered'
    });

    // Resolve user only existing users can register in the Schul-Cloud app
    var userId = resolve.Service.verifyUser(data.user);

    // Create User
    const newUser = new user({
      name: userId,
      devices: newDevice
    });

    // Insert data into DB
    return new Promise((resolve, reject) => {

      user.findOne({_id:userId})
        .then( user => {
          user.devices.push(newDevice);
          return user.save();
        })
        .then ( userWithNewDevice => {
          resolve(userWithNewDevice);
        })
        .catch( err => {
          console.log(err);
          return newUser.save();
        })
        .then( userNew => {
          resolve(userNew);
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
  app.use('/devices', new Service());

  // Get our initialize service to that we can bind hooks
  const deviceService = app.service('/devices');

  // Set up our before hooks
  deviceService.before(hooks.before);

  // Set up our after hooks
  deviceService.after(hooks.after);
};

module.exports.Service = Service;
