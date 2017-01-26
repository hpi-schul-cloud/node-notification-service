'use strict';

const constants = require('../constants');
const crypto = require('crypto');
const error = require('feathers-errors');
const fs = require('fs-extra');
const spawn = require('child_process').spawn;
const zip = require('express-zip');

// paths
const publicPath = __dirname + '/../../../public';
const securePath = __dirname + '/../../../secure';
const certPath = securePath + '/certificates';
const iconsetPath = __dirname + '/pushPackage/icon.iconset';

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

    // let the frontend handle matching user and token
    res.status(200).send({});

    // If the pushPackages is generated dynamically, we can register the device here.
    // req.app.service('devices')
    //   .create({
    //     'user_token': userToken,
    //     'service_token': token,
    //     'type': constants.DEVICE_TYPES.DESKTOP,
    //     'service': constants.SEND_SERVICES.APN,
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
    // Due to the pregenerated pushPackage it is not possible to determine which user wants do delete his APN token,
    // because all pushPackages contain the same authenticationToken, which is used by Safari.
    let userToken = req.headers.authorization.split(' ')[1];
    res.sendStatus(200);
  }

  createPushPackage(req, res, next) {
    const tempPrefix = '/tmp/pushPackage-';
    const token = req.body.userToken; // as token the Schul-Cloud Token is used

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

    // generate pushPackage on the fly
    // TODO: test if this works with openssl 0.9.8
    fs.mkdtemp(tempPrefix, (err, tempDir) => {
      if (err) {
        res.status(500).send(new error.GeneralError('Unable to create pushPackage.'));
        return;
      }

      // save this, so we can delete it later
      req.tempDir = tempDir;

      this._createWebsiteJSON(tempDir, token)
        .then((tempDir) => {
          return this._createManifest(tempDir);
        })
        .then((tempDir) => {
          return this._createSignature(tempDir);
        })
        .then((tempDir) => {
          res.zip([
            { path: iconsetPath + '/icon_16x16.png', name: '/icon.iconset/icon_16x16.png' },
            { path: iconsetPath + '/icon_16x16@2x.png', name: '/icon.iconset/icon_16x16@2x.png' },
            { path: iconsetPath + '/icon_32x32.png', name: '/icon.iconset/icon_32x32.png' },
            { path: iconsetPath + '/icon_32x32@2x.png', name: '/icon.iconset/icon_32x32@2x.png' },
            { path: iconsetPath + '/icon_128x128.png', name: '/icon.iconset/icon_128x128.png' },
            { path: iconsetPath + '/icon_128x128@2x.png', name: '/icon.iconset/icon_128x128@2x.png' },
            { path: tempDir + '/website.json', name: '/website.json' },
            { path: tempDir + '/manifest.json', name: '/manifest.json' },
            { path: tempDir + '/signature', name: '/signature' }
          ], 'pushPackage.zip', (err) => {
            next();
            return Promise.resolve(tempDir);
          });
        })
        .catch((err) => {
          res.errorMessage = new error.GeneralError('Unable to create pushPackage.');
          next();
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

  _createManifest(dir) {
    return new Promise((resolve, reject) => {
      let manifest = {};

      // read iconset directory
      fs.readdir(iconsetPath, (err, files) => {
        if (err) {
          reject(err);
        } else {
          // create hash for website.json
          let hash = crypto.createHash('SHA1');
          hash.setEncoding('hex');
          hash.write(fs.readFileSync(dir + '/' + 'website.json'));
          hash.end();
          manifest['website.json'] = hash.read();

          // create hashes for iconset
          files.forEach((file) => {
            let hash = crypto.createHash('SHA1');
            hash.setEncoding('hex');
            hash.write(fs.readFileSync(iconsetPath + '/' + file));
            hash.end();
            manifest['icon.iconset/' + file] = hash.read();
          });

          // write manifest to file
          fs.writeFile(dir + '/manifest.json', JSON.stringify(manifest), (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(dir);
            }
          });
        }
      });
    });
  }

  _createSignature(dir) {
    return new Promise((resolve, reject) => {
      const cert = certPath + '/cert.pem';
      const key = certPath + '/key.pem';
      const intermediate = certPath + '/intermediate.pem';
      const manifest = dir + '/manifest.json';
      const signature = dir + '/signature';

      const args = [
        'smime', '-sign', '-binary',
        '-in', manifest,
        '-out', signature,
        '-outform', 'DER',
        '-signer', cert,
        '-inkey', key,
        '-certfile', intermediate,
        '-passin', 'pass:' + password
      ];

      let process = spawn('openssl', args);
      process.on('exit', (code) => {
        if (code !== 0) {
          reject('Unable to create signature. Exited with code ' + code + '.');
        } else {
          resolve(dir);
        }
      });
    });
  }

  cleanTempDir(req, res, next) {
    if (res.errorMessage && !res.headersSent) {
      res.status(500).send(res.errorMessage);
    }

    fs.removeSync(req.tempDir);
    fs.removeSync(req.tempDir + '.zip');
    next();
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
    service.createPushPackage,
    service.cleanTempDir);

  // log errors
  app.post('/:version/log', service.log);
};

module.exports.Service = new Service();
