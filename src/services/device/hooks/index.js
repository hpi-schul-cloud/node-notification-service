'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');

const Auth = require('../../Authentication');


exports.before = {
  all: [],
  find: [],
  get: [],
  create: [Auth.userAuthHook()],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
