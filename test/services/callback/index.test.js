'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('callback service', function() {
  it('registered the callbacks service', () => {
    assert.ok(app.service('callbacks'));
  });
});
