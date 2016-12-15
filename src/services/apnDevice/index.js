'use strict';

const hooks = require('./hooks');
const error = require('feathers-errors');
const device = require('../device');
const spawn = require('child_process').spawn;
const fs = require('fs');
const crypto = require('crypto');
const zip = require('express-zip');

// password for certificate
const password = require('../../certificates/config.json').password;

// website.json content
const websiteName = 'Schul-Cloud';
const websitePushID = 'web.org.schul-cloud';
const urlFormatString = 'https://schul-cloud.org/';
const webServiceURL = 'https://schul-cloud.org:3030/';
const allowedDomains = [urlFormatString];

class Service {
  constructor(options) {
    this.options = options || {};
  }

  register(req, res) {
    console.log(req.headers);
  }

  delete(req, res) {

  }

  requestPushPackage(req, res, next) {
    if (req.params.websitePushID !== websitePushID) {
      res.send(new error.NotFound('Invalid websitePushID.'));
    } else {
      next();
    }
  }

  createPushPackage(req, res, next) {
    const tempPrefix = '/tmp/pushPackage-';
    let token = req.body.userId; // this must be in the user info dictionary

    fs.mkdtemp(tempPrefix, (err, tempDir) => {
      if (err) {
        res.send(new error.GeneralError('Unable to create pushPackage.'));
        return;
      }

      console.log(tempDir);

      this._createWebsiteJSON(tempDir, token)
        .then((tempDir) => {
          return this._createManifest(tempDir);
        })
        .then((tempDir) => {
          return this._createSignature(tempDir);
        })
        .then((tempDir) => {
          res.zip([
            { path: '/pushPackage/icon.iconset', name: '/icon.iconset' },
            { path: tempDir + '/website.json', name: '/website.json' },
            { path: tempDir + '/manifest.json', name: '/manifest.json' },
            { path: tempDir + '/signature', name: '/signature' }
          ]);
          next();
          return Promise.resolve(tempDir);
        })
        .catch((error) => {
          res.data = new error.GeneralError('Unable to create pushPackage.');
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
        if (err) reject(err);
        resolve(dir);
      });
    });
  }

  _createManifest(dir) {
    const iconsetPath = __dirname+'/../../pushPackage/icon.iconset';

    return new Promise((resolve, reject) => {
      let manifest = {};

      // read iconset directory
      fs.readdir(iconsetPath, (err, files) => {
        if (err) {
          reject(err);
        }

        // create hash for website.json
        let hash = crypto.createHash('SHA1');
        hash.setEncoding('hex');
        hash.write(fs.readFileSync(dir + '/' + 'website.json'));
        hash.end();
        manifest['webiste.json'] = hash.read();

        // create hashes for iconset
        files.forEach((file) => {
          let hash = crypto.createHash('SHA1');
          hash.setEncoding('hex');
          hash.write(fs.readFileSync(iconsetPath + '/' + file));
          hash.end();
          manifest['icon.iconset/' + file] = hash.read();
        });

        // write manifest to file
        fs.writeFile(dir + '/manifest.json', manifest, (err) => {
          if (err) reject(err);
          resolve(dir);
        });
      });
    });
  }

  _createSignature(dir) {
    return new Promise((resolve, reject) => {
      const certPath = __dirname + '/../../certificates';
      const cert = '' + certPath + '/cert.pem';
      const key = '' + certPath + '/key.pem';
      const intermediate = certPath + '/intermediate.pem';
      const manifest = '' + dir + '/manifest.json';
      const signature = '' + dir + '/signature';

      const args = [
        'smime', '-sign', '-binary',
        '-in', manifest,
        '-out', signature,
        '-signer', cert,
        '-inkey', key,
        '-certfile', intermediate,
        '-passin', 'pass:' + password
      ];

      let process = spawn('openssl', args);
      process.on('close', (code) => {
        if (code !== 0) {
          reject('Unable to create signature. Exited with code ' + code + '.')
        } else {
          resolve(dir);
        }
      })
    });
  }

  cleanTempDir(req, res, next) {
    // TODO
    /*fs.unlink(tempDir, (err) => {
      if (err) console.log(err);
    });*/
  }
}

module.exports = function(){
  const app = this;
  const service = new Service();

  app.post('/:version/devices/:deviceToken/registrations/:websitePushID', service.register);
  app.delete('/:version/devices/:deviceToken/registrations/:websitePushID', service.delete);

  app.post('/:version/pushPackage/:websitePushID',
    service.requestPushPackage,
    service.createPushPackage,
    service.cleanTempDir
  );
};

module.exports.Service = Service;
