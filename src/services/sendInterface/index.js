'use strict';
const _ = require('lodash');
const notificationServices = {
  firebase: require('./adapters/firebase.js')
};

class SendInterface {

  sendToMobile(notification, data, devices, options) {

    console.log('[INFO] sending notification to mobile');

    // TODO insert sending magic

    notification.changeState('sent to mobile');

    console.log('[INFO] notification was sent to mobile');

    return Promise.resolve( notification );

  }

  sendToWeb(notification, data, devices, options) {

    console.log('[INFO] sending notification to web');

    let groupedDevices = _.groupBy(devices, device => device.service);

    // TODO insert sending magic
    return new Promise((resolve, reject) => {
      firebase.send(notification, data, tokens, options)
        .then(result => {
          console.log('[INFO] notification was sent to web');
          notification.changeState('sent to web');
          resolve(result);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  send(notification, data, devices, options) {

    let results = {};

    // group devices by service
    let devicesByService = _.groupBy(devices, device => device.service);

    _.forEach(devicesByService, (service) => {
      if (!_.has(notificationServices, service)) {
        // there is no interface for this service
        // TODO: handle error
        continue;
      }

      notificationServices[service].send(notification, data, devices, options);
    })
  }

}

module.exports = new SendInterface();
