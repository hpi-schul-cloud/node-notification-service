'use strict';

const assert = require('assert');
const request = require('request');
const constants = require('../../../src/services/constants');
const app = require('../../../src/app');
const Serializer = require('jsonapi-serializer').Serializer;
const User = require('../../../src/services/user/user-model');
const util = require('util');

describe('device service', () => {

  it('registered the device service', () => {
    assert.ok(app.service('devices'));
  });

  describe('register', () => {

    const dev = {
      token: 'testToken',
      service: 'firebase',
      state: 'registered'
    };

    const validPayload = Object.assign({}, dev, {
      'service': constants.SEND_SERVICES.FIREBASE,
      'type': constants.DEVICE_TYPES.MOBILE,
      'name': 'test2',
      'token': 'student1_1',
      'device_token': 'testToken',
      'OS': 'android7'
    });

    it('call empty', () => {
      app.service('devices').create({});
    });

    it('call with valid data', () => {
      return app.service('devices').create(validPayload)
        .then(function (result) {
          assert(result.included[0].id);
          assert.equal(result.included[0].type, 'devices');
          //console.log(util.inspect(result, {showHidden: false, depth: null}))
          assert.deepEqual(result.included[0].attributes, dev);
        });
    });

    it('call with valid data and existing user', () => {
      let newUser = new User({
        applicationId: 'useridfürusertoken2',
        devices: []
      });

      return newUser
        .save()
        .then(() => {
          return app.service('devices').create(validPayload);
        })
        .then(function (res) {
          assert.ok(res);
        });
    });

    it('call with unknown token', () => {
      return app.service('devices').create({
        'service': constants.SEND_SERVICES.FIREBASE,
        'type': constants.DEVICE_TYPES.MOBILE,
        'name': 'test2',
        'token': 'ungültig',
        'device_token': 'testToken',
        'OS': 'android7'
      })
        .catch(function (res) {
          assert.equal(res.code, 401);
        });
    });

    it('calls the service two times with the same device token', () => {
      return app.service('devices').create(validPayload)
        .then(() => {
          return app.service('devices').create(validPayload);
        })
        .then((res) => {
          let i = 0;
          res.included.forEach((device) => {
            if (device.attributes.token === validPayload.device_token) i++;
          });
          assert.equal(i, 1);
        });
    });

    it('add two devices', () => {
      return app.service('devices').create(validPayload)
        .then(() => {
          validPayload['device_token'] = 'testToken2';
          return app.service('devices').create(validPayload);
        })
        .then((res) => {
          let i = 0;
          res.included.forEach((device) => {
            if (device.attributes.token === validPayload.device_token) i++;
          });
          assert.equal(i, 1);
        });
    });

  });

  describe('remove', () => {

    it('call empty', () => {
      app.service('devices').remove({});
    });

    it('call with valid token', () => {
      const params = {
        query: {
          'token': 'student1_1'
        }
      };
      app.service('devices').remove({}, params);
    });

    it('call with valid User', () => {
      let newUser = new User({
        applicationId: '874a9be4-ea6a-4364-852d-1a46b0d155f3',
        devices: []
      });

      return newUser
        .save()
        .then(() => {
          const params = {
            query: {
              'token': 'student1_1'
            }
          };
          return app.service('devices').remove({}, params);
        })
        .catch(err => {
          assert.equal(err.code, 403);
        });
    });

    it('call with valid User and device', () => {
      let newUser = new User({
        applicationId: '874a9be4-ea6a-4364-852d-1a46b0d155f3',
        devices: [{
          token: 'testToken2',
          type: 'mobile',
          service: 'firebase',
          name: 'my test device',
          OS: 'Android',
          state: 'registered'
        }, {
          token: 'testToken',
          type: 'mobile',
          service: 'firebase',
          name: 'my test device',
          OS: 'Android',
          state: 'registered'
        }]
      });

      return newUser
        .save()
        .then(() => {
          const device = 'testToken';
          const params = {
            query: {
              'token': 'student1_1'
            }
          };
          return app.service('devices').remove(device, params);
        });
    });


  });

});
