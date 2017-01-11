'use strict';

const errors = require('feathers-errors');
const Util = require('../util');
const Resolve = require('../resolve');
const constants = require('../constants');

class Authorization {

  static canSend() {

    return function(hook) {

      console.log(hook.data.authorities);
      let q = (hook.data.authorities.indexOf(constants.AUTHORITIES.CAN_SEND) > -1)

      console.log(q ?'[AUTHORIZATION] account can send' : '[AUTHORIZATION] account can not send')

      return q ? Promise.resolve(hook) : Promise.reject(errors.Forbidden('can not send'));

    }
  }

  static isUser() {

    return function(hook) {

      let q = (hook.data.type === 'user')
      console.log(q ?'[AUTHORIZATION] it is a user' : '[AUTHORIZATION] it is not a user')

      return q ? Promise.resolve(hook) : Promise.reject(errors.Forbidden('is not a user'));

    }
  }
}

module.exports = Authorization;