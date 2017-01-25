'use strict';

const assert = require('assert');
const expect = require('chai').expect;
const app = require('../../../src/app');

describe('message service', function() {
  it('registered the messages service', () => {
    assert.ok(app.service('messages'));
  });

  it('rejects invalid authToken', () => {
    return app.service('messages').create({
      title: 'New Notification',
      body: 'You have a new Notification',
      token: 'invalidToken',
      scopeIds: [
        'userIdOrScopeId',
        'testScopeId'
      ]
    })
    .then(res => {
      expect(res).not.to.exist;
    })
    .catch(err => {
      expect(err.code).to.equal(401);
    });
  });

  // TODO add user(s) if not present in db
  it.skip('sends a message', () => {
    return app.service('messages').create({
      title: 'New Notification',
      body: 'You have a new Notification',
      token: 'teacher1_1',
      scopeIds: [
        '316866a2-41c3-444b-b82c-274697c546a0'
      ]
    })
    .then(res => {
      expect(res.code).to.equal(201);
    })
    .catch(err => {
      expect(err).not.to.exist;
    });
  });

  it('rejects unauthorized user (1/2)', () => {
    return app.service('messages').create({
      title: 'New Notification',
      body: 'You have a new Notification',
      token: 'student1_1',
      scopeIds: [
        '316866a2-41c3-444b-b82c-274697c546a0'
      ]
    })
    .then(res => {
      expect(res).not.to.exist;
    })
    .catch(err => {
      expect(err.code).to.equal(403);
    });
  });

  it('rejects unauthorized user (2/2)', () => {
    return app.service('messages').create({
      title: 'New Notification',
      body: 'You have a new Notification',
      token: 'teacher1_1',
      scopeIds: [
        '8b0753ab-6fa8-4f42-80bd-700fe8f7d66d'
      ]
    })
    .then(res => {
      expect(res).not.to.exist;
    })
    .catch(err => {
      expect(err.code).to.equal(403);
    });
  });

});
