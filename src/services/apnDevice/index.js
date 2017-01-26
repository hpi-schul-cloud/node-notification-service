'use strict';

const constants = require('../constants');
const crypto = require('crypto');
const error = require('feathers-errors');
const fs = require('fs');
const spawn = require('child_process').spawn;

const publicPath = __dirname + '/../../../public';
const websitePushID = 'web.org.schul-cloud';

class Service {

  register(req, res) {
    // Let the frontend handle matching user and token.
    res.sendStatus(200);
  }

  delete(req, res) {
    // Due to the pregenerated pushPackage it is not possible to determine which user wants do delete his APN token,
    // because all pushPackages contain the same authenticationToken, which is used by Safari.
    // Thus, the client has to use the device route and delete its old token.
    res.sendStatus(200);
  }

  sendPushPackage(req, res, next) {
    const token = req.body.userToken;

    if (!token) {
      res.status(400).send(new error.BadRequest('Missing user token.'));
      return;
    }

    // return pregenerated pushPackage
    if (token === 'usertokenwithmin16chars') {
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=pushPackage.zip'
      });
      fs.createReadStream(__dirname + '/pushPackage.zip').pipe(res);
      return;
    }

    res.status(400).send(new error.BadRequest('Invalid token.'));
  }

  log(req, res) {
    // TODO: replace with proper logging
    fs.appendFile(publicPath + '/apn.log', '[' + (new Date()).toISOString() + '] ' + JSON.stringify(req.body) + '\n', (err) => {
      if (err) {
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
    });
  }

  checkAuthorizationHeader(req, res, next) {
    if (!req.headers.authorization) {
      res.status(500).send(new error.BadRequest('Missing authorization.'));
      return;
    }

    let authorization = req.headers.authorization.split(' ');
    if (authorization[0] !== 'ApplePushNotifications') {
      res.status(500).send(new error.BadRequest('Invalid authorization.'));
      return;
    }

    next();
  }

  checkWebsitePushID(req, res, next) {
    if (req.params.websitePushID !== websitePushID) {
      res.status(400).send(new error.NotFound('Invalid websitePushID.'));
    } else {
      next();
    }
  }
}

module.exports = function(){
  const app = this;
  const service = new Service();

  // register and delete APN token
  app.post('/:version/devices/:deviceToken/registrations/:websitePushID',
    service.checkWebsitePushID,
    service.checkAuthorizationHeader,
    service.register);
  app.delete('/:version/devices/:deviceToken/registrations/:websitePushID',
    service.checkWebsitePushID,
    service.checkAuthorizationHeader,
    service.delete);

  // download pushPackage
  app.post('/:version/pushPackages/:websitePushID',
    service.checkWebsitePushID,
    service.sendPushPackage);

  // log errors
  app.post('/:version/log', service.log);
};

module.exports.Service = new Service();
