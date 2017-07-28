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

  this._sourceSlouch = new Slouch(params.source);
  this._targetSlouch = new Slouch(params.target);

  if (this._params.concurrency === 1) {
    // Don't use a throttler
    this._throttler = undefined;
  } else {
    // Create a throttler with the specified or default concurrency
    var concurrency = this._params.concurrency ? this._params.concurrency : null;
    this._throttler = new squadron.Throttler(concurrency);
  }
};

Cluster.prototype.replicate = function () {
  var self = this;
  return self._sourceSlouch.db.all().each(function (db) {
    if (!self._params.skip || self._params.skip.indexOf(db) === -1) {
      return self._replicateDB(db, db);
    }
  }, self._throttler);
};

Cluster.prototype._createDBIfMissing = function (db) {
  var self = this;
  return self._targetSlouch.db.exists(db).then(function (exists) {
    if (!exists) {
      return self._targetSlouch.db.create(db);
    }
  });
};

Cluster.prototype._replicateSecurity = function (sourceDB, targetDB) {
  var self = this;
  return self._sourceSlouch.security.get(sourceDB).then(function (security) {
    return self._targetSlouch.security.set(targetDB, security);
  });
};

Cluster.prototype._replicateRawDB = function (sourceDB, targetDB) {
  return this._sourceSlouch.db.replicate({
    source: this._params.source + '/' + sourceDB,
    target: this._params.target + '/' + targetDB
  });
};

Cluster.prototype._replicateDB = function (sourceDB, targetDB) {
  var self = this;
  return self._createDBIfMissing(targetDB).then(function () {
    // Replicate security first so that security is put in place before data is copied over
    return self._replicateSecurity(sourceDB, targetDB);
  }).then(function () {
    return self._replicateRawDB(sourceDB, targetDB);
  });
};

module.exports = Cluster;
