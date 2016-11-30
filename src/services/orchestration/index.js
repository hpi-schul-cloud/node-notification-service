'use strict';

const sendInterface = require('../sendInterface');

class Orchestration {

  escalate(notification) {
    // TODO insert escalation magic
  }

  orchestrate(notifications) {

    console.log('[INFO] orchestrating notification');

    notifications.forEach((notification) => {
      notification.changeState('orchestrated');
    });

    return new Promise((resolve, reject) => {
        let devices = [{
          token: 'ladida',
        }];

        // TODO insert orchestration magic
        sendInterface.send(notifications, devices)
          .then( res => {
              console.log('[INFO] notification sent');
              resolve(res);
          })
          .catch( err => {
              console.log('[ERROR] send error');
              reject();
          })
    });

  }

}

module.exports = new Orchestration();

