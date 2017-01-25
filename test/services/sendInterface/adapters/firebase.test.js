'use strict';

const expect = require('chai').expect;
const assert = require('assert');
const sinon = require('sinon');
const firebase = require('../../../../src/services/sendInterface/adapters/firebase');
const constants = require('../../../../src/services/constants');

describe('firebase service adapter', function() {

  it('registered the firebase service adapter', () => {
    assert.ok(firebase);
  });

  it('run with mocked error', (done) => {
    // replace the send function of firebase
    let stub = sinon.stub(firebase.firebaseSender, 'send', function(msg, opt, callback) {
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
      service: constants.SEND_SERVICES.FIREBASE,
      token: ''
    }];

    firebase.send(notifications, devices);

    // check and reset the mock
    assert(stub.called);
    firebase.firebaseSender.send.restore();

    // TODO: check result and then call done()
    done();
  });

  it('run with mocked success', (done) => {
    // replace the send function of firebase
    let stub = sinon.stub(firebase.firebaseSender, 'send', function(msg, opt, callback) {
      return callback(false, {
        success: 0,
        failure: 0,
        results: [{
          error: {}
        }]
      });
    });

    let timeToLive = new Date();
    timeToLive.setMilliseconds(timeToLive.getMilliseconds() + 600000);
    let notifications = [{
      _id: 'mockNotificationId',
      message: {
        title: 'test',
        body: 'test',
        timeToLive: timeToLive,
        data: {
          some: 'data'
        }
      }
    }];
    let devices = [{
      _id: 'mockDeviceId',
      service: constants.SEND_SERVICES.FIREBASE,
      token: ''
    }];

    firebase.send(notifications, devices);

    // check and reset the mock
    assert(stub.called);
    firebase.firebaseSender.send.restore();

    // TODO: check result and then call done()
    done();
  });

  it.skip('send real message', function() {
    let notifications = [
      {
        _id: 'mockNotificationId',
        message: {
          title: 'test',
          body: 'test'
        },
        priority: 'high'
      }
    ];
    let devices = [
      {
        _id: 'mockDeviceId',
        service: constants.SEND_SERVICES.FIREBASE,
        token: 'ezz1Dl1-d6M:APA91bEyUgSReqXCFXlHfaASkT3ZFIp7bBkJ-H8Fxc9zcwdVGOsSTR7Zkq8PegpVQTMrdsn0xA053HN8xzP3Icbple6Oq4NY7G7g2FUnlbZm-6Rvz7hElZK2OpARHoa2Rb6_5KmKGppG'
      }
    ];
    let expected = {
      success: 1,
      failure: 0,
      results: [{
        notificationId: 'mockNotificationId',
        deviceId: 'mockDeviceId'
      }]
    };

    return firebase.send(notifications, devices)
      .then(response => {
        expect(response).to.deep.equal(expected);
      });
  });

});
