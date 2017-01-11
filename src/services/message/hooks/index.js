'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');

const Authentication = require('../../authentication');
const Authorization = require('../../authorization');

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [Authentication.auth(),Authorization.canSend()],
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
