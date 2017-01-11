'use strict';

const sendInterface = require('../sendInterface');
const User = require('../user/user-model');
const Escalation = require('./escalation-model');

const Constants = require('../constants');

class Orchestration {

  constructor() {

    // next escalation wait time in ms
    this.reescalation_time = 30000;

    // next escalation wait time in ms for low priority emails
    this.low_reescalation_time = 360000;

    // timer checks all 10 seconds for remaining escalations to be send
    setInterval(this.reescalate, 10000);

  }


  /**
   * checks if there are escalations not finished and resend notifications to next device level.
   * take care to do not run multiple instances by the same time.
   */
  reescalate() {
    console.log("[SCHEDULED ESCALATION] starts...");
    if (this.reescalation_running == true) {
      console.log("- await last reescalate finished...")
      return Promise.resolve();
    }
    this.reescalation_running = true;
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
    console.log("[INFO] escalating ", escalation._id);

    // notification has been received and clicked... leave escalation
    if (escalation.notification.state !== Constants.NOTIFICATION_STATES.ESCALATING) {
      console.log("[INFO] cancel escalation due state change...", escalation.id);
      return escalation.remove();
    }

    return User
      .findOne({
        schulcloudId: escalation.notification.user
      })
      .then(user => {

        if (user == null) { // TODO this should not happen...
          return Promise.reject("[ERROR] could not resolve user using scope " +  escalation.notification.user + " in escalation " + escalation.id);
        }

        let news = [];
        let devices = [];

        // finds first escalation type where the user already has devices registered
        // if there are no devices registered, escalation will be removed
        while (devices.length == 0 && escalation.notification.state === Constants.NOTIFICATION_STATES.ESCALATING) {
          devices = user.devices.filter(function (device) {
            if (escalation.nextEscalationType === Constants.DEVICE_TYPES.DESKTOP_MOBILE)
              return device.type === Constants.DEVICE_TYPES.DESKTOP || device.type === Constants.DEVICE_TYPES.MOBILE;
            return device.type === escalation.nextEscalationType;
          });
          if (devices.length == 0) {
            switch (escalation.nextEscalationType) {
              case Constants.DEVICE_TYPES.DESKTOP:
                escalation.nextEscalationType = Constants.DEVICE_TYPES.MOBILE;
                break;
              case Constants.DEVICE_TYPES.MOBILE:
              case Constants.DEVICE_TYPES.DESKTOP_MOBILE:
                escalation.nextEscalationType = Constants.DEVICE_TYPES.EMAIL;
                devices = [{
                  service: Constants.DEVICE_TYPES.EMAIL,
                  token: escalation.notification.user
                }];
                break;
              default:
                escalation.notification.changeState(Constants.NOTIFICATION_STATES.NOT_ESCALATED);
                return escalation.notification.save()
                  .then(()=> {
                    console.log("[INFO] no devices found for escalation", escalation.id)
                    return escalation.remove();
                  });
            }
          }
        }

        // devices have been found... send
        if (devices.length != 0) {
          console.log(devices.length, "devices found...");
          // prepare notifications by multiplication for devices
          for (var i = 0; i < devices.length; i++) {
            news.push(escalation.notification);
          }
          sendInterface.send(news, devices)
            .then(res => {
              console.log('[INFO] notifications sent to', devices.length, "devices");
              return this.updateEscalation(escalation);
            })
            .catch(err => {
              console.log('[ERROR] send error', err);
            })
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  /**
   * updates escalation to next escalation step and raises due time.
   * if already in state email, the escalation will be removed.
   * @param escalation
   * @returns {*}
   */
  updateEscalation(escalation) {
    switch (escalation.nextEscalationType) {
      case Constants.DEVICE_TYPES.DESKTOP:
        escalation.nextEscalationType = Constants.DEVICE_TYPES.MOBILE;
        escalation.nextEscalationDue = Date.now() + orchestration.reescalation_time;
        break;
      case Constants.DEVICE_TYPES.DESKTOP_MOBILE:
      case Constants.DEVICE_TYPES.MOBILE:
        escalation.nextEscalationType = Constants.DEVICE_TYPES.EMAIL;
        if (escalation.priority === Constants.MESSAGE_PRIORITIES.HIGH) {
          escalation.nextEscalationDue = Date.now() + orchestration.reescalation_time;
        } else {
          escalation.nextEscalationDue = Date.now() + orchestration.low_reescalation_time;
        }
        break;
      default: // Constants.DEVICE_TYPES.EMAIL
        escalation.notification.state = Constants.NOTIFICATION_STATES.ESCAlATED;
        return escalation.notification.save()
          .then(()=> {
            return escalation.remove();
          });
    }
    return escalation.save();
  }

  /**
   * starts first escalation of new notifications.
   * for notifications with high priority all devices will be notified immediately,
   * otherwise the escalation will start with desktop devices only.
   * @param notifications
   * @returns {Promise.<TResult>|Promise}
   */
  orchestrate(notifications) {
    console.log('[INFO] orchestrating notification');
    return Promise.all(notifications.map(notification=> {
      notification.changeState(Constants.NOTIFICATION_STATES.ESCALATING);
      return notification.save();
    }))
      .then(succ=> {
        return Promise.all(notifications.map(notification=> {
          // on high priority send notification to all devices,
          // otherwise to desktop first.
          let firstEscalationType =
            notification.priority === Constants.MESSAGE_PRIORITIES.HIGH
              ? Constants.DEVICE_TYPES.DESKTOP_MOBILE
              : Constants.DEVICE_TYPES.DESKTOP;
          let escalation = Escalation({
            notification: notification,
            priority: notification.priority,
            nextEscalationType: firstEscalationType,
            nextEscalationDue: Date.now
          });
          return this.escalate(escalation);
        }))
      })
      .catch(err=> {
        console.log("[ERROR] in orchestrate", err);
      });
  }

}

let orchestration = new Orchestration();
module.exports = orchestration;

