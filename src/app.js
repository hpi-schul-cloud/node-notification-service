'use strict';

const path = require('path');
const serveStatic = require('feathers').static;
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const hooks = require('feathers-hooks');
const rest = require('feathers-rest');
const bodyParser = require('body-parser');
const middleware = require('./middleware');
const header = require('./middleware/header');

const services = require('./services');
const swagger = require('feathers-swagger');

const app = feathers();

app.configure(configuration(path.join(__dirname, '..')));

app.use(compress())
  .options('*', cors())
  .use(cors())
  .use(favicon(path.join(app.get('public'), 'favicon.ico')))
  .use('/', serveStatic(app.get('public')))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(hooks())
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
