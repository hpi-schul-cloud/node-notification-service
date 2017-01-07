'use strict';

const errors = require('feathers-errors');
const Util = require('../util');


class Authentication {
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

  static serviceAuthHook() {

    return function(hook) {

      if (hook.data.token) {

        return Authentication.verifyService(hook.data.token).then(serviceOrUserId => {
          hook.data.initiatorId = serviceOrUserId;
        });

      } else {

        return Promise.reject(new errors.BadRequest('user token missing'));

      }
    }


  }

  // get User ID from schulcloud db by sso Token
  static verifyUser(ssoToken) {

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

  static userAuthHook() {

    return function(hook) {

      if (hook.data.user_token) {

        return Authentication.verifyUser(hook.data.user_token).then(schulcloudId => {
          hook.data.schulcloudId = schulcloudId;
        });

      } else {

        return Promise.reject(new errors.BadRequest('user token missing'));

      }
    }

  }
}

module.exports = Authentication;
