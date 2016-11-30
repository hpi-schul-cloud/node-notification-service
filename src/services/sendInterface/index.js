'use strict';
const _ = require('lodash');
const notificationServices = {
  firebase: require('./adapters/firebase')
};

class SendInterface {

  /**
   * This method sends the given notifications to all devices via the appropriate service.
   * If multiple notifications are given, only the message of the first is respected.
   * The returned promise resolves, if at least one notification was sent.
   * The returned promise rejects, if all notifications fail.
   */
  send(notifications, devices) {

    let results = {};

    // group devices by service
    let devicesByService = _.groupBy(devices, device => device.service);

    _.forEach(devicesByService, (service) => {
      if (!_.has(notificationServices, service)) {
        // there is no interface for this service
        // TODO: handle error
        continue;
      }

      notificationServices[service].send(notifications, devices);
    })
  }

}

module.exports = new SendInterface();
