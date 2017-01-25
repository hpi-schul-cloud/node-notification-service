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
          hook.data.schulcloudId = response.data.id;
          hook.data.type = response.data.type;
          console.log('[AUTHENTICATION] assigned ' + response.data.id + ' to request');

          return Promise.resolve(hook);

        })
        .catch(err => {
          return Promise.reject(new errors.NotAuthenticated('user or service token is invalid'));
        });

      } else {
        return Promise.reject(new errors.BadRequest('user or service token missing'));
      }
    }
  }
}




module.exports = Authentication;
