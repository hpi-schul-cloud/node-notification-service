'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('orchestration service', function() {
  it('did not register the orchestration service', () => {
    assert.ok(!app.service('orchestration'));
  });
});
