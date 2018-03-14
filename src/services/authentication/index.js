'use strict';

const errors = require('@feathersjs/errors');
const Util = require('../util');
const Resolve = require('../resolve');

class Authentication {

  static auth() {

    return function(hook) {

      // console.log('[AUTH] ' + JSON.stringify(hook));

      let token;

      // token via header
      if (hook.params.token)
        token = hook.params.token;

      // DEPRECATED token via query param
      if (hook.params.query && hook.params.query.token)
        token = hook.params.query.token;

      // DEPRECATED token via body
      if (hook.data && hook.data.token)
        token = hook.data.token;


      if (token) {

        return Resolve.verifyToken(token).then(response => {

          if (Array.isArray(response.data))
            response.data = response.data[0];

          // console.log('[AUTHENTICATION] token is valid');
          if (hook.data) hook.data.author = response.data;
          hook.params.author = response.data;
          // console.log('[AUTHENTICATION] assigned ' + response.data.id + ' to request');

          return Promise.resolve(hook);

        })
        .catch(err => {
          // console.log(err);
          return Promise.reject(new errors.NotAuthenticated('user or service token is invalid'));
        });

      } else {
        return Promise.reject(new errors.BadRequest('user or service token missing'));
      }
    }
  }
}




module.exports = Authentication;
