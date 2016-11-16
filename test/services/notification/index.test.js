'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('notification service', function() {
  it('registered the notifications service', () => {
    assert.ok(app.service('notifications'));
  });
});
