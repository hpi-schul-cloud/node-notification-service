'use strict';

const hooks = require('./hooks');
const error = require('feathers-errors');
const spawn = require('child_process').spawn;
const fs = require('fs-extra');
const crypto = require('crypto');
const zip = require('express-zip');

// paths
const publicPath = __dirname + '/../../../public';
const securePath = __dirname + '/../../../secure';
const certPath = securePath + '/certificates';
const iconsetPath = __dirname+'/pushPackage/icon.iconset';

// password for certificate
const password = require(securePath + '/config.json').certificates.password;

// website.json content
const websiteName = 'Schul-Cloud';
const websitePushID = 'web.org.schul-cloud';
const urlFormatString = 'https://schul-cloud.org/%@';
const webServiceURL = 'https://schul-cloud.org:3030';
const allowedDomains = ['https://schul-cloud.org', webServiceURL];

class Service {
  constructor() {
    this.createPushPackage = this.createPushPackage.bind(this);
  }

  register(req, res) {
    let userToken = req.headers.authorization.split(' ')[1];
    let token = req.params.deviceToken;

    fs.appendFile(publicPath + '/apn.log', '[' + (new Date()).toISOString() + '] Register device:' + userToken + ', ' + token + '\n');

    // let the frontend handle matching user and token
    res.status(200).send({});

    // req.app.service('devices')
    //   .create({
    //     'user_token': userToken,
    //     'service_token': token,
    //     'type': 'desktop',
    //     'service': 'apn',
    //     'name': 'Safari',
    //     'OS': 'safari'
    //   })
    //   .then(userWithNewDevice => {
    //     res.status(200).send(userWithNewDevice);
    //   })
    //   .catch((err) => {
    //     res.status(500).send(err);
    //   });
  }

  delete(req, res) {
    let userToken = req.headers.authorization.split(' ')[1];
    fs.appendFile(publicPath + '/apn.log', '[' + (new Date()).toISOString() + '] Delete device: ' + userToken + '\n');
    res.sendStatus(200);
    // TOOD: not yet implemented in device service
    //req.app.service('/devices')
    // .delete();
  }

  log(req, res) {
    fs.appendFile(publicPath + '/apn.log', '[' + (new Date()).toISOString() + '] ' + JSON.stringify(req.body) + '\n', (err) => {
      if (err) {
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
    });
  }

  checkAuthorizationHeader(req, res, next) {
    fs.appendFile(publicPath + '/apn.log', '[' + (new Date()).toISOString() + '] Check authorization: ' + JSON.stringify(req.headers) + '\n');
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
    fs.appendFile(publicPath + '/apn.log', '[' + (new Date()).toISOString() + '] Check websitePushId: ' + JSON.stringify(req.params) + '\n');
    if (req.params.websitePushID !== websitePushID) {
      res.status(400).send(new error.NotFound('Invalid websitePushID.'));
    } else {
      next();
    }
  }

  createPushPackage(req, res, next) {
    const tempPrefix = '/tmp/pushPackage-';
    const token = req.body.userToken; // as token the Schul-Cloud Token is used

    fs.appendFile(publicPath + '/apn.log', '[' + (new Date()).toISOString() + '] Requested push package: ' + token + '\n');

    if (!token) {
      res.status(400).send(new error.BadRequest('Missing user token.'));
      return;
    }

    // return pregenerated pushpackage
    if (token === 'usertokenwithmin16chars') {
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=pushPackage.zip'
      });
      fs.createReadStream(__dirname + '/pushPackage.zip').pipe(res);
      return;
    }

    // generate pushpackage on the fly
    fs.mkdtemp(tempPrefix, (err, tempDir) => {
      if (err) {
        res.status(500).send(new error.GeneralError('Unable to create pushPackage.'));
        return;
      }

      // save this, so we can delete it later
      req.tempDir = tempDir;

      this._createWebsiteJSON(tempDir, token)
        .then((tempDir) => {
          return this._createPackage(tempDir);
        })
        .then((path) => {
          res.sendFile(path, {
            headers: {
              'Content-Disposition' : 'attachment; filename=pushPackage.zip'
            }
          }, (err) => {
            next();
          });
        })
        .catch((err) => {
          res.errorMessage = new error.GeneralError('Unable to create pushPackage.');
          next();
        });
    });
  }

  _createPackage(dir) {
    return new Promise((resolve, reject) => {

      // copy iconset to temp dir
      fs.copySync(iconsetPath, dir + '/icon.iconset');

      const args = [__dirname + '/createPushPackage.php', dir, securePath];
      let process = spawn('php', args);
      process.on('close', (code) => {
        if (code !== 0) {
          reject('Unable to create package. Closed with code ' + code + '.');
        } else {
          resolve(dir + '.zip');
        }
      });
    });
  }

  _createWebsiteJSON(dir, token) {
    return new Promise((resolve, reject) => {
      const websiteJSON = {
        websiteName: websiteName,
        websitePushID: websitePushID,
        allowedDomains: allowedDomains,
        urlFormatString: urlFormatString,
        authenticationToken: token,
        webServiceURL: webServiceURL
      };

      fs.writeFile(dir + '/website.json', JSON.stringify(websiteJSON), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(dir);
        }
      });
    });
  }

  cleanTempDir(req, res) {
    fs.removeSync(req.tempDir);
    fs.removeSync(req.tempDir + '.zip');
    if (res.errorMessage) {
      fs.appendFile(publicPath + '/apn.log', '[' + (new Date()).toISOString() + '] Failed to delete ' + req.tempDir + '\n');
      res.status(500).send(res.errorMessage);
    }
  }
}

module.exports = function(){
  const app = this;
  const service = new Service();

  app.post('/:version/devices/:deviceToken/registrations/:websitePushID',
    service.checkWebsitePushID,
    service.checkAuthorizationHeader,
    service.register);
  app.delete('/:version/devices/:deviceToken/registrations/:websitePushID',
    service.checkWebsitePushID,
    service.checkAuthorizationHeader,
    service.delete);

  app.post('/:version/pushPackages/:websitePushID',
    service.checkWebsitePushID,
    service.createPushPackage,
    service.cleanTempDir
  );

  app.post('/:version/log', service.log);
};

module.exports.Service = new Service();
