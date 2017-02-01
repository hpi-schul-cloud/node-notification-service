'use strict';

const hooks = require('feathers-hooks');
const Authentication = require('../../authentication');

exports.before = {
  all: [Authentication.auth()],
  find: [],
  get: [],
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
