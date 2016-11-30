'use strict';

class Util {

  // constructor(options) {
  // }

  isAllSet(array) {
    return !array.some((elem,i)=>{
      if (typeof elem === 'undefined') return true;
    });
  }

  getEnumValues(enumObject) {
    var result = [];
    for (var key in enumObject)
      result.push(enumObject[key])
    return result;
  }

  isAnySet(array) {
    return array.some((elem,i)=>{
      if (typeof elem !== 'undefined') return true;
    });
  }

  isSet(object) {
    return (typeof object !== 'undefined');
  }

}

module.exports = new Util();