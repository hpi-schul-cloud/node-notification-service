'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
// const populate = require('feathers-populate-hook');


exports.before = {
  all: [],
  find: [],
  get: [],
  create: hooks.disable(),
  update: hooks.disable(),
  patch: hooks.disable(),
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
