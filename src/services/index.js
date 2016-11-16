'use strict';
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
  // app.configure(orchestration);
  app.configure(notification);
};
