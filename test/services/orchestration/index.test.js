'use strict';

const assert = require('assert');
const sinon = require('sinon');

const app = require('../../../src/app');
const orchestration = require('../../../src/services/orchestration/index');
const sendInterface = require('../../../src/services/sendInterface/index');

const TestUtil = require('../../testUtil');

const Constants = require('../../../src/services/constants');
const User = require('../../../src/services/user/user-model');
const Message = require('../../../src/services/message/message-model');
const Notification = require('../../../src/services/notification/notification-model');
const Escalation = require('../../../src/services/orchestration/escalation-model');


describe('orchestration service', () => {

  it('did not register the orchestration service', () => {
    assert.ok(!app.service('orchestration'));
  });

  it('has access to orchestration', () => {
    assert.ok(orchestration);
  });

  it('orchestrate multiple notifications', ()=> {

    return TestUtil.createNotification('firstUser')
      .then(() => {
        return TestUtil.createNotification('secondUser');
      })
      .then(()=> {
        return Notification.find({});
      })
      .then(notifications => {
        assert.equal(notifications.length, 2);
        return orchestration
          .orchestrate(notifications);
      })
      .then(()=> {
        return Notification.find({});
      })
      .then(notifications=> {
        assert.equal(notifications.length, 2);
        assert.equal(notifications[0].state, Constants.NOTIFICATION_STATES.ESCALATING);
        assert.equal(notifications[1].state, Constants.NOTIFICATION_STATES.ESCALATING);
      }).then(()=> {
        return Escalation
          .find({})
          .populate('notification')
      }).then(escalations => {
        let users = ['firstUser', 'secondUser'];
        for (var user in users) {
          let escalation = escalations.filter(escalation=> {
            return escalation.notification.user === users[user];
          });
          assert(escalation.length, 1, 'user should have one escalation only');
          assert(escalation[0].notification.user === users[user], 'unknown username ' + escalation[0].user);
        }
      });
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

      return TestUtil.createEscalation()
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
      let stub = sinon.stub(orchestration, 'escalate', () => {
        return Promise.reject();
      });

      return TestUtil.createEscalation()
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

    it('test reescalation not escalates a future escalation', () => {
      let stub = sinon.stub(orchestration, 'escalate', () => {
        return Promise.resolve();
      });

      return TestUtil.createEscalation()
        .then(escalation => {
          escalation.nextEscalationDue = Date.now() + 5000;
          return escalation.save();
        })
        .then(() => {
          return orchestration.reescalate();
        })
        .then(() => {
          assert(!stub.called);
          assert.equal(orchestration.reescalationRunning, false);
          orchestration.escalate.restore();
        });
    });
  });


  describe('escalate(): ', () => {

    it('stop clicked notifications.', () => {
      return TestUtil.createEscalation()
        .then(escalation => {
          escalation.notification.changeState(Constants.NOTIFICATION_STATES.CLICKED);
          return orchestration
            .escalate(escalation)
            .then(data => {
              assert.ok(data);

              // check escalation deletion
              return Escalation.findOne(escalation._id).then(result => {
                assert.equal(result, null);
              });
            });
        });
    });

    it('stop invalid escalation.', () => {
      return TestUtil.createEscalation()
        .then(escalation => {
          escalation.notification.user = null;
          escalation.notification.changeState(Constants.NOTIFICATION_STATES.ESCALATING);
          return escalation.save();
        })
        .then(escalation => {
          return orchestration
            .escalate(escalation)
            .then(data => {
              assert.ok(data);

              // check escalation deletion
              return Escalation.findOne(escalation._id).then(result => {
                assert.equal(result, null);
              });
            });
        });
    });

    it('a working mobile notification without devices.', (done) => {
      // replace the send function of firebase
      let stub = sinon.stub(sendInterface, 'send', (news, devices) => {
        assert.equal(devices.length, 1);
        assert.equal(news.length, devices.length);
        assert.equal(devices[0].service, Constants.DEVICE_TYPES.EMAIL);
        return Promise.resolve({
          success: 1,
          failure: 0,
          results: []
        });
      });

      let newUser = new User({
        applicationId: 'userapplicationId',
        devices: []
      });

      newUser
        .save()
        .then(user => {
          let message = Message({});
          let notification = Notification({
            state: Constants.NOTIFICATION_STATES.ESCALATING,
            message: message,
            user: user.applicationId
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
      let stub = sinon.stub(sendInterface, 'send', (news, devices) => {
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
        type: Constants.DEVICE_TYPES.MOBILE,
        service: Constants.SEND_SERVICES.FIREBASE,
        name: 'TEST_name',
        OS: 'android',
        state: Constants.DEVICE_STATES.REGISTERED
      };

      let newUser = new User({
        applicationId: 'userapplicationId',
        devices: [newDevice]
      });

      newUser
        .save()
        .then(user => {
          let message = Message({});
          let notification = Notification({
            state: Constants.NOTIFICATION_STATES.ESCALATING,
            message: message,
            user: user.applicationId
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
      let stub = sinon.stub(sendInterface, 'send', (news, devices) => {
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
        type: Constants.DEVICE_TYPES.MOBILE,
        service: Constants.SEND_SERVICES.FIREBASE,
        name: 'TEST_name',
        OS: 'android',
        state: Constants.DEVICE_STATES.REGISTERED
      };
      let newDeviceDesktop = {
        token: 'TEST_token',
        type: Constants.DEVICE_TYPES.DESKTOP,
        service: Constants.SEND_SERVICES.FIREBASE,
        name: 'TEST_name',
        OS: 'android',
        state: Constants.DEVICE_STATES.REGISTERED
      };

      let newUser = new User({
        applicationId: 'userapplicationId',
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
            user: user.applicationId
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
      let stub = sinon.stub(sendInterface, 'send', (news, devices) => {
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
        type: Constants.DEVICE_TYPES.MOBILE,
        service: Constants.SEND_SERVICES.FIREBASE,
        name: 'TEST_name',
        OS: 'android',
        state: Constants.DEVICE_STATES.REGISTERED
      };
      let newDeviceDesktop = {
        token: 'TEST_token',
        type: Constants.DEVICE_TYPES.DESKTOP,
        service: Constants.SEND_SERVICES.FIREBASE,
        name: 'TEST_name',
        OS: 'android',
        state: Constants.DEVICE_STATES.REGISTERED
      };

      let newUser = new User({
        applicationId: 'userapplicationId',
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
            user: user.applicationId
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

    it('from DESKTOP to MOBILE.', () => {
      return TestUtil.createEscalation()
        .then(escalation => {
          escalation.nextEscalationType = Constants.DEVICE_TYPES.DESKTOP;
          return orchestration.updateEscalation(escalation);
        })
        .then(saved => {
          assert.equal(saved.nextEscalationType, Constants.DEVICE_TYPES.MOBILE);
        });
    });

    it('from MOBILE to EMAIL.', () => {
      return TestUtil.createEscalation()
        .then(escalation => {
          escalation.nextEscalationType = Constants.DEVICE_TYPES.MOBILE;
          return orchestration.updateEscalation(escalation);
        })
        .then(saved => {
          assert.equal(saved.nextEscalationType, Constants.DEVICE_TYPES.EMAIL);
        });
    });

    it('from DESKTOP_MOBILE to EMAIL.', () => {
      return TestUtil.createEscalation()
        .then(escalation => {
          escalation.nextEscalationType = Constants.DEVICE_TYPES.DESKTOP_MOBILE;
          return orchestration.updateEscalation(escalation);
        })
        .then(saved => {
          assert.equal(saved.nextEscalationType, Constants.DEVICE_TYPES.EMAIL);
        });
    });

    it('from DESKTOP_MOBILE to EMAIL with "high".', () => {
      return TestUtil.createEscalation()
        .then(escalation => {
          escalation.nextEscalationType = Constants.DEVICE_TYPES.DESKTOP_MOBILE;
          escalation.notification.message.priority = Constants.MESSAGE_PRIORITIES.HIGH;
          return orchestration.updateEscalation(escalation);
        })
        .then(saved => {
          assert.equal(saved.nextEscalationType, Constants.DEVICE_TYPES.EMAIL);
        });
    });

    it('from EMAIL to removed.', () => {
      return TestUtil.createEscalation()
        .then(escalation => {
          escalation.nextEscalationType = Constants.DEVICE_TYPES.EMAIL;
          return orchestration
            .updateEscalation(escalation)
            .then(success => {
              assert.equal(success, true);

              // check escalation deletion
              return Escalation.findOne(escalation._id).then(result => {
                assert.equal(result, null);
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
