'use strict';

const sendInterface = require('../sendInterface');

class Orchestration {

  escalate(notification) {
    // TODO insert escalation magic
  }

  orchestrate(notification) {

    console.log('[INFO] orchestrating notification');

    notification.changeState('orchestrated');

    return new Promise((resolve, reject) => {

        // TODO insert orchestration magic
        sendInterface.sendToWeb(notification)
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

