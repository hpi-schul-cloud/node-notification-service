'use strict';

const errors = require('feathers-errors');
const Util = require('../util');
const Resolve = require('../resolve');
const constants = require('../constants');

class Authorization {

  static canSend() {

    return function(hook) {

      return Resolve.verifyScopes(hook.data.token).then(result => {
        let matches = result.data.filter(scope => {
          if (hook.data.scopeIds.includes(scope.id) && scope.attributes.authorities.includes(constants.AUTHORITIES.CAN_SEND_NOTIFICATIONS)) return true;
        })
        if (matches.length === hook.data.scopeIds.length)
          return Promise.resolve(hook);
        else
          return Promise.reject(new errors.Forbidden('User is not allowed to send to all defined scopes'));
      })

    }
  }

  static isUser() {

    return function(hook) {

      let q = hook.data ? (hook.data.author.type === 'user') : (hook.params.author.type === 'user');

      // console.log(q ?'[AUTHORIZATION] it is a user' : '[AUTHORIZATION] it is not a user')

      return q ? Promise.resolve(hook) : Promise.reject(new errors.Forbidden('is not a user'));

    }
  }
}

module.exports = Authorization;
