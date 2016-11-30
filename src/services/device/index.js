'use strict';

const hooks = require('./hooks');
const device = require('../user/index');

class Service {
  constructor(options) {
    this.options = options || {};
  }

  find(params) {
    return Promise.resolve([]);
  }

  get(id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    });
  }


  // Adds a device for a user to the database
  create(user, token, id, service, type, name, OS) {

    // Create device object
    const newDevice = new device({
      token: token,
      type: type,
      service: service,
      name: name,
      OS: OS,
      state: 'registered'
    });

    // Create User
    const newUser = new user({
      name: user,
      devices: newDevice

    });

    // Insert data into DB
    new Promise((resolve, reject) => {
      newUser.save()
        .catch( err => {
          reject(new errors.GeneralError('Internal Error'));
        })
    });
  }

/*
  update(id, data, params) {
    return Promise.resolve(data);
  }

  patch(id, data, params) {
    return Promise.resolve(data);
  }

  remove(id, params) {
    return Promise.resolve({ id });
  }*/
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
