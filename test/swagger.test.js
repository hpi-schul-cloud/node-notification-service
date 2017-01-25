'use strict';

const assert = require('assert');
const requestPromise = require('request-promise');
const app = require('../src/app');

const port = app.get('port');
const host = app.get('protocol') + '://' + app.get('host') + ':' + port;

describe('Swagger documentation', function() {

  before(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  after(function(done) {
    this.server.close(done);
  });

  it('displays Swagger UI', () => {
    return requestPromise(host + '/docs')
      .then((htmlString) => {
        assert(htmlString.indexOf('swagger') !== -1);
      });
  });

});
