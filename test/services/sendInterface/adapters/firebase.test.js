'use strict';

const assert = require('assert');
const sinon = require('sinon');
const firebase = require('../../../../src/services/sendInterface/adapters/firebase');

describe('firebase service adapter', function() {

  it('registered the firebase service adapter', () => {
    assert.ok(firebase);
  });

  it('run with mocked error', (done) => {
    // replace the send function of firebase
    let stub = sinon.stub(firebase.firebaseSender, 'sendNoRetry', function(msg, opt, callback) {
      return callback({}, {});
    });

    let notifications = [{
      _id: 'mockNotificationId',
      message: {
        title: 'test',
        body: 'test'
      }
    }];
    let devices = [{
      _id: 'mockDeviceId',
      service: 'firebase',
      token: ''
    }];

    firebase.send(notifications, devices);

    // check and reset the mock
    assert(stub.called);
    firebase.firebaseSender.sendNoRetry.restore();

    // TODO: check result and then call done()
    done();
  });

  it('run with mocked success', (done) => {
    // replace the send function of firebase
    let stub = sinon.stub(firebase.firebaseSender, 'sendNoRetry', function(msg, opt, callback) {
      return callback(false, {
        success: 0,
        failure: 0,
        results: [{
          error: {}
        }]
      });
    });

    let notifications = [{
      _id: 'mockNotificationId',
      message: {
        title: 'test',
        body: 'test'
      }
    }];
    let devices = [{
      _id: 'mockDeviceId',
      service: 'firebase',
      token: ''
    }];

    firebase.send(notifications, devices);

    // check and reset the mock
    assert(stub.called);
    firebase.firebaseSender.sendNoRetry.restore();

    // TODO: check result and then call done()
    done();
  })
});
