'use strict';

var Promise = require('sporks/scripts/promise'),
  Cluster = require('../scripts/cluster'),
  replicateCouchDBCluster = require('../scripts'),
  sporks = require('sporks'),
  Slouch = require('couch-slouch'),
  utils = require('./utils');

describe('node and browser', function () {

  // Need to extend timeout for when running on CI
  this.timeout(20000);

  var slouch = null,
    id = 0,
    cluster = null,
    replicatedDBs = null,
    securitiesSet = null,
    differentCluster = false,
    consoleLog = null;

  var data = {
    db1: {
      security: {
        admins: {
          names: ['joe', 'phil'],
          roles: ['boss']
        },
        members: {
          names: ['dave'],
          roles: ['producer', 'consumer']
        }
      },
      docs: [{
          _id: '1',
          foo: 'bar'
        },
        {
          _id: '2',
          yar: 'nar'
        }
      ]
    },
    db2: {
      docs: [{
          _id: '3',
          foo: 'star'
        },
        {
          _id: '4',
          yar: 'raar'
        }
      ]
    }
  };

  var uniqueName = function (dbName) {
    // Use a unique id as back to back creation/deletion of the same DBs can lead to problems
    return 'test_' + id + '_' + dbName;
  };

  var otherClusterName = function (dbName) {
    // Simulate replicating to a different cluster by appending a suffix to the DB name
    return dbName + '_diff_cluster';
  };

  var createDocs = function (db, docs) {
    var promises = [];
    docs.forEach(function (doc) {
      promises.push(slouch.doc.create(db, doc));
    });
    return Promise.all(promises);
  };

  var createDatabase = function (db, data) {
    return slouch.db.create(db).then(function () {
      if (data.security) {
        return slouch.security.set(db, data.security);
      }
    }).then(function () {
      return createDocs(db, data.docs);
    });
  };

  var createData = function () {
    var promises = [];
    sporks.each(data, function (data, db) {
      promises.push(createDatabase(uniqueName(db), data));
    });
    return Promise.all(promises);
  };

  var destroyData = function () {
    return slouch.db.all().each(function (db) {
      if (isTestDB(db)) {
        return slouch.db.destroy(db);
      }
    });
  };

  var docsShouldEql = function (db, docs) {
    var savedDocs = {};
    return slouch.doc.all(db, {
      include_docs: true
    }).each(function (item) {
      // Delete _rev as not important for comparison
      delete item.doc._rev;
      savedDocs[item.doc._id] = item.doc;
    }).then(function () {
      var expDocs = {};
      docs.forEach(function (doc) {
        expDocs[doc._id] = doc;
      });
      savedDocs.should.eql(expDocs);
    });
  };

  var dbDataShouldEql = function (db, data) {
    return Promise.resolve().then(function () {
      if (data.security) {
        return slouch.security.get(db).then(function (security) {
          security.should.eql(data.security);
        });
      }
    }).then(function () {
      return docsShouldEql(db, data.docs);
    });
  };

  var dataShouldEql = function () {
    var promises = [];
    sporks.each(data, function (data, db) {
      db = uniqueName(db);
      db = differentCluster ? otherClusterName(db) : db;
      promises.push(dbDataShouldEql(db, data));
    });
    return Promise.all(promises);
  };

  var isTestDB = function (db) {
    return db.indexOf('test_' + id) !== -1;
  };

  var replicate = function (params) {
    cluster = new Cluster(params);

    // Spy
    var _replicateDB = cluster._replicateDB;
    cluster._replicateDB = function (sourceDB /*, targetDB */ ) {
      var args = sporks.toArgsArray(arguments);

      if (isTestDB(sourceDB)) {
        replicatedDBs.push(sourceDB);

        if (differentCluster) {
          // Fake a different cluster by changing the target DB names
          args[1] = otherClusterName(sourceDB);
        }
      }

      return _replicateDB.apply(this, args);
    };

    // Spy
    var set = cluster._targetSlouch.security.set;
    cluster._targetSlouch.security.set = function (db, security) {
      securitiesSet.push({
        db: db,
        security: security
      });
      return set.apply(this, arguments);
    };

    return cluster.replicate().then(function () {
      return dataShouldEql();
    });
  };

  beforeEach(function () {
    slouch = new Slouch(utils.couchDBURL());

    id = (new Date()).getTime();

    replicatedDBs = [];

    securitiesSet = [];

    differentCluster = false;

    consoleLog = console.log;

    return createData();
  });

  afterEach(function () {
    return destroyData().then(function () {
      console.log = consoleLog;
    });
  });

  it('should replicate', function () {
    return replicate({
      source: utils.couchDBURL(),
      target: utils.couchDBURL()
    }).then(function () {
      replicatedDBs.should.eql([uniqueName('db1'), uniqueName('db2')]);
    });
  });

  it('should replicate with main index', function () {
    // Sanity test
    return replicateCouchDBCluster({
      source: utils.couchDBURL(),
      target: utils.couchDBURL()
    });
  });

  it('should skip when replicating', function () {
    return replicate({
      source: utils.couchDBURL(),
      target: utils.couchDBURL(),
      skip: [uniqueName('db2')]
    }).then(function () {
      replicatedDBs.should.eql([uniqueName('db1')]);
    });
  });

  it('should support custom concurrency when replicating', function () {
    return replicate({
      source: utils.couchDBURL(),
      target: utils.couchDBURL(),
      concurrency: 10
    }).then(function () {
      replicatedDBs.should.eql([uniqueName('db1'), uniqueName('db2')]);
    });
  });

  it('should support synchronization when replicating', function () {
    return replicate({
      source: utils.couchDBURL(),
      target: utils.couchDBURL(),
      concurrency: 1
    }).then(function () {
      replicatedDBs.should.eql([uniqueName('db1'), uniqueName('db2')]);
    });
  });

  it('should replicate to a different cluster', function () {
    differentCluster = true;
    return replicate({
      source: utils.couchDBURL(),
      target: utils.couchDBURL()
    }).then(function () {
      // Sanity check to make sure spy is working for later tests
      securitiesSet.length.should.eql(1);
    });
  });

  it('should replicate with targets api', function () {
    return replicate({
      source: utils.couchDBURL(),
      target: utils.couchDBURL(),
      useTargetAPI: true
    });
  });

  it('should log when verbose on', function () {
    // Mock
    var msg = null;
    console.log = function (_msg) {
      msg = _msg;
    };

    return replicate({
      source: utils.couchDBURL(),
      target: utils.couchDBURL(),
      verbose: true
    }).then(function () {
      (msg === null).should.eql(false);
    });
  });

  it('should not replicate security when it is identical', function () {
    return replicate({
      source: utils.couchDBURL(),
      target: utils.couchDBURL()
    }).then(function () {
      securitiesSet.length.should.eql(0);
    });
  });

  it('should check that the database still exists before calling replicate', function () {
    var createAndReplicatedDB = false;
    cluster._createAndReplicateDB = function () {
      createAndReplicatedDB = true;
    };

    return cluster._replicateDB('aaa', 'db1').then(function () {
      createAndReplicatedDB.should.eql(false);
    });
  });

});
