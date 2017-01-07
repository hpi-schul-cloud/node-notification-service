'use strict';

const sendInterface = require('../sendInterface');
const User = require('../user/user-model');

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
      return User
        .findOne({
          schulcloudId: notifications[0].user
        })
        .then(user => {
          // send to all of users devices
          let news = [];
          for (var i = 0; i < user.devices.length; i++) {
            news.push(notifications[0]);
          }
          sendInterface.send(news, user.devices)
            .then(res => {
              console.log('[INFO] notification sent');
              resolve(res);
            })
            .catch(err => {
              console.log('[ERROR] send error');
              reject();
            })
        });
    });

  }

}

module.exports = new Orchestration();
