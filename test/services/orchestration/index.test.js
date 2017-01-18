'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const orchestration = require('../../../src/services/orchestration/index');

const Escalation = require('../../../src/services/orchestration/escalation-model');
const Constants = require('../../../src/services/constants');
const Notification = require('../../../src/services/notification/notification-model');
const Message = require('../../../src/services/message/message-model');

function createEscalation() {
  let user = 'someId';
  let message = Message({});
  let notification = Notification({
    message: message,
    user: user
  });
  let escalation = Escalation({
    notification: notification,
    priority: notification.priority,
    nextEscalationType: Constants.DEVICE_TYPES.DESKTOP
  });
  return escalation.save();
}

describe('orchestration service', function() {
  it('did not register the orchestration service', () => {
    assert.ok(!app.service('orchestration'));
  });

  it('has access to orchestration', () => {
    assert.ok(orchestration);
  });

  it('clean escalations', (done) => {
    Escalation
      .remove({})
      .then(() => {
        done();
      });
  });


  describe('reescalate(): ', () => {
    it('perform without anything queued.', (done) => {
      orchestration
        .reescalate()
        .then(done);
    });

    it('perform without already running reescalation.', (done) => {
      orchestration.reescalationRunning = true;
      orchestration
        .reescalate()
        .then(() => {
          orchestration.reescalationRunning = false;
          done();
        });
    });

    // TODO: more tests
  });


  describe('escalate(): ', () => {
    it('perform .', () => {
      // orchestration.escalate(createEscalation());
      // TODO: check rejected because of none existing user
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
          escalation.notification.priority = Constants.MESSAGE_PRIORITIES.HIGH;
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

});
