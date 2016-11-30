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

    message.notification = {
      title: notification.message.title,
      body: notification.message.body
      // TODO: icon
    };
    // TODO: message.action = notification.action;
    message.priority = notification.priority == 'high' ? 'high' : 'normal';
    message.timeToLive = notification.timeToLive; // TODO: parse correctly

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
