'use strict';

const sendInterface = require('../sendInterface');
const User = require('../user/user-model');
const Escalation = require('./escalation-model');
const winston = require('winston');
const Constants = require('../constants');

class Orchestration {

  constructor() {

    this.logger = new (winston.Logger)({
      transports: [
        //new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: 'log/orchestration.log' })
      ]
    });

    this.reescalate = this.reescalate.bind(this);

    // next escalation wait time in ms
    this.reescalationTime = 30000;

    // next escalation wait time in ms for low priority emails
    this.lowReescalationTime = 360000;

    // timer checks all 5 seconds for remaining escalations to be send
    setInterval(this.reescalate, 5000);

  }


  /**
   * checks if there are escalations not finished and resend notifications to next device level.
   * take care to do not run multiple instances by the same time.
   */
  reescalate() {
    this.logger.info('[SCHEDULED ESCALATION] starts...');
    if (this.reescalationRunning === true) {
      this.logger.info('- await last reescalate finished...');
      this.reescalationRunning = false;
      return Promise.resolve(true);
    }
    this.reescalationRunning = true;
    return Escalation
      .find({nextEscalationDue: {$lte: new Date()}})
      .populate('notification')
      .then(escalations => {
        if (escalations.length) {
          this.logger.info(' - escalate', escalations.length, 'scheduled notifications...');
          return Promise.all(escalations.map(escalation => {
            return this.escalate(escalation);
          }));
        } else {
          this.logger.info(' - no escalations scheduled...');
          return true;
        }
      })
      .then(() => {
        this.reescalationRunning = false;
        this.logger.info('[SCHEDULED ESCALATION] end...');
      })
      .catch(err => {
        this.reescalationRunning = false;
        this.logger.info('[SCHEDULED ESCALATION] end after error...', err);
      });
  }

  escalate(escalation) {
    this.logger.info('[INFO] escalating ', escalation._id);

    // notification has been received and clicked... leave escalation
    if (escalation.notification.state !== Constants.NOTIFICATION_STATES.ESCALATING) {
      this.logger.info('[INFO] cancel escalation due state change...', escalation._id);
      return escalation.remove();
    }

    return User
      .findOne({
        applicationId: escalation.notification.user
      })
      .then(user => {
        let devices = [];

        // finds first escalation type where the user already has devices registered
        // if there are no devices registered, escalation will be removed
        while (devices.length === 0) {

          // find devices that match the current escalation type
          if (escalation.nextEscalationType === Constants.DEVICE_TYPES.EMAIL) {
            devices = [{
              service: Constants.DEVICE_TYPES.EMAIL,
              token: escalation.notification.user
            }];
          } else {
            devices = user.devices.filter(device => {
              if (escalation.nextEscalationType === Constants.DEVICE_TYPES.DESKTOP_MOBILE) {
                return device.type === Constants.DEVICE_TYPES.DESKTOP || device.type === Constants.DEVICE_TYPES.MOBILE;
              } else {
                return device.type === escalation.nextEscalationType;
              }
            });

            // go to next escalation step immediately
            if (devices.length === 0) {
              switch (escalation.nextEscalationType) {
                case Constants.DEVICE_TYPES.DESKTOP:
                  escalation.nextEscalationType = Constants.DEVICE_TYPES.MOBILE;
                  break;
                case Constants.DEVICE_TYPES.MOBILE:
                case Constants.DEVICE_TYPES.DESKTOP_MOBILE:
                  escalation.nextEscalationType = Constants.DEVICE_TYPES.EMAIL;
                  break;
              }
            }
          }
        }

        // devices(or email) have been found... send
        this.logger.info(devices.length, 'devices found...');

        // prepare notifications by multiplication for devices
        let news = [];
        for (let i = 0; i < devices.length; i++) {
          news.push(escalation.notification);
        }

        return sendInterface.send(news, devices)
          .then(() => {
            console.log('[INFO] notifications sent to', devices.length, 'devices');
            return this.updateEscalation(escalation);
          });

      })
      .catch(err => {
        this.logger.error('[INFO] Failed to escalate, remove ' + escalation._id, err);
        return escalation.remove();
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
        escalation.nextEscalationDue = Date.now() + this.reescalationTime;
        break;
      case Constants.DEVICE_TYPES.DESKTOP_MOBILE:
      case Constants.DEVICE_TYPES.MOBILE:
        escalation.nextEscalationType = Constants.DEVICE_TYPES.EMAIL;
        if (escalation.notification.message.priority === Constants.MESSAGE_PRIORITIES.HIGH) {
          escalation.nextEscalationDue = Date.now() + this.reescalationTime;
        } else {
          escalation.nextEscalationDue = Date.now() + this.lowReescalationTime;
        }
        break;
      default: // Constants.DEVICE_TYPES.EMAIL
        escalation.notification.state = Constants.NOTIFICATION_STATES.ESCAlATED;
        return escalation.notification
          .save()
          .then(() => {
            return escalation.remove();
          })
          .then(() => {
            return true;
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
    this.logger.info('[INFO] orchestrating notification');
    return Promise
      .all(notifications.map(notification => {
        notification.changeState(Constants.NOTIFICATION_STATES.ESCALATING);
        return notification.save();
      }))
      .then(() => {
        return Promise.all(notifications.map(notification => {
          // on high priority send notification to all devices,
          // otherwise to desktop first.
          let firstEscalationType =
            notification.message.priority === Constants.MESSAGE_PRIORITIES.HIGH
              ? Constants.DEVICE_TYPES.DESKTOP_MOBILE
              : Constants.DEVICE_TYPES.DESKTOP;

          let escalation = Escalation({
            notification: notification,
            nextEscalationType: firstEscalationType
          });

          return escalation.save();
        }));
      });
  }

}

module.exports = new Orchestration();

