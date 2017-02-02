'use strict';

// This is not a test
const Message = require('../src/services/message/message-model');
const Notification = require('../src/services/notification/notification-model');
const Escalation = require('../src/services/orchestration/escalation-model');
const Constants = require('../src/services/constants');

class Util {

  static createNotification(username) {
    let message = Message({});
    let notification = Notification({
      message: message,
      user: username
    });
    return notification.save();
  }

  static createEscalation() {
    let user = 'someId';
    let message = Message({});
    let notification = Notification({
      message: message,
      user: user
    });
    let escalation = Escalation({
      notification: notification,
      nextEscalationType: Constants.DEVICE_TYPES.DESKTOP
    });
    return notification.save().then(escalation.save);
  }

}

module.exports = Util;
