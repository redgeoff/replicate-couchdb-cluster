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
    this._throttler = null;
  } else {
    // Create a throttler with the specified or default concurrency
    var concurrency = this._params.concurrency ? this._params.concurrency : null;
    this._throttler = new squadron.Throttler(concurrency);
  }
};

Cluster.prototype.replicate = function () {
  var self = this;
  return self._sourceSlouch.db.all().each(function (db) {
    return self._replicateDB(db);
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

Cluster.prototype._replicateSecurity = function (db) {
  var self = this;
  return self._sourceSlouch.security.get(db).then(function (security) {
    return self._targetSlouch.security.set(db, security);
  });
};

Cluster.prototype._replicateRawDB = function (db) {
  return this._sourceSlouch.db.replicate({
    source: this._params.source + '/' + db,
    target: this._params.target + '/' + db
  });
};

Cluster.prototype._replicateDB = function (db) {
  var self = this;
  return self._createDBIfMissing(db).then(function () {
    // Replicate security first so that security is put in place before data is copied over
    return self._replicateSecurity(db);
  }).then(function () {
    return self._replicateRawDB(db);
  });
};

module.exports = Cluster;
