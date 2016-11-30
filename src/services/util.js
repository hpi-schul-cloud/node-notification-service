'use strict';

class Util {

  static isAllSet(array) {
    return !array.some((elem,i)=>{
      if (typeof elem === 'undefined') return true;
    });
  }

  static getEnumValues(enumObject) {
    var result = [];
    for (var key in enumObject)
      result.push(enumObject[key])
    return result;
  }

  static isAnySet(array) {
    return array.some((elem,i)=>{
      if (typeof elem !== 'undefined') return true;
    });
  }

  static isSet(object) {
    return (typeof object !== 'undefined');
  }

}

module.exports = Util;