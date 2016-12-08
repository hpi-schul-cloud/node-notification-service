'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const Notification = require('../../../src/services/notification/notification-model');

describe('callback service', function() {
  it('registered the callbacks service', () => {
    assert.ok(app.service('callback'));
  });

  describe('calls', () => {

    it('call empty', () => {
      app.service('callback').create({});
    });

    it('call with invalid token', () => {
      app.service('callback').create({
        notificationId: 'invalid'
      });
    });

    it('call with valid token', () => {
      new Notification({
        message: {},
        user: 1
      })
        .save()
        .then(function(notification) {
          app.service('callback').create({
            notificationId: notification._id
          });
        });
    });
  });
});
