'use strict';
module.exports = function(app) {
  return function(req, res, next) {
    req.feathers.token = req.headers.token;
    console.log('[MIDDLEWARE TOKEN] '+ JSON.stringify(req.headers.token));
    next();
  }
};
