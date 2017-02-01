'use strict';

const errors = require('feathers-errors');
const Util = require('../util');
const rp = require('request-promise');
const constants = require('../constants');

class Resolve {

  // return schulcloud user ids for given array of user or scope ids
  static resolveScope(ids) {

    console.log('[RESOLVE] resolving scopes...')

    if (!Array.isArray(ids)) return Promise.reject(new errors.BadRequest('scope id param has to be an array'));

    return Promise.all(ids.map(id => {

      console.log('[RESOLVE] resolving ' + id);
      console.log('[RESOLVE] calling ' + constants.CONFIG.RESOLVE_API_ENDPOINT + id);

      var options = {
        uri: constants.CONFIG.RESOLVE_API_ENDPOINT + id,
        json: true
      };

      return rp(options);
    })).then(all => {

      console.log('[RESOLVE] all scopes resolved');

      let allIds = all.map(segment => {
        console.log('[RESOLVE] '+segment.data.length+' users in scope');
        return segment.data.map(user => {
          return user.id;
        });
      })

      console.log('[RESOLVE] resolved ids: ' + Util.flatten(allIds));

      return Promise.resolve(Util.flatten(allIds));
    })

  }

  // get User ID from schulcloud db by sso Token
  static verifyToken(token) {

    var options = {
      uri: constants.CONFIG.AUTHENTICATION_API_ENDPOINT + token,
      json: true
    };

    return rp(options);

  }

  // get scopes for user
  static verifyScopes(token) {

    var options = {
      uri: constants.CONFIG.AUTHORIZATION_API_ENDPOINT + token,
      json: true
    };

    return rp(options);

  }


}

module.exports = Resolve;
