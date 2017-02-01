'use strict';

class Util {

  static isAllSet(array) {
    return !array.some((elem, i) => {
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
    return array.some((elem, i) => {
      if (typeof elem !== 'undefined') return true;
    });
  }

  static isSet(object) {
    return (typeof object !== 'undefined');
  }

  static flatten(arr) {
    return arr.reduce(function(flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) ? Util.flatten(toFlatten) : toFlatten);
    }, []);
  }

  static pick(object, properties) {
    let newObject = {};
    for (let key in object) {
      if (properties.indexOf(key) !== -1) {
        newObject[key] = object[key];
      }
    }
    return newObject;
  }
}

module.exports = Util;
