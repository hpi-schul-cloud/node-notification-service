'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const errors = require('feathers-errors');
const Util = require('../../util');

const Auth = require('../../authentication');

const checkMessageConstraints = options => {
  return hook => {
    const data = hook.data;

    if (!Util.isAllSet([data.title, data.body, data.token, data.scopeIds]))
      return Promise.reject(new errors.BadRequest('Parameters missing.'));

    if (data.title.length >= 140) {
      return Promise.reject(new errors.BadRequest('Maximum title length exceeded.'));
    }

    const payload = Util.pick(data, ['title', 'body', 'image', 'data', 'priority']);
    // reserve 256 byte for us...
    if (JSON.stringify(payload).length > 1800) {
      return Promise.reject(new errors.BadRequest('Maximum payload size exceeded.'));
    }

    return Promise.resolve(hook);
  }
}

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [
    Auth.serviceAuthHook(),
    checkMessageConstraints()
  ],
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
