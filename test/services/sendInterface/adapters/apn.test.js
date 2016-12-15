'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const apn = require('../../../../src/services/sendInterface/adapters/apn');
const apnMock = require('apn/mock');

describe('apn service adapter', function() {

  it('registered the apn service adapter', () => {
    expect(apn).to.be.ok;
  });

  it('runs with mocked success/error', () => {
    let stub = sinon.stub(apn.apnProvider, 'send', (notification, recipients) => {
      return Promise.resolve({
        sent: ['da89754c193fed3f4af59baaf956d82508508ab0dcd490ec2811b929ed8da8f2'],
        failed: [{
          device: '98508ab0dcd490ec2811bbaaf956d8250da89754c193fed3f4af5929ed8da8f2',
          status: '400',
          response: {
            reason: 'BadDeviceToken'
          }
        }]
      });
    });

    let notifications = [{
      _id: 'mockNotificationId',
      message: {
        title: 'test',
        body: 'test'
      }
    },
    {
      _id: 'mockNotificationId2',
      message: {
        title: 'test',
        body: 'test'
      }
    }];
    let devices = [{
      _id: 'mockDeviceId',
      service: 'apn',
      token: '98508ab0dcd490ec2811bbaaf956d8250da89754c193fed3f4af5929ed8da8f2'
    },
    {
      _id: 'mockDeviceId2',
      service: 'apn',
      token: 'da89754c193fed3f4af59baaf956d82508508ab0dcd490ec2811b929ed8da8f2'
    }];
    let expected = {
      success: 1,
      failure: 1,
      results: [{
        notificationId: 'mockNotificationId2',
        deviceId: 'mockDeviceId2'
      },{
        notificationId: 'mockNotificationId',
        deviceId: 'mockDeviceId',
        error: 'BadDeviceToken' }
      ]
    };

    return apn.send(notifications, devices)
      .then((response) => {
        expect(stub.called).to.be.true;
        apn.apnProvider.send.restore();

        expect(response).to.deep.equal(expected);
      });
  });
});
