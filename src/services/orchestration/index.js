'use strict';

const sendInterface = require('../sendInterface');
const User = require('../user/user-model');
const Notification = require('../notification/notification-model');
const Escalation = require('./escalation-model');

const Constants = require('../constants');
const Util = require('../util');

class Orchestration {

  constructor() {
    // timer checks all 10 seconds for remaining escalations to be send
    setInterval(this.reescalate, 10000);
  }

  /**
   * restarts escalation for stored objects.
   * take care to do not run multiple instances by the same time.
   * timer above schedules for 10 seconds only!
   */
  reescalate() {
    console.log("[SCHEDULED ESCALATION] starts...");
    return Escalation
      .find({nextEscalationDue: {$lte: new Date()}})
      .populate('notification')
      .then(escalations => {
        if (escalations.length) {
          console.log(" - escalate", escalations.length, "scheduled notifications...");
          return Promise.all(escalations.map(escalation=> {
            return orchestration.escalate(escalation);
          }));
        } else {
          console.log(" - no escalations scheduled...");
          return Promise.resolve();
        }
      })
      .then(()=> {
        this.reescalation_running = false;
        console.log("[SCHEDULED ESCALATION] end...");
      })
      .catch(err=> {
        this.reescalation_running = false;
        console.log("[SCHEDULED ESCALATION] end after error...", err);
      });
  }

  escalate(escalation) {
    console.log("escalate", escalation._id);
    return User
      .findOne({
        schulcloudId: escalation.notification.user
      })
      .then(user => {
        let news = [];
        let devices = user.devices.filter(function (device) {
          return device.type === escalation.nextEscalationType;
        });
        if (devices && devices.length) {
          console.log(devices.length, "devices found...");
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
    if (escalation.notification.state !== Constants.NOTIFICATION_STATES.ESCALATING) {
      // notification has been clicked... remove escalation
      return escalation.delete();
    }
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

        return escalation.notification.save()
          .then(()=> {
            return escalation.delete();
          });
    }
    escalation.nextEscalationDue = Date.now() + 30000; // add 30 seconds
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

