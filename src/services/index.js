'use strict';
const callback = require('./callback');
const message = require('./message');
// const orchestration = require('./orchestration');
const notification = require('./notification');
const resolve = require('./resolve');
const authentication = require('./authentication');
const user = require('./user');
const mongoose = require('mongoose');
module.exports = function() {
  const app = this;

  mongoose.connect(app.get('mongodb'));
  mongoose.Promise = global.Promise;

  app.configure(authentication);
  app.configure(user);
  app.configure(resolve);
  app.configure(notification);
  app.configure(callback);
  app.configure(message);
};
