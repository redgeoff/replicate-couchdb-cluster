#!/usr/bin/env node

'use strict';

var replicate = require('../scripts'),
  argv = require('minimist')(process.argv.slice(2)),
  fs = require('fs');

if (!argv.s || !argv.t) {
  return fs.createReadStream(__dirname + '/usage.txt')
    .pipe(process.stdout)
    .on('close', function () {
      process.exit(1);
    });
} else {
  var skip = null;
  if (argv.i) {
    skip = argv.i.split(',');
  }

  replicate({
    source: argv.s,
    target: argv.t,
    concurrency: argv.c,
    skip: skip,
    verbose: argv.v ? true : false,
    useTargetAPI: argv.a ? true : false,
    debug: argv.d ? true : false
  }).catch(function (err) {
    console.error('Fatal Error:', err.message);
    process.exit(1);
  });
}
