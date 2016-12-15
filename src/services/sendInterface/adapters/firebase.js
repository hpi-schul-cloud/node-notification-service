'use strict';
const config = require('./config.json').firebase;
const firebase = require('node-gcm');
const errors = require('feathers-errors');

class FirebaseAdapter {
  constructor() {
    this.firebaseSender = new firebase.Sender(config.serverToken);
  }

  send(notifications, devices) {
    return new Promise((resolve) => {
      let message = this._buildMessage(notifications[0]);
      let tokens = devices.reduce((accumulator, device) => {
        return accumulator.concat(device.token);
      }, []);

      this.firebaseSender.sendNoRetry(message, { registrationTokens: tokens }, (error, firebaseResponse) => {
        if (error) {
          let response = this._buildErrorResponse(notifications, devices);
          resolve(response);
        } else {
          let response = this._buildResponse(notifications, devices, firebaseResponse);
          resolve(response);
        }
      });
    });
  }

  _buildMessage(notification) {
    let message = {};

    // TODO: test this flag on iOS
    // https://github.com/firebase/quickstart-js/issues/71#issuecomment-258872970
    // message.content_available = true;

    // TODO: evaluate integration in escalation
    // If the phonegap app is killed we have to place the notification here to trigger it natively
    // Could be used if no received callback was triggered after a few seconds.
    // message.notification = {
    //   title: notification.message.title,
    //     body: notification.message.body
    // };

    message.data = {

      // handle message in the background on Android Phonegap
      // https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/PAYLOAD.md#use-of-content-available-true
      'content-available': '1',

      notificationId: notification._id,

      // we can not call this attribute 'notification' - phonegap will fail
      news: {
        title: notification.message.title,
        body: notification.message.body
      }
    };

    // TODO: message.action = notification.action;
    message.priority = notification.message.priority == 'high' ? 'high' : 'normal';

    // TODO: evaluate usage for escalation to avoid multiple notifications
    // seconds the message is kept on the server if it was not possible to push it immediately
    // message.timeToLive = notification.timeToLive; // TODO: parse correctly

    return new firebase.Message(message);
  }

  _buildResponse(notifications, devices, firebaseResponse) {
    let response = {};

    response.success = firebaseResponse.success;
    response.failure = firebaseResponse.failure;
    response.results = firebaseResponse.results.reduce((accumulator, firebaseResult, index) => {
      let result = {
        notificationId: notifications[index]._id,
        deviceId: devices[index]._id
      };

      if (firebaseResult.hasOwnProperty('error')) {
        // TODO: define own general error messages
        result.error = firebaseResult.error;
      }

      return accumulator.concat(result);
    }, []);

    return response;
  }

  _buildErrorResponse(notifications, devices) {
    let response = {
      success: 0,
      failure: notifications.length,
      results: []
    };

    response.results = devices.reduce((accumulator, device, index) => {
      let result = {
        notificationId: notifications[index]._id,
        deviceId: devices[index]._id,
        error: 'Service unavailable'
      };
      return accumulator.concat(result);
    }, []);
  }
}

module.exports = new FirebaseAdapter();
