'use strict';

const errors = require('feathers-errors');
const Util = require('../util');


class Resolve {

  // return schulcloud user ids for given array of user or scope ids
  static resolveUser(ids) {

    let resolved = ids.map((id) => {
      if (id === 'testScopeId')
        return ['idFromScope1', 'idFromScope2', 'idFromScope3']
      else
        return id;
    });

    resolved = Util.flatten(resolved);

    return Promise.resolve(resolved);

    //
    // var userIDs = [];
    // // Mocking Data
    // userIDs.push('fsdk23eoce8jrw3oejed');
    //
    // return Promise.resolve(userIDs);

    // TODO Call Schul-Cloud Server
    // contactSchulCloud(ids);
  }

  // see if service token is registered with schulcloud db
  static verifyService(token) {

    const mock = {
      servicetoken1: 'serviceidfürservicetoken1',
      servicetoken2: 'serviceidfürservicetoken2',
      servicetoken3: 'serviceidfürservicetoken3',
    };

    return new Promise((resolve, reject) => {
      if (mock[token])
        resolve(mock[token]);
      else
        reject(new errors.BadRequest('service token not valid'));
    });
  }

  static userAuthHook() {

    return function(hook) {

      console.log('user auth hook');

      if (hook.data.user_token) {

        return Resolve.verifyUser(hook.data.user_token);

      } else {
        return Promise.reject(errors.BadRequest('user token missing'));
      }

    }

  }

  // get User ID from schulcloud db by sso Token
  static verifyUser(ssoToken) {

    debugger;

    const mock = {
      usertoken1: 'useridfürusertoken1',
      usertoken2: 'useridfürusertoken2',
      usertoken3: 'useridfürusertoken3',
    };

    return new Promise((resolve, reject) => {
      if (mock[ssoToken])
        resolve(mock[ssoToken]);
      else
        reject(new errors.Forbidden('user token not valid'));
    });

  }

}

module.exports = Resolve;
