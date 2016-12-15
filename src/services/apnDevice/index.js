'use strict';

const hooks = require('./hooks');
const device = require('../device');
const spawn = require('child_process').spawn;
const fs = require('fs');
const crypto = require('crypto');
const zip = require('express-zip');

class Service {
  constructor(options) {
    this.options = options || {};
  }

  register(data, params) {

  }

  delete(id, data, params) {

  }

  requestPushPackage(data, params) {
    //
    return Promise.resolve();
  }

  createPushPackage(req, res, next) {
    const tempPrefix = '/tmp/pushPackage-';
    let token = 'teasasddasdst'; // TODO: should be our device id

    fs.mkdtemp(tempPrefix, (err, tempDir) => {
      if (err) {
        console.log(err);
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
            { path: '/pushPackage/icon.iconset/', name: '/icon.iconset' },
            { path: tempDir + '/webiste.json', name: '/website.json' },
            { path: tempDir + '/manifest.json', name: '/manifest.json' },
            { path: tempDir + '/signature', name: '/signature' }
          ]);
          return tempDir;
        })
        .catch((error) => {
          console.log(error);
        });
    });
  }

  _createWebsiteJSON(dir, token) {
    return new Promise((resolve, reject) => {
      fs.writeFile(dir + '/website.json', JSON.stringify({
        websiteName: 'Schul-Cloud',
        websitePushID: 'web.org.schul-cloud',
        allowedDomains: ['http://schul-cloud.org/'],
        urlFormatString: 'http://schul-cloud.org/',
        authenticationToken: token,
        webServiceURL: 'http://schul-cloud.org:3030/'
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
        '-passin', 'pass:ices73?caper'
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

  // Initialize our service with any options it requires
  app.use('/:version/devices/:deviceToken/registrations/:websitePushID', {
    create: service.register,
    delete: service.delete
  });
  app.use('/:version/pushPackage/:websitePushID', {
    create: service.requestPushPackage
  }, service.createPushPackage, service.cleanTempDir);

  // Get our initialize service to that we can bind hooks
  const registrationService = app.service('/:version/devices/:deviceToken/registrations/:websitePushID');
  const pushPackageService = app.service('/:version/pushPackage/:websitePushID');

  // Set up our before hooks
  registrationService.before(hooks.before);
  pushPackageService.before(hooks.before);

  // Set up our after hooks
  registrationService.after(hooks.after);
  pushPackageService.after(hooks.after);
};

module.exports.Service = Service;
