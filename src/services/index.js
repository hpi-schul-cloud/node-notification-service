'use strict';
const message = require('./message');
// const orchestration = require('./orchestration');
const notification = require('./notification');
const resolve = require('./resolve');
const authentication = require('./authentication');
const user = require('./user');
const device = require('./device');
const callback = require('./callback');
const mongoose = require('mongoose');
module.exports = function() {
  const app = this;

  mongoose.connect(app.get('mongodb'), {user:process.env.DB_USERNAME, pass:process.env.DB_PASSWORD});
  mongoose.Promise = global.Promise;

  app.configure(message);
  app.configure(authentication);
  app.configure(user);
  app.configure(resolve);
  app.configure(notification);
  app.configure(callback);
  app.configure(device);
};
