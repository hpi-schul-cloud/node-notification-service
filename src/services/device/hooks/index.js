'use strict';

const hooks = require('feathers-hooks');

const Authentication = require('../../authentication');
const Authorization = require('../../authorization');

exports.before = {
  all: [],
  find: [],
  get: [Authentication.auth()],
  create: [Authentication.auth(),Authorization.isUser()],
  update: [],
  patch: [],
  remove: [Authentication.auth()]
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
