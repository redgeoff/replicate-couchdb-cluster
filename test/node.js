'use strict';

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var path = require('path'),
  spawn = require('child_process').spawn,
  utils = require('./utils');

require('./node-and-browser');

describe('node', function () {

  // The test sometimes takes longer than the default of 2 secs
  this.timeout(20000);

  it('should work via command line', function (done) {

    var options = [
      '-s', utils.couchDBURL(),
      '-t', utils.couchDBURL()
    ];

    var child = spawn(path.join(__dirname, '/../bin/cmd.js'), options);

    child.stderr.on('data', function ( /* data */ ) {
      throw new Error('should not get data on stderr');
    });

    child.on('error', function (err) {
      throw err;
    });

    child.on('close', function (code) {
      if (code > 0) {
        throw new Error('non-zero code');
      } else {
        done();
      }
    });

  });

});
