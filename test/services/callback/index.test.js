'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('callback service', function() {
  it('registered the callbacks service', () => {
    assert.ok(app.service('callback'));
  });

  describe('calls', () => {

    it('call empty', () => {
      app.service('callback').create({});
    })

    // TODO implement this shit
    it('call with valid token', () => {
      app.service('callback').create({

      });
    });
  });
});
