'use strict';

const path = require('path');
const express = require('@feathersjs/express');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const rest = require('@feathersjs/express/rest');
const bodyParser = require('body-parser');
const middleware = require('./middleware');
const header = require('./middleware/header');

const services = require('./services');
const swagger = require('feathers-swagger');

const app = express(feathers());

app.configure(configuration(path.join(__dirname, '..')));

app.use(compress())
  .options('*', cors())
  .use(cors())
  .use(favicon(path.join(app.get('public'), 'favicon.ico')))
  .use('/', express.static(app.get('public')))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(rest())
  .use(header())
  .configure(swagger({
    docsPath: '/docs',
    uiIndex: path.join(__dirname, 'docs.html'),
    schemes: ['https', 'http'],
    basePath: '/',
    securityDefinitions: {
      ssoToken: {
        type: 'apiKey',
        in: 'header',
        name: 'token'
      }
    },
    info: {
      title: 'Notification API Docs',
      description: '',
      version: '0.0.1',
      contact: app.get('contact')
    }
  }))
  .configure(services)
  .configure(middleware);

module.exports = app;
