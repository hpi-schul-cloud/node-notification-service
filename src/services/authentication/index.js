'use strict';

const errors = require('feathers-errors');
const Util = require('../util');
const Resolve = require('../resolve');

class Authentication {

  static auth() {

    return function(hook) {

      if (hook.data.token) {

        return Resolve.verifyToken(hook.data.token).then(response => {

          if (Array.isArray(response.data))
            response.data = response.data[0];

          console.log('[AUTHENTICATION] token is valid');

          var authorities = [];

          if (response.data.attributes.canWrite)
            authorities.push('canWrite');

          if (response.data.attributes.canRead)
            authorities.push('canRead');

          console.log('[AUTHENTICATION] assigned ' + response.data.id + ' to request');

          hook.data.schulcloudId = response.data.id;
          // hook.data.authorities = response.data.authorities;    in the future, when authorities are directly provided
          hook.data.authorities = authorities;

        });

      } else {
        return Promise.reject(new errors.BadRequest('auth token missing'));
      }
    }
  }
}




module.exports = Authentication;
