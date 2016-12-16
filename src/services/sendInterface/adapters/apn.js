'use strict';
const config = require('./config.json').apn;
const apn = require('apn');
const errors = require('feathers-errors');

class ApnAdapter {
  send(notifications, devices) {
    // We use a singleton here to setup apn the first time it is used
    if (!this.apnProvider) {
      this.apnProvider = new apn.Provider(config);
    }
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
    let message = new apn.Notification();

    message.topic = 'org.schulcloud';
    message.title = notification.message.title;
    message.body = notification.message.body;
    message.expiry = notification.timeToLive; // TODO: should be UNIX timestamp
    message.priority = notification.priority === 'high' ? 10 : 5;
    message.contentAvailable = true;

    if (message.priority === 10) {
      // we must trigger this for messages with high priority
      message.alert = notification.message.title;
    }

    return message;
  }

  _buildResponse(notifications, devices, apnResponse) {
    let response = {};

    response.success = apnResponse.sent.length;
    response.failure = apnResponse.failed.length;

    let successResults = [];
    if (response.success > 0) {
      successResults = apnResponse.sent.reduce((accumulator, token) => {
        let index = devices.findIndex(device => device.token === token);
        let result = {
          notificationId: notifications[index]._id,
          deviceId: devices[index]._id
        };

        return accumulator.concat(result);
      }, []);
    }

    let failureResults = [];
    if (response.failure > 0 ) {
      failureResults = apnResponse.failed.reduce((accumulator, failedResult) => {
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
    }

    response.results = successResults.concat(failureResults);

    return response;
  }
}

module.exports = new ApnAdapter();
