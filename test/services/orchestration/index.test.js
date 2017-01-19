'use strict';

const assert = require('assert');
const sinon = require('sinon');

const app = require('../../../src/app');
const orchestration = require('../../../src/services/orchestration/index');
const sendInterface = require('../../../src/services/sendInterface/index');

const Constants = require('../../../src/services/constants');
const User = require('../../../src/services/user/user-model');
const Message = require('../../../src/services/message/message-model');
const Notification = require('../../../src/services/notification/notification-model');
const Escalation = require('../../../src/services/orchestration/escalation-model');

function createEscalation() {
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


describe('orchestration service', function() {

  beforeEach(function() {
    return User.remove({});
  });

  beforeEach(function() {
    return Escalation.remove({});
  });


  it('did not register the orchestration service', () => {
    assert.ok(!app.service('orchestration'));
  });

  it('has access to orchestration', () => {
    assert.ok(orchestration);
  });

  describe('reescalate(): ', () => {

    it('perform without anything queued.', () => {
      return orchestration
        .reescalate();
    });

    it('perform without already running reescalation.', () => {
      orchestration.reescalationRunning = true;
      return orchestration
        .reescalate()
        .then(() => {
          orchestration.reescalationRunning = false;
        });
    });

    it('test reescalation escalates a due escalation', () => {
      let stub = sinon.stub(orchestration, 'escalate', () => {
        return Promise.resolve();
      });

      return createEscalation()
        .then(() => {
          return orchestration.reescalate();
        })
        .then(() => {
          assert(stub.called);
          assert.equal(orchestration.reescalationRunning, false);
          orchestration.escalate.restore();
        });
    });

    it('test reescalation fails, reset running flag', () => {
      let stub = sinon.stub(orchestration, 'escalate', function() {
        return Promise.reject();
      });

      return createEscalation()
        .then(() => {
          return orchestration.reescalate();
        })
        .then(() => {
          assert(stub.called);
          assert.equal(orchestration.reescalationRunning, false);
          orchestration.escalate.restore();
        })
        .catch(() => {
          assert.ok(false, 'Reescalate should catch errors, we should never be here!');
        });
    });
  });


  describe('escalate(): ', () => {

    it('stop clicked notifications.', (done) => {
      createEscalation()
        .then(escalation => {
          escalation.notification.changeState(Constants.NOTIFICATION_STATES.CLICKED);
          orchestration
            .escalate(escalation)
            .then(data => {
              assert.ok(data);

              // check escalation deletion
              Escalation.findOne(escalation._id).then(result => {
                assert.equal(result, null);
                done();
              });
            });
        });
    });

    it('a working mobile notification without devices.', (done) => {
      // replace the send function of firebase
      let stub = sinon.stub(sendInterface, 'send', function(news, devices) {
        assert.equal(devices.length, 1);
        assert.equal(news.length, devices.length);
        assert.equal(devices[0].service, 'email');
        return Promise.resolve({
          success: 1,
          failure: 0,
          results: []
        });
      });

      let newUser = new User({
        schulcloudId: 'userSchulcloudId',
        devices: []
      });

      newUser
        .save()
        .then(user => {
          let message = Message({});
          let notification = Notification({
            state: Constants.NOTIFICATION_STATES.ESCALATING,
            message: message,
            user: user.schulcloudId
          });
          let escalation = Escalation({
            notification: notification,
            nextEscalationType: Constants.DEVICE_TYPES.DESKTOP
          });
          return escalation.save();
        })
        .then(escalation => {
          return orchestration
            .escalate(escalation)
            .then(data => {
              assert.ok(data);
            });
        })
        .then(() => {
          // cleanup
          assert(stub.called);
          sendInterface.send.restore();
          done();
        });
    });

    it('a working mobile notification.', (done) => {
      // replace the send function of firebase
      let stub = sinon.stub(sendInterface, 'send', function(news, devices) {
        assert.equal(devices.length, 1);
        assert.equal(news.length, devices.length);
        assert.equal(devices[0].type, Constants.DEVICE_TYPES.MOBILE);
        return Promise.resolve({
          success: 1,
          failure: 0,
          results: []
        });
      });


      let newDevice = {
        token: 'TEST_token',
        type: 'mobile',
        service: 'firebase',
        name: 'TEST_name',
        OS: 'android',
        state: 'registered'
      };

      let newUser = new User({
        schulcloudId: 'userSchulcloudId',
        devices: [newDevice]
      });

      newUser
        .save()
        .then(user => {
          let message = Message({});
          let notification = Notification({
            state: Constants.NOTIFICATION_STATES.ESCALATING,
            message: message,
            user: user.schulcloudId
          });
          let escalation = Escalation({
            notification: notification,
            nextEscalationType: Constants.DEVICE_TYPES.DESKTOP
          });
          return escalation.save();
        })
        .then(escalation => {
          return orchestration
            .escalate(escalation)
            .then(data => {
              assert.ok(data);
            });
        })
        .then(() => {
          // cleanup
          assert(stub.called);
          sendInterface.send.restore();
          done();
        });
    });

    it('a working desktop notification.', (done) => {
      // replace the send function of firebase
      let stub = sinon.stub(sendInterface, 'send', function(news, devices) {
        assert.equal(devices.length, 1);
        assert.equal(news.length, devices.length);
        assert.equal(devices[0].type, Constants.DEVICE_TYPES.DESKTOP);
        return Promise.resolve({
          success: 1,
          failure: 0,
          results: []
        });
      });


      let newDeviceMobile = {
        token: 'TEST_token',
        type: 'mobile',
        service: 'firebase',
        name: 'TEST_name',
        OS: 'android',
        state: 'registered'
      };
      let newDeviceDesktop = {
        token: 'TEST_token',
        type: 'desktop',
        service: 'firebase',
        name: 'TEST_name',
        OS: 'android',
        state: 'registered'
      };

      let newUser = new User({
        schulcloudId: 'userSchulcloudId',
        devices: [
          newDeviceMobile,
          newDeviceDesktop
        ]
      });

      newUser
        .save()
        .then(user => {
          let message = Message({});
          let notification = Notification({
            state: Constants.NOTIFICATION_STATES.ESCALATING,
            message: message,
            user: user.schulcloudId
          });
          let escalation = Escalation({
            notification: notification,
            nextEscalationType: Constants.DEVICE_TYPES.DESKTOP
          });
          return escalation.save();
        })
        .then(escalation => {
          return orchestration
            .escalate(escalation)
            .then(data => {
              assert.ok(data);
            });
        })
        .then(() => {
          // cleanup
          assert(stub.called);
          sendInterface.send.restore();
          done();
        });
    });

    it('a working mobile_desktop notification.', (done) => {
      // replace the send function of firebase
      let stub = sinon.stub(sendInterface, 'send', function(news, devices) {
        assert.equal(devices.length, 2);
        assert.equal(news.length, devices.length);
        return Promise.resolve({
          success: 2,
          failure: 0,
          results: []
        });
      });


      let newDeviceMobile = {
        token: 'TEST_token',
        type: 'mobile',
        service: 'firebase',
        name: 'TEST_name',
        OS: 'android',
        state: 'registered'
      };
      let newDeviceDesktop = {
        token: 'TEST_token',
        type: 'desktop',
        service: 'firebase',
        name: 'TEST_name',
        OS: 'android',
        state: 'registered'
      };

      let newUser = new User({
        schulcloudId: 'userSchulcloudId',
        devices: [
          newDeviceMobile,
          newDeviceDesktop
        ]
      });

      newUser
        .save()
        .then(user => {
          let message = Message({});
          let notification = Notification({
            state: Constants.NOTIFICATION_STATES.ESCALATING,
            message: message,
            user: user.schulcloudId
          });
          let escalation = Escalation({
            notification: notification,
            nextEscalationType: Constants.DEVICE_TYPES.DESKTOP_MOBILE
          });
          return escalation.save();
        })
        .then(escalation => {
          return orchestration
            .escalate(escalation)
            .then(data => {
              assert.ok(data);
            });
        })
        .then(() => {
          // cleanup
          assert(stub.called);
          sendInterface.send.restore();
          done();
        });
    });

    // TODO: more tests
  });


  describe('updateEscalation(): ', () => {

    it('from DESKTOP to MOBILE.', function(done) {
      createEscalation()
        .then(escalation => {
          escalation.nextEscalationType = Constants.DEVICE_TYPES.DESKTOP;
          orchestration
            .updateEscalation(escalation)
            .then(function(saved) {
              assert.equal(saved.nextEscalationType, Constants.DEVICE_TYPES.MOBILE);
              // TODO: check updated time
              done();
            });
        });
    });

    it('from MOBILE to EMAIL.', function(done) {
      createEscalation()
        .then(escalation => {
          escalation.nextEscalationType = Constants.DEVICE_TYPES.MOBILE;
          orchestration
            .updateEscalation(escalation)
            .then(function(saved) {
              assert.equal(saved.nextEscalationType, Constants.DEVICE_TYPES.EMAIL);
              // TODO: check updated time
              done();
            });
        });
    });

    it('from DESKTOP_MOBILE to EMAIL.', function(done) {
      createEscalation()
        .then(escalation => {
          escalation.nextEscalationType = Constants.DEVICE_TYPES.DESKTOP_MOBILE;
          orchestration
            .updateEscalation(escalation)
            .then(function(saved) {
              assert.equal(saved.nextEscalationType, Constants.DEVICE_TYPES.EMAIL);
              // TODO: check updated time
              done();
            });
        });
    });

    it('from DESKTOP_MOBILE to EMAIL with "high".', function(done) {
      createEscalation()
        .then(escalation => {
          escalation.nextEscalationType = Constants.DEVICE_TYPES.DESKTOP_MOBILE;
          escalation.notification.message.priority = Constants.MESSAGE_PRIORITIES.HIGH;
          orchestration
            .updateEscalation(escalation)
            .then(function(saved) {
              assert.equal(saved.nextEscalationType, Constants.DEVICE_TYPES.EMAIL);
              // TODO: check updated time
              done();
            });
        });
    });

    it('from EMAIL to removed.', function(done) {
      createEscalation()
        .then(escalation => {
          escalation.nextEscalationType = Constants.DEVICE_TYPES.EMAIL;
          orchestration
            .updateEscalation(escalation)
            .then(function(success) {
              assert.equal(success, true);

              // check escalation deletion
              Escalation.findOne(escalation._id).then(result => {
                assert.equal(result, null);
                done();
              });
            });
        });
    });

  });


  describe('orchestrate(): ', () => {

    it('perform without notifications.', () => {
      let notifications = [];
      return orchestration
        .orchestrate(notifications)
        .then(data => {
          assert.equal(data.length, notifications.length);
        });
    });

    it('perform one "high" notification.', () => {
      let user = 'someId';
      let message = Message({
        priority: Constants.MESSAGE_PRIORITIES.HIGH
      });
      let notification = Notification({
        message: message,
        user: user
      });

      let notifications = [
        notification
      ];
      return orchestration
        .orchestrate(notifications)
        .then(data => {
          assert.equal(data.length, notifications.length);
          assert.equal(data[0].nextEscalationType, Constants.DEVICE_TYPES.DESKTOP_MOBILE);
        });
    });

    it('perform three notification.', () => {
      let user = 'someId';
      let message = Message({});
      let notification = Notification({
        message: message,
        user: user
      });

      let notifications = [
        notification,
        notification,
        notification
      ];
      return orchestration
        .orchestrate(notifications)
        .then(data => {
          assert.equal(data.length, notifications.length);
        });
    });

  });

});
