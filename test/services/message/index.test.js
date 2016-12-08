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
        "title": "New Notification",
        "body": "You have a new Notification",
        "token": "invalidToken",
        "scopeIds": [
          "userIdOrScopeId",
          "testScopeId"
        ]
      })
      .then(res => {
        expect(res.code).to.be.above(399);
      })
      .catch(err => {
         expect(err.code).to.be.above(399);
      });
  });

   it('sends a message', () => {
    return app.service('messages').create({
        "title": "New Notification",
        "body": "You have a new Notification",
        "token": "servicetoken2",
        "scopeIds": [
          "userIdOrScopeId",
          "testScopeId"
        ]
      })
      .then(res => {
        expect(res.code).not.to.be.above(299);
      })
      .catch(err => {
        expect(err.code).not.to.exist;
      });
  });

});
