'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');

const Resolve = require('../../resolve');


exports.before = {
  all: [],
  find: [],
  get: [],
  create: [Resolve.userAuthHook()],
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
