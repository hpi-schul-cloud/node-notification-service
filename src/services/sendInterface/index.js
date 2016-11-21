'use strict';
const firebase = require('./adapters/firebase.js');

class SendInterface {

  sendToMobile(notification) {

    console.log('[INFO] sending notification to mobile');

    // TODO insert sending magic

    notification.changeState('sent to mobile');

    console.log('[INFO] notification was sent to mobile');

    return Promise.resolve( notification );

  }

  sendToWeb(notification) {

    console.log('[INFO] sending notification to web');

    // TODO insert sending magic
    return new Promise((resolve, reject) => {
      firebase.send(notification, 'mops')
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

}

module.exports = new SendInterface();
