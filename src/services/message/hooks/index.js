'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');


const Auth = require('../../authentication');

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [Auth.serviceAuthHook()],
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
