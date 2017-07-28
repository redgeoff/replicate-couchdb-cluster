#!/usr/bin/env node

'use strict';

var replicate = require('../scripts'),
  argv = require('minimist')(process.argv.slice(2));

if (!argv.s || !argv.t) {
  console.log('Usage: replicate-couchdb-cluster -s source -t target [ -c concurrency ] [ -i dbs-to-skip ]');
} else {
  var skip = undefined;
  if (argv.i) {
    skip = argv.i.split(',');
  }

  replicate({
    source: argv.s,
    target: argv.t,
    concurrency: argv.c,
    skip: skip
  }).catch(function (err) {
    console.log('Fatal Error:', err.message);
    process.exit(1);
  });
}
