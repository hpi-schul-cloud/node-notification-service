'use strict';

const assert = require('assert');
const request = require('request');
const app = require('../../../src/app');

describe('device service', () => {
  it('registered the device service', () => {
    assert.ok(app.service('devices'));
  });

  describe('register', () => {
    it('call empty', () => {
      app.service('devices').create({});
    });


    it('call with data', () => {
      app.service('devices').create({
        "service": "firebase",
        "type": "mobile",
        "name": "test2",
        "user_token": "usertoken1",
        "service_token": "anderestoken",
        "OS": "android7"
      })
        .then(function(res) {
          assert.ok(res);
        });
    });
  });
});
