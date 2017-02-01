'use strict';

const assert = require('assert');
const sinon = require('sinon');
const sendInterface = require('../../../src/services/sendInterface/index');
const firebase = require('../../../src/services/sendInterface/adapters/firebase');
const constants = require('../../../src/services/constants');

describe('sendInterface service', function() {

  it('registered the sendInterfaces service', () => {
    assert.ok(sendInterface);
  });

  it('send empty', () => {
    return sendInterface.send([], [])
      .then(function() {
        assert(false);
      })
      .catch(function(err) {
        let expected = {
          success: 0,
          failure: 0,
          results: []
        };
        assert.deepEqual(err, expected);
      });
  });

  it('send one', () => {
    // replace the send function of firebase
    let stub = sinon.stub(firebase, 'send', function() {
      return {
        success: 1,
        failure: 0,
        results: []
      }
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
      service: constants.SEND_SERVICES.FIREBASE,
      token: ''
    }];
    return sendInterface.send(notifications, devices)
      .then(function(res) {
        assert(stub.called);
        firebase.send.restore();
        let expected = {
          success: 1,
          failure: 0,
          results: []
        };
        assert.deepEqual(res, expected);
      });
  });

});
