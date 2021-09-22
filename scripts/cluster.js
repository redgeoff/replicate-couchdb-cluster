'use strict';

var Slouch = require('couch-slouch'),
  EnhancedRequest = require('couch-slouch/scripts/enhanced-request'),
  squadron = require('squadron'),
  sporks = require('sporks');

// params:
//   source
//   target
//   concurrency
//   skip
//   verbose
//   useTargetAPI
//   debug
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

  EnhancedRequest.LOG_EVERYTHING = this._params.debug;
};

Cluster.prototype._log = function (msg) {
  if (this._params.verbose) {
    console.log(new Date() + ': ' + msg);
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

  // Get the security from the source
  return self._sourceSlouch.security.get(sourceDB).then(function (sourceSecurity) {
    // Get the security from the target
    return self._targetSlouch.security.get(targetDB).then(function (targetSecurity) {
      // Is the security different?
      if (!sporks.isEqual(sourceSecurity, targetSecurity)) {
        // Update the target security
        return self._targetSlouch.security.set(targetDB, sourceSecurity);
      }
    });
  });
};

Cluster.prototype._replicateRawDB = function (sourceDB, targetDB) {
  var slouch = this._params.useTargetAPI ? this._targetSlouch : this._sourceSlouch;
  return slouch.db.replicate({
    source: this._params.source + '/' + encodeURIComponent(sourceDB),
    target: this._params.target + '/' + encodeURIComponent(targetDB)
  });
};

Cluster.prototype._createAndReplicateDB = function (sourceDB, targetDB) {
  var self = this;
  self._log('beginning replication of ' + sourceDB + '...');
  return self._createDBIfMissing(targetDB).then(function () {
    // Replicate security first so that security is put in place before data is copied over
    return self._replicateSecurity(sourceDB, targetDB);
  }).then(function () {
    return self._replicateRawDB(sourceDB, targetDB);
  }).then(function () {
    return self._log('finished replicating ' + sourceDB);
  });
};

Cluster.prototype._replicateDB = function (sourceDB, targetDB) {
  var self = this;
  return this._sourceSlouch.db.exists(sourceDB)
    .then(function (value) {
      if (value === true) {
        return self._createAndReplicateDB(sourceDB, targetDB);
      } else {
        self._log('Database does not exist, skipped replication. Database: ', sourceDB);
      }
    });
};

module.exports = Cluster;
