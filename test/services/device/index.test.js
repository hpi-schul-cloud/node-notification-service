'use strict';

const assert = require('assert');
const request = require('request');
const constants = require('../../../src/services/constants');
const app = require('../../../src/app');

describe('device service', () => {
  it('registered the device service', () => {
    assert.ok(app.service('devices'));
  });

  describe('register', () => {
    it('call empty', () => {
      app.service('devices').create({});
    });

    const validPayload = {
      'service': constants.SEND_SERVICES.FIREBASE,
      'type': constants.DEVICE_TYPES.MOBILE,
      'name': 'test2',
      'user_token': 'usertoken2',
      'service_token': 'testToken',
      'OS': 'android7'
    }

    it('call with valid data', () => {
      return app.service('devices').create(validPayload)
        .then(function(res) {
          assert.ok(res);
        });
    });

    it('call with unknown token', () => {
      return app.service('devices').create({
        'service': constants.SEND_SERVICES.FIREBASE,
        'type': constants.DEVICE_TYPES.MOBILE,
        'name': 'test2',
        'user_token': 'ungültig',
        'service_token': 'testToken',
        'OS': 'android7'
      })
      .catch(function(res) {
        res.code.should.equal(403);
      });
    });

    it('calls the service two times with the same device token', () => {
      return app.service('devices').create(validPayload)
        .then((res) => {
          return app.service('devices').create(validPayload);
        })
        .then((res) => {
          var i = 0;
          res.devices.forEach((device) => {
            if (device.token === validPayload.service_token) i++;
          })
          i.should.equal(1);
        });
    });


  });
});
