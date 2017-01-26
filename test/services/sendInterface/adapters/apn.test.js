'use strict';

const assert = require('assert');
const sinon = require('sinon');
const constants = require('../../../../src/services/constants');
const apn = require('../../../../src/services/sendInterface/adapters/apn');
const apnMock = require('apn/mock');

describe('apn service adapter', function() {

  it('registered the apn service adapter', () => {
    assert(apn);
  });

  it('runs with mocked success/error', () => {
    // We use the apnMock to generate all Provider functions
    apn.apnProvider = apnMock.Provider();
    // Since we want to define the response we "mock" the send function again
    let stub = sinon.stub(apn.apnProvider, 'send', (notification, recipients) => {
      return Promise.resolve({
        sent: [{
          device: 'da89754c193fed3f4af59baaf956d82508508ab0dcd490ec2811b929ed8da8f2'
        }],
        failed: [
          {
            device: '98508ab0dcd490ec2811bbaaf956d8250da89754c193fed3f4af5929ed8da8f2',
            status: '400',
            response: {
              reason: 'BadDeviceToken'
            }
          }, {
            device: '18508ab0dcd40da89754c193fed3f4af5929ed8da8f290ec2811bbaaf956d825',
            status: '500',
            error: 'Some error message from Apple'
          }
        ]
      });
    });

    let timeToLive = new Date();
    timeToLive.setMilliseconds(timeToLive.getMilliseconds() + 600000);
    let notifications = [
      {
        _id: 'mockNotificationId',
        message: {
          title: 'test',
          body: 'test',
          timeToLive: timeToLive,
          data: {
            some: 'data'
          }
        },
        priority: constants.MESSAGE_PRIORITIES.HIGH
      },
      {
        _id: 'mockNotificationId2',
        message: {
          title: 'test',
          body: 'test'
        },
        priority: constants.MESSAGE_PRIORITIES.HIGH
      },
      {
        _id: 'mockNotificationId3',
        message: {
          title: 'test',
          body: 'test'
        },
        priority: constants.MESSAGE_PRIORITIES.HIGH
      }
    ];
    let devices = [
      {
        _id: 'mockDeviceId',
        service: constants.SEND_SERVICES.APN,
        token: '98508ab0dcd490ec2811bbaaf956d8250da89754c193fed3f4af5929ed8da8f2'
      },
      {
        _id: 'mockDeviceId2',
        service: constants.SEND_SERVICES.APN,
        token: 'da89754c193fed3f4af59baaf956d82508508ab0dcd490ec2811b929ed8da8f2'
      },
      {
        _id: 'mockDeviceId3',
        service: constants.SEND_SERVICES.APN,
        token: '18508ab0dcd40da89754c193fed3f4af5929ed8da8f290ec2811bbaaf956d825'
      }
    ];
    let expected = {
      success: 1,
      failure: 2,
      results: [
        {
          notificationId: 'mockNotificationId2',
          deviceId: 'mockDeviceId2'
        }, {
          notificationId: 'mockNotificationId',
          deviceId: 'mockDeviceId',
          error: 'BadDeviceToken'
        }, {
          notificationId: 'mockNotificationId3',
          deviceId: 'mockDeviceId3',
          error: 'Some error message from Apple'
        }
      ]
    };

    return apn.send(notifications, devices)
      .then((response) => {
        assert(stub.called);
        apn.apnProvider.send.restore();

        assert.deepEqual(response, expected);
      });
  });

  it.skip('send real message', function() {
    let notifications = [
      {
        _id: 'mockNotificationId',
        message: {
          title: 'test',
          body: 'test'
        },
        priority: constants.MESSAGE_PRIORITIES.HIGH
      }
    ];
    let devices = [
      {
        _id: 'mockDeviceId',
        service: constants.SEND_SERVICES.APN,
        token: '2FEA7FF49957A07378639C51E9345C9A3055488316A4638D31C8E06D8CF7CC43'
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

    return apn.send(notifications, devices)
      .then(response => {
        assert.deepEqual(response, expected);
      });
  });
});
