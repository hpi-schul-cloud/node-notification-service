'use strict';

const hooks = require('./hooks');
const error = require('feathers-errors');
const spawn = require('child_process').spawn;
const fs = require('fs');
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
const urlFormatString = 'https://schul-cloud.org/';
const webServiceURL = 'https://schul-cloud.org:3030/';
const allowedDomains = [urlFormatString, webServiceURL];

class Service {
  constructor() {
    this.createPushPackage = this.createPushPackage.bind(this);
    this.cleanTempDir = this.cleanTempDir.bind(this);
    this._deleteFolderRecursive = this._deleteFolderRecursive.bind(this);
  }

  register(req, res) {
    let userToken = req.headers.authorization.split(' ')[1];
    let token = req.params.deviceToken;

    fs.appendFile(publicPath + '/apn.log', '[' + Date.now().toString() + '] Register device:' + userToken + ', ' + token + '\n');

    req.app.service('devices')
      .create({
        'user_token': userToken,
        'service_token': token,
        'type': 'desktop',
        'service': 'apn',
        'name': 'Safari',
        'OS': 'safari'
      })
      .then(userWithNewDevice => {
        res.status(201).send(userWithNewDevice);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  }

  delete(req, res) {
    let userToken = req.headers.authorization.split(' ')[1];
    fs.appendFile(publicPath + '/apn.log', '[' + Date.now().toString() + '] Delete device: ' + userToken + '\n');
    res.sendStatus(200);
    // TOOD: not yet implemented in device service
    //req.app.service('/devices')
    // .delete();
  }

  log(req, res) {
    fs.appendFile(publicPath + '/apn.log', '[' + Date.now().toString() + '] ' + JSON.stringify(req.body) + '\n', (err) => {
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

  createPushPackage(req, res, next) {
    const tempPrefix = '/tmp/pushPackage-';
    // as token the Schul-Cloud Token is used
    let token = req.body.userToken;

    fs.appendFile(publicPath + '/apn.log', '[' + Date.now().toString() + '] Requested push package: ' + token + '\n');

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
            // TODO: maybe a more compact way to do this
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
      fs.writeFile(dir + '/website.json', JSON.stringify({
        websiteName: websiteName,
        websitePushID: websitePushID,
        allowedDomains: allowedDomains,
        urlFormatString: urlFormatString,
        authenticationToken: token,
        webServiceURL: webServiceURL
      }), (err) => {
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
      process.on('close', (code) => {
        if (code !== 0) {
          reject('Unable to create signature. Exited with code ' + code + '.');
        } else {
          resolve(dir);
        }
      });
    });
  }

  cleanTempDir(req, res) {
    this._deleteFolderRecursive(req.tempDir);

    if (res.errorMessage) {
      res.status(500).send(res.errorMessage);
    }
  }

  _deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function(file) {
        let curPath = path + '/' + file;
        if (fs.statSync(curPath).isDirectory()) {
          this._deleteFolderRecursive(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
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

  app.post('/:version/pushPackage/:websitePushID',
    service.checkWebsitePushID,
    service.createPushPackage,
    service.cleanTempDir
  );

  app.post('/:version/log', service.log);
};

module.exports.Service = new Service();
