'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const sinon = require('sinon');
const fs = require('fs');
const app = require('../../../src/app');
const apnDevice = require('../../../src/services/apnDevice/index');
const service = apnDevice.Service;

describe('apnDevice service', function() {

  it('registered the apnDevice service', () => {
    expect(apnDevice).to.be.ok;
  });

  it('registers a valid device', () => {
    return request(app)
      .post('/v1/devices/theDeviceToken/registrations/web.org.schul-cloud')
      .set('authorization', 'ApplePushNotifications usertoken2')
      .send({})
      .expect(201);
  });

  it('does not register an invalid device', () => {
    return request(app)
      .post('/v1/devices/theDeviceToken/registrations/web.org.schul-cloud')
      .set('authorization', 'ApplePushNotifications userInvalidtoken')
      .send({})
      .expect(500);
  });

  it('deletes a device', () => {
    // TODO: not yet implemented by device service
    return request(app)
      .delete('/v1/devices/theDeviceToken/registrations/web.org.schul-cloud')
      .set('authorization', 'ApplePushNotifications usertoken2')
      .send({})
      .expect(200);
  });

  it('creates the pushPackage', () => {
    return request(app)
      .post('/v1/pushPackage/web.org.schul-cloud')
      .send({
        userId: 'usertoken2'
      })
      .expect(200)
      .expect('Content-Type', /application\/zip/);
  });

  it('fails on missing authorization header', () => {
    return request(app)
      .post('/v1/devices/theDeviceToken/registrations/web.org.schul-cloud')
      .send({})
      .expect(500);
  });

  it('fails on invalid authorization header', () => {
    return request(app)
      .post('/v1/devices/theDeviceToken/registrations/web.org.schul-cloud')
      .set('authorization', 'AppleTypoNotifications usertoken2')
      .send({})
      .expect(500);
  });

  it('fails on invalid websitePushID', () => {
    return request(app)
      .post('/v1/devices/theDeviceToken/registrations/web.com.google')
      .set('authorization', 'ApplePushNotifications usertoken2')
      .send({})
      .expect(400);
  });

  it('fails if unable to create temp dir', (done) => {
    let stub = sinon.stub(fs, 'mkdtemp', (prefix, callback) => {
      callback(true, '');
    });

    request(app)
      .post('/v1/pushPackage/web.org.schul-cloud')
      .send({
        userId: 'usertoken2'
      })
      .end((err, res) => {
        expect(stub.called).to.be.true;
        expect(res.status).to.equal(500);
        fs.mkdtemp.restore();
        done(err);
      });
  });

  it('fails if unable to read temp dir', (done) => {
    let stub = sinon.stub(fs, 'readdir', (path, callback) => {
      callback(true, '');
    });

    request(app)
      .post('/v1/pushPackage/web.org.schul-cloud')
      .send({
        userId: 'usertoken2'
      })
      .end((err, res) => {
        console.log('here!');
        expect(stub.called).to.be.true;
        expect(res.status).to.equal(500);
        fs.readdir.restore();
        done(err);
      });
  });
});
