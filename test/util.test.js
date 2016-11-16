'use strict';

const chai = require('chai');
const should = chai.should();
const util = require('../src/services/util');

describe('util class', function() {

  const array1 = [undefined,undefined,undefined,'yeah'];
  const array2 = [undefined,undefined,undefined];
  const array3 = ['yeah','yeah','yeah'];
  const undef = undefined;
  const def = 'yeah';

  it('checks if any object in array is set', () => {
    util.isAnySet(array1).should.be.true;
    util.isAnySet(array2).should.to.be.false;
    util.isAnySet(array3).should.to.be.true;
  });

  it('checks if all objects in array is set', () => {
    util.isAllSet(array1).should.be.false;
    util.isAllSet(array2).should.to.be.false;
    util.isAllSet(array3).should.to.be.true;
  });

  it('checks an object is set', () => {
    util.isSet(undef).should.be.false;
    util.isSet(def).should.to.be.true;
  });

});
