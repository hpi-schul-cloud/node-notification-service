'use strict';

const assert = require('assert');
const email = require('../../../../src/services/sendInterface/adapters/email');
const constants = require('../../../../src/services/constants');

describe('email service adapter', function() {

  it('registered the email service adapter', () => {
    assert.ok(email);
  });

  it.skip('returns mocked response', () => {

    let notifications = [{
      _id: 'mockNotificationId',
      message: {
        title: 'test',
        body: 'test'
      }
    }];
    let devices = [{
      _id: 'mockDeviceId',
      service: constants.DEVICE_TYPES.EMAIL,
      token: ''
    }];
    let expectedResponse = {
      success: 1,
      failure: 0,
      results: [{
        notificationId: 'mockNotificationId',
        deviceId: 'mockDeviceId'
      }]
    }

    return email.send(notifications, devices)
      .then((response) => {
        assert.deepEqual(response, expectedResponse);
      });
  });
});
