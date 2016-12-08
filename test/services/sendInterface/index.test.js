'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const sendInterface = require('../../../src/services/sendInterface/index');

describe('sendInterface service', function() {
  it('registered the sendInterfaces service', () => {
    assert.ok(sendInterface);
  });

  it('send empty', () => {
    return sendInterface.send([], [])
      .then(function(res) {
        res.should.not.be.ok;
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

  // it('send one', () => {
  //   let notifications = [{
  //     _id: 'mockNotificationId',
  //     message: {
  //       title: 'test',
  //       body: 'test'
  //     }
  //   }];
  //   let devices = [{
  //     _id: 'mockDeviceId',
  //     service: 'firebase',
  //     token: ''
  //   }];
  //   return sendInterface.send(notifications, devices)
  //     .then(function(res) {
  //       res.should.not.be.ok;
  //     })
  //     .catch(function(err) {
  //       let expected = {
  //         success: 0,
  //         failure: 1,
  //         results: [{
  //           deviceId: 'mockDeviceId',
  //           error: 'MissingRegistration',
  //           notificationId: 'mockNotificationId'
  //         }]
  //       };
  //       assert.deepEqual(err, expected);
  //     });
  // });

  // it('send test', (done) => {
  //   let notifications = [{
  //     _id: 'mockNotificationId',
  //     message: {
  //       title: 'test',
  //       body: 'test'
  //     }
  //   }];
  //   let devices = [{
  //     _id: 'mockDeviceId',
  //     service: 'firebase',
  //     token: ''
  //   }];
  //   sendInterface.send(notifications, devices)
  //     .then(function(res) {
  //       let expected = {
  //         success: 1,
  //         failure: 0,
  //         results: [{
  //           notificationId: 'mockNotificationId',
  //           deviceId: 'mockDeviceId'
  //         }]
  //       };
  //       assert.deepEqual(res, expected);
  //       done();
  //     })
  //     .catch(function(err) {
  //       console.log(err);
  //       done();
  //     });
  // });
});
