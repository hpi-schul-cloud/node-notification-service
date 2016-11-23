'use strict';
const config = require('./config.json').firebase;
const firebase = require('node-gcm');
const errors = require('feathers-errors');
const _ = require('lodash');

class FirebaseAdapter {
  constructor() {
    this.firebaseSender = new firebase.Sender(config.serverToken);
  }

  /**
   * Send a message with the given payload and options via Firebase.
   *
   * @param {{title: string, body: string}} notification
   * @param {Object} data
   * @param {string[]} tokens
   * @param {{timeToLive: number, priority: ('normal'|'high')}} options
   */
  send(notification, data, tokens, options) {
    return new Promise((resolve, reject) => {
      let message = buildMessage(notification, data, options);

      this.firebaseSender.sendNoRetry(message, { registrationTokens: tokens }, (error, response) => {
        if (error) {
          console.log('[INFO] Unable to send message via Firebase.');
          reject(new errors.Unavailable('Unable to send message via Firebase.'))
        } else {
          console.log('[INFO] Response from Firebase', response);
          if (response.failure === tokens.length) {
            reject(new errors.GeneralError('Could not deliver any message.'));
          } else if (response.failes > 0) {
            resolve();
          } else {
            resolve(notification/*{
              messageId: response.results[0].message_id,
              message: message
            }*/);
          }
        }
      });
    });
  }

  buildMessage(notification, data, options) {
    let message = {};

    if (_.isPlainObject(notification)) {
      _.assign(message.notification, notification);
    }

    if (_.isPlainObject(data)) {
      _.assign(message.data, data);
    }

    if (_.isPlainObject(options)) {
      _.assign(message, options);
    }

    return message;
  }
}

module.exports = new FirebaseAdapter();
