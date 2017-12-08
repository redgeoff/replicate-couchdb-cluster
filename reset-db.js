#!/usr/bin/env node

'use strict';

var Slouch = require('couch-slouch'),
  utils = require('./test/utils'),
  slouch = new Slouch(utils.couchDBURL());

slouch.system.reset();
