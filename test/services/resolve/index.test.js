'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const resolve = require('../../../src/services/resolve/index');

describe('resolve service', function() {
  it('registered the resolve service', () => {
    assert.ok(resolve);
  });
});
