'use strict';

const assert = require('assert');
const request = require('request');
const app = require('../../../src/app');

const User = require('../../../src/services/user/user-model');

describe('device service', () => {

  it('registered the device service', () => {
    assert.ok(app.service('devices'));
  });

  describe('register', () => {

    const validPayload = {
      'service': 'firebase',
      'type': 'mobile',
      'name': 'test2',
      'user_token': 'usertoken2',
      'service_token': 'testToken',
      'OS': 'android7'
    };

    it('call empty', () => {
      app.service('devices').create({});
    });

    it('call with valid data', () => {
      return app.service('devices').create(validPayload)
        .then(function(res) {
          assert.ok(res);
        });
    });

    it('call with valid data and existing user', () => {
      let newUser = new User({
        schulcloudId: 'useridfürusertoken2',
        devices: []
      });

      return newUser
        .save()
        .then(() => {
          return app.service('devices').create(validPayload);
        })
        .then(function(res) {
          assert.ok(res);
        });
    });

    it('call with unknown token', () => {
      return app.service('devices').create({
        'service': 'firebase',
        'type': 'mobile',
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
        .then(() => {
          return app.service('devices').create(validPayload);
        })
        .then((res) => {
          let i = 0;
          res.devices.forEach((device) => {
            if (device.token === validPayload.service_token) i++;
          });
          i.should.equal(1);
        });
    });

    it('add two devices', () => {
      return app.service('devices').create(validPayload)
        .then(() => {
          validPayload['service_token'] = 'testToken2';
          return app.service('devices').create(validPayload);
        })
        .then((res) => {
          let i = 0;
          res.devices.forEach((device) => {
            if (device.token === validPayload.service_token) i++;
          });
          i.should.equal(1);
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
          'user_token': 'usertoken2'
        }
      };
      app.service('devices').remove({}, params);
    });

    it('call with valid user', () => {
      let newUser = new User({
        schulcloudId: 'useridfürusertoken2',
        devices: []
      });

      return newUser
        .save()
        .then(() => {
          const params = {
            query: {
              'user_token': 'usertoken2'
            }
          };
          return app.service('devices').remove({}, params);
        });
    });

    it('call with valid user and device', () => {
      let newUser = new User({
        schulcloudId: 'useridfürusertoken2',
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
              'user_token': 'usertoken2'
            }
          };
          return app.service('devices').remove(device, params);
        });
    });


  });

});
