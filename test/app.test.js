'use strict';

const assert = require('assert');
const request = require('request');
const app = require('../src/app');

const port = app.get('port');
const host = app.get('protocol') + '://' + app.get('host') + ':' + port;

const User = require('../src/services/user/user-model');
const Message = require('../src/services/message/message-model');
const Notification = require('../src/services/notification/notification-model');
const Escalation = require('../src/services/orchestration/escalation-model');

// clear the database before every test to ensure they do not depend on each other
beforeEach(() => {
  const promises = [
    Escalation.remove({}),
    Notification.remove({}),
    Message.remove({}),
    User.remove({}),
  ];
  return Promise.all(promises);
});

describe('Feathers application tests', function() {
  before(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  after(function(done) {
    this.server.close(done);
  });

  it('starts and shows the index page', function(done) {
    request(host, function(err, res, body) {
      assert.ok(body.indexOf('<html>') !== -1);
      done(err);
    });
  });

  describe('404', function() {
    it('shows a 404 HTML page', function(done) {
      request({
        url: host + '/path/to/nowhere',
        headers: {
          'Accept': 'text/html'
        }
      }, function(err, res, body) {
        assert.equal(res.statusCode, 404);
        assert.ok(body.indexOf('<html>') !== -1);
        done(err);
      });
    });

    it('shows a 404 JSON error without stack trace', function(done) {
      request({
        url: host + '/path/to/nowhere',
        json: true
      }, function(err, res, body) {
        assert.equal(res.statusCode, 404);
        assert.equal(body.code, 404);
        assert.equal(body.message, 'Page not found');
        assert.equal(body.name, 'NotFound');
        done(err);
      });
    });
  });

  describe('405', function() {
    it.skip('shows a 405 Wrong Method error without stack trace', function(done) {
      request({
        url: host + '/messages',
        json: true
      }, function(err, res, body) {
        assert.equal(res.statusCode, 405);
        assert.equal(body.code, 405);
        done(err);
      });
    });
  });
});
