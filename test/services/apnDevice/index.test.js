'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('apnDevice service', function() {
  it('registered the apnDevices service', () => {
    assert.ok(app.service('apnDevices'));
  });
});
