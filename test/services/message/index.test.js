'use strict';

const assert = require('assert');
const expect = require('chai').expect;
const app = require('../../../src/app');

describe('message service', function() {
  it('registered the messages service', () => {
    assert.ok(app.service('messages'));
  });

  /* should not really send the message
  it('accepts minimal message', () => {
    return app.service('messages').create({
      'title': 'Cat ipsum notification',
      'body': 'Brown cats with pink ears slap owners face at 5am until human fills food dish for cats secretly make all the worlds muffins.',
      'scopeIds': 'some-random-id',
      'userId': 'usertoken1',
      'authToken': 'servicetoken1'
    })
    .then( res => {
      expect(res).to.be.ok;
    })
    .catch( err => {
      console.log(err);
      expect(err.code).to.equal(400);
    });
  });
  */

  it('rejects invalid authToken', () => {
    return app.service('messages').create({
      'title': 'Cat ipsum notification',
      'body': 'Brown cats with pink ears slap owners face at 5am until human fills food dish for cats secretly make all the worlds muffins.',
      'action': 'click-here',
      'priority': 'high',
      'timeToLive': '2016-12-31T23:59:00',
      'scopeIds': 'some-random-id',
      'userId': 'usertoken1',
      'authToken': 'not-a-valid-token'
    })
    .then( res => {
      expect(res.code).to.equal(403);
    })
    .catch( err => {
      expect(err.code).to.equal(403);
    });
  });

  it('rejects invalid userId', () => {
    return app.service('messages').create({
      'title': 'Cat ipsum notification',
      'body': 'Brown cats with pink ears slap owners face at 5am until human fills food dish for cats secretly make all the worlds muffins.',
      'action': 'click-here',
      'priority': 'high',
      'timeToLive': '2016-12-31T23:59:00',
      'scopeIds': 'some-random-id',
      'userId': 'not-a-valid-token',
      'authToken': 'servertoken1'
    })
    .then( res => {
      expect(res.code).to.equal(403);
    })
    .catch( err => {
      expect(err.code).to.equal(403);
    });
  });
});
