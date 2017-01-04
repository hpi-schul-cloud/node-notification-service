'use strict';

const sendInterface = require('../sendInterface');
const User = require('../user/user-model');
const Notification = require('../notification/notification-model');
const Escalation = require('./escalation-model');

const Constants = require('../constants');
const Util = require('../util');

class Orchestration {

  constructor() {
    setInterval(this.reescalate, 10000);
  }

  reescalate() {
    console.log("[SCHEDULED ESCALATION]");

    let escalations = Escalation
      .find({nextEscalationDue: {$lte: new Date()}})
      .populate('notification')
      .then(escalations => {
        if (escalations.length) {
          console.log(" - escalate", escalations.length, "scheduled notifications...");
          escalations.forEach((escalation)=> {
            orchestration.escalate(escalation);
          });
        } else {
          console.log(" - no escalations scheduled...");
        }
      });
  }

  escalate(escalation) {
    debugger;
    return User
      .findOne({
        schulcloudId: escalation.notification.user
      })
      .then(user => {
        //if (!user) reject("user not found");
        let news = [];
        let devices = user.devices.filter(function (device) {
          return device.type === escalation.nextEscalationType;
        });
        if (devices && devices.length) {
          console.log(devices.length, "devices found...");
          debugger;
          for (var i = 0; i < devices.length; i++) {
            news.push(escalation.notification);
          }
          sendInterface.send(news, devices)
            .then(res => {
              console.log('[INFO] notification sent');
              return this.updateEscalation(escalation);
            })
            .catch(err => {
              console.log('[ERROR] send error');
            })
        } else {
          console.log('no devices found...');
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  updateEscalation(escalation) {
    switch (escalation.nextEscalationType) {
      case Constants.DEVICE_TYPES.DESKTOP:
        escalation.nextEscalationType = Constants.DEVICE_TYPES.MOBILE;
        break;
      case Constants.DEVICE_TYPES.MOBILE:
        escalation.nextEscalationType = Constants.DEVICE_TYPES.EMAIL;
        break;
      case Constants.DEVICE_TYPES.EMAIL:
      default:
        escalation.notification.state = Constants.NOTIFICATION_STATES.ESCAlATED;

        return escalation.notification.save() // async
          .then(()=> {
            return escalation.delete();
          });
    }
    escalation.nextEscalationDue = Date.now() + 5000; // add 10 seconds
    return escalation.save();

  }

  orchestrate(notifications) {

    console.log('[INFO] orchestrating notification');
    notifications.forEach((notification) => {
      notification.changeState(Constants.NOTIFICATION_STATES.ESCALATING);
      notification.save();
    });

    let notification = notifications[0];

    //return new Promise((resolve, reject) => {

    let escalation = Escalation({
      notification: notification,
      priority: notification.priority,
      nextEscalationType: Constants.DEVICE_TYPES.DESKTOP,
      nextEscalationDue: Date.now
    });
    // escalate
    return this.escalate(escalation);

    //});

  }

}

let orchestration = new Orchestration();
module.exports = orchestration;

