'use strict';

const assert = require('assert');

const util = require('../src/services/util');

describe('util class', function() {

  const array1 = [undefined,undefined,undefined,'yeah'];
  const array2 = [undefined,undefined,undefined];
  const array3 = ['yeah','yeah','yeah'];
  const undef = undefined;
  const def = 'yeah';

  it('checks if any object in array is set', () => {
    assert.equal(util.isAnySet(array1), true);
    assert.equal(util.isAnySet(array2), false);
    assert.equal(util.isAnySet(array3), true);
  });

  it('checks if all objects in array is set', () => {
    assert.equal(util.isAllSet(array1), false);
    assert.equal(util.isAllSet(array2), false);
    assert.equal(util.isAllSet(array3), true);
  });

  it('checks an object is set', () => {
    assert.equal(util.isSet(undef), false);
    assert.equal(util.isSet(def), true);
  });

});
