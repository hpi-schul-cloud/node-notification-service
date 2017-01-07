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


}

module.exports = Resolve;
