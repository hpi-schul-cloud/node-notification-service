'use strict';

const errors = require('feathers-errors');
const Util = require('../util');
const rp = require('request-promise');
const constants = require('../constants');

var options = {
  uri: 'https://api.github.com/user/repos',
  json: true
};

rp(options)
  .then(function(repos) {
    console.log('User has %d repos', repos.length);
  })
  .catch(function(err) {
    // API call failed...
  });


class Resolve {

  // return schulcloud user ids for given array of user or scope ids
  static resolveScope(ids) {

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

  // get User ID from schulcloud db by sso Token
  static verifyToken(ssoToken) {


    // const mock = {
    //   usertoken1: 'useridfürusertoken1',
    //   usertoken2: 'useridfürusertoken2',
    //   usertoken3: 'useridfürusertoken3',
    //   usertokenwithmin16chars: 'useridfürusertoken4',
    // };

    // return new Promise((resolve, reject) => {
    //   if (mock[ssoToken])
    //     resolve(mock[ssoToken]);
    //   else
    //     reject(new errors.Forbidden('user token not valid'));
    // });

    var options = {
      uri: constants.CONFIG.AUTH_API_ENDPOINT + ssoToken,
      json: true
    };

    return rp(options);

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


}

module.exports = Resolve;
