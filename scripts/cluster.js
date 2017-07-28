'use strict';

var Slouch = require('couch-slouch'),
  squadron = require('squadron');

// params
//   source
//   target
//   concurrency
//   skip
var Cluster = function (params) {
  this._params = params;

  this._slouch = new Slouch(params.source);

  if (this._params.concurrency === 1) {
    // Don't use a throttler
    this._throttler = null;
  } else {
    // Create a throttler with the specified or default concurrency
    var concurrency = this._params.concurrency ? this._params.concurrency : null;
    this._throttler = new squadron.Throttler(concurrency);
  }
};

Cluster.prototype.replicate = function () {
  var self = this;
  return self._slouch.db.all().each(function (db) {
    return self._replicateDB(db);
  }, self._throttler);
};

Cluster.prototype._replicateDB = function (db) {
  console.log(db);
};

module.exports = Cluster;
