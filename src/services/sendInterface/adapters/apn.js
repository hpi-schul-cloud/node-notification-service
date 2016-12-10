'use strict';
const config = require('./config.json').apn;
const apn = require('apn');
const errors = require('feathers-errors');

class ApnAdapter {
  constructor() {
    this.apnProvider = new apn.Provider(config);
  }

  send(notifications, devices) {
    return new Promise((resolve) => {
      let message = this._buildMessage(notifications[0]);
      let tokens = devices.reduce((accumulator, device) => {
        return accumulator.concat(device.token);
      }, []);

      this.apnProvider.send(message, tokens).then((apnResponse) => {
        let response = this._buildResponse(notifications, devices, apnResponse);
        resolve(response);
      });
    });
  }

  _buildMessage(notification) {
    var message = new apn.Notification();

    message.alert = '';
    message.payload = '';
  }

  _buildResponse(notifications, devices, apnResponse) {
    let response = {};

    response.success = apnResponse.sent.length;
    response.failure = apnResponse.failed.length;

    let successResults = apn.response.sent.reduce((accumulator, token) => {
      let index = devices.findIndex(device => device.token === token);
      let result = {
        notificationId: notifications[index]._id,
        deviceId: devices[index]._id
      };

      return accumulator.concat(result);
    });

    let failureResults = apnResponse.results.reduce((accumulator, failedResult) => {
      let index = devices.findIndex(device => device.token === failedResult.device);
      let result = {
        notificationId: notifications[index]._id,
        deviceId: devices[index]._id,
      };

      if (failedResult.hasOwnProperty('error')) {
        result.error = failedResult.error;
      } else {
        result.error = failedResult.response.reason;
      }

      return accumulator.concat(result);
    }, []);

    response.results = successResults.concat(failureResults);

    return response;
  }
}

module.exports = new ApnAdapter();
