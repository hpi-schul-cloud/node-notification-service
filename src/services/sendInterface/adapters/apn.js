'use strict';
const config = require('../../../../secure/config.json').sendServices.apn;
const constants = require('../../constants');
const apn = require('apn');
const errors = require('feathers-errors');

const APN_PRIORITIES = {
  HIGH: 10,
  MEDIUM: 5
};

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

    message.topic = config.pushId;
    message.urlArgs = ['index.php']; // TODO: set this to something meaningful
    message.title = notification.message.title;
    message.body = notification.message.body;
    message.payload.senderData = notification.message.data;
    message.priority = notification.message.priority === constants.MESSAGE_PRIORITIES.HIGH ? APN_PRIORITIES.HIGH : APN_PRIORITIES.MEDIUM;
    // UNIX epoch time in seconds
    if (notification.message.timeToLive) {
      message.expiry = Math.floor(notification.message.timeToLive.getTime() / 1000);
    }
    // Can be used to send silent notifications
    // message.contentAvailable = 1;

    return message;
  }

  _buildResponse(notifications, devices, apnResponse) {
    let response = {};
    response.success = apnResponse.sent.length;
    response.failure = apnResponse.failed.length;

    let successResults = [];
    if (response.success > 0) {
      successResults = apnResponse.sent.reduce((accumulator, token) => {
        let result = {};

        let index = devices.findIndex(device => device.token === token.device);
        if (index !== -1) {
          result = {
            notificationId: notifications[index]._id,
            deviceId: devices[index]._id
          };
        }

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
