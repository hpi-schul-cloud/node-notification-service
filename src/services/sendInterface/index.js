'use strict';
const firebase = require('node-gcm');
const firebaseConfig = require('./firebase.json');

class SendInterface {

  constructor() {
    this.firebaseSender = new firebase.Sender(firebaseConfig.serverToken);
  }

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
      let message = new firebase.Message({
        notification: {
          title: notification.title,
          body: notification.text
        }
      });
      let deviceToken = '';
      this.firebaseSender.send(message, deviceToken, (error, response) => {
        if (error) {
          console.log('[INFO] Could not send message via Firebase.');
        } else {
          console.log('[INFO] Response from Firebase', response);
        }
      })
      notification.changeState('sent to web');

      console.log('[INFO] notification was sent to web');

      return Promise.resolve( notification );
  }

}

module.exports = new SendInterface();
