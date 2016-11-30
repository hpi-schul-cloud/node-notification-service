'use strict';
const config = require('./config.json').firebase;
const firebase = require('node-gcm');
const errors = require('feathers-errors');
const _ = require('lodash');

class FirebaseAdapter {
  constructor() {
    this.firebaseSender = new firebase.Sender(config.serverToken);
  }

  send(notifications, devices) {
    return new Promise((resolve, reject) => {
      let message = buildMessage(notifications[0]);
      let tokens = devices.reduce((accumulator, device) => {
        return accumulator.push(device.token);
      }, [])

      this.firebaseSender.sendNoRetry(message, { registrationTokens: tokens }, (error, response) => {
        if (error) {
          console.log('[INFO] Unable to send message via Firebase.');
          reject(new errors.Unavailable('Unable to send message via Firebase.'))
        } else {
          console.log('[INFO] Response from Firebase', response);
          if (response.failure == 0) {
            reject(new errors.GeneralError('Could not deliver some messages.'));
          } else {
            resolve(notification);
          }
        }
      });
    });
  }

  buildMessage(notification) {
    let message = {};

    message.notification = {
      title: notification.title,
      body: notification.body
      // TODO: icon
    };
    // TODO: message.action = notification.action;
    message.priority = notification.priority == 'high' ? 'high' : 'normal';
    message.timeToLive = notification.timeToLive; // TODO: parse correctly

    return message;
  }
}

module.exports = new FirebaseAdapter();
