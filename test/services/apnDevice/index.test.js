'use strict';

const assert = require('assert');
const sinon = require('sinon');

const requestPromise = require('request-promise');
const app = require('../../../src/app');
const apnDevice = require('../../../src/services/apnDevice/index');

const port = app.get('port');
const host = app.get('protocol') + '://' + app.get('host') + ':' + port;

describe('apnDevice service', function() {

  // start the test server
  before(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  // stop the test server
  after(function(done) {
    this.server.close(done);
  });

  it('registered the apnDevice service', () => {
    assert(apnDevice);
  });

  it('responds on the registration route', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/devices/theDeviceToken/registrations/web.org.schul-cloud',
      headers: {
        'authorization': 'ApplePushNotifications student1_1'
      }
    });
  });

  it('responds on the delete route', () => {
    return requestPromise({
      method: 'DELETE',
      uri: host + '/v1/devices/theDeviceToken/registrations/web.org.schul-cloud',
      headers: {
        'authorization': 'ApplePushNotifications student1_1'
      }
    });
  });

  it('sends the pushPackage', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/pushPackages/web.org.schul-cloud',
      body: {
        userToken: 'usertokenwithmin16chars'
      },
      json: true,
      resolveWithFullResponse: true
    })
      .then(response => {
        assert.equal(response.headers['content-type'], 'application/zip');
        assert.equal(response.statusCode, 200);
      });
  });

  it('fails on missing userToken', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/pushPackages/web.org.schul-cloud',
      json: true,
      resolveWithFullResponse: true
    })
      .then(response => {
        assert.equal(response.statusCode, 400);
      })
      .catch(error => {
        assert.equal(error.statusCode, 400);
      })
  });

  it('fails on wrong userToken', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/pushPackages/web.org.schul-cloud',
      body: {
        userToken: 'usertokenwithmax16chars'
      },
      json: true,
      resolveWithFullResponse: true
    })
      .then(response => {
        assert.equal(response.statusCode, 400);
      })
      .catch(error => {
        assert.equal(error.statusCode, 400);
      })
  });

  it('fails on missing authorization header', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/devices/theDeviceToken/registrations/web.org.schul-cloud'
    })
      .catch(err => {
        assert.equal(err.statusCode, 500);
      });
  });

  it('fails on invalid authorization header', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/devices/theDeviceToken/registrations/web.org.schul-cloud',
      headers: {
        'authorization': 'AppleShupNotifications usertoken2'
      }
    })
      .then(response => {
        assert.equal(response.statusCode, 500);
      })
      .catch(err => {
        assert.equal(err.statusCode, 500);
      });
  });

  it('fails on invalid websitePushID', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/devices/theDeviceToken/registrations/web.org.google',
      headers: {
        'authorization': 'ApplePushNotifications student1_1'
      }
    })
      .catch(err => {
        assert.equal(err.statusCode, 400);
      });
  });

  it('logs an error', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/log',
      body: ['logInfo'],
      json: true
    });
  });

});
