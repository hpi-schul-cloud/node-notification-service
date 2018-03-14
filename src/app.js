'use strict';

const path = require('path');
const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const configuration = require('@feathersjs/configuration');
const rest = require('@feathersjs/express/rest');
const bodyParser = require('body-parser');
const middleware = require('./middleware');
const header = require('./middleware/header');

const services = require('./services');
const swagger = require('feathers-swagger');

const app = express(feathers());
app.mixins.push(service => {
  service.mixin({
    before(before) {
      return this.hooks({ before });
    },

    after(after) {
      return this.hooks({ after });
    },    
  })
});

app.configure(configuration(path.join(__dirname, '..')));
services.docs = {
  docsPath: '/docs',
  uiIndex: path.join(__dirname, 'docs.html'),
  schemes: ['https', 'http'],
  basePath: '/',
  securityDefinitions: {
    ssoToken: {
      type: 'apiKey',
    }
  }
} 
app.use(compress())
  .options('*', cors())
  .use(cors())
  .use(favicon(path.join(app.get('public'), 'favicon.ico')))
  .use('/', express.static(path.join(__dirname,'public')))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(rest())
  .use(header())
  .configure(services)
  .configure(middleware);


module.exports = app;
