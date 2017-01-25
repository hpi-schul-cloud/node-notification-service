'use strict';

const assert = require('assert');
const sinon = require('sinon');

const requestPromise = require('request-promise');
const fs = require('fs-extra');
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

  it('registers a valid device', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/devices/theDeviceToken/registrations/web.org.schul-cloud',
      headers: {
        'authorization': 'ApplePushNotifications student1_1'
      }
    });
  });

  it('does not register an invalid device', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/devices/theDeviceToken/registrations/web.org.schul-cloud',
      headers: {
        'authorization': 'ApplePushNotifications userInvalidtoken'
      }
    });
  });

  it('deletes a device', () => {
    // TODO: not yet implemented by device service
    return requestPromise({
      method: 'DELETE',
      uri: host + '/v1/devices/theDeviceToken/registrations/web.org.schul-cloud',
      headers: {
        'authorization': 'ApplePushNotifications student1_1'
      }
    });
  });

  it('creates the pushPackage', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/pushPackages/web.org.schul-cloud',
      body: {
        userToken: 'student1_1'
      },
      json: true,
      resolveWithFullResponse: true
    })
      .then(response => {
        assert.equal(response.headers['content-type'], 'application/zip');
        assert.equal(response.statusCode, 200);
      });
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
        'authorization': 'ApplePushNotifications usertoken2'
      }
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

  it('fails if unable to create temp dir', (done) => {
    let stub = sinon.stub(fs, 'mkdtemp', (prefix, callback) => {
      callback(true, '');
    });

    requestPromise({
      method: 'POST',
      uri: host + '/v1/pushPackages/web.org.schul-cloud',
      body: {
        userToken: 'student1_1'
      },
      json: true
    })
      .catch(err => {
        assert(stub.called);
        assert.equal(err.statusCode, 500);
        fs.mkdtemp.restore();
        done();
      });
  });


  it('creates a log file', () => {
    return requestPromise({
      method: 'POST',
      uri: host + '/v1/log',
      body: ['logInfo'],
      json: true
    });
  });

});
