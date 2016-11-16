'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('resolve service', function() {
  it('registered the resolve service', () => {
    assert.ok(app.service('resolve'));
  });
});
