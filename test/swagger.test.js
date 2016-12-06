'use strict';

const chai = require('chai');
var rp = require('request-promise');
const should = chai.should();

const app = require('../src/app');

const port = 3131;
const host = 'http://localhost:' + port;

describe('Swagger documentation', function() {

  before(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  after(function(done) {
    this.server.close(done);
  });

  it('displays Swagger UI', () => {
    return rp(host+ "/docs")
      .then( (htmlString) => {
          htmlString.should.include('swagger');
      })
      .catch( (err) => {
          err.should.not.be.ok;
      });
  });

});
