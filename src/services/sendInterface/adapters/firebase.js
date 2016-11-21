'use strict';
const config = require('./config.json').firebase;
const firebase = require('node-gcm');
const errors = require('feathers-errors');

class FirebaseAdapter {
  constructor() {
    this.firebaseSender = new firebase.Sender(config.serverToken);
  }

  send(notification, token) {
    let message = new firebase.Message({
      notification: {
        title: notification.title,
        body: notification.text
      }
    });

    return new Promise((resolve, reject) => {
      this.firebaseSender.send(message, token, (error, response) => {
        if (error) {
          console.log('[INFO] Unable to send message via Firebase.');
          reject(new errors.Unavailable('Unable to send message via Firebase.'))
        } else {
          console.log('[INFO] Response from Firebase', response);
          if (response.failure === 1) {
            reject(new errors.GeneralError(response.results[0].error));
          }

          resolve(notification/*{
            messageId: response.results[0].message_id,
            message: message
          }*/);
        }
      });
    });
  }

  sendBulk(notification, tokens) {
    // TODO
  }
}

module.exports = new FirebaseAdapter();
