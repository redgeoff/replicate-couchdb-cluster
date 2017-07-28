'use strict';

var Promise = require('sporks/scripts/promise'),
  Cluster = require('../scripts'),
  sporks = require('sporks'),
  Slouch = require('couch-slouch');

describe('node and browser', function () {

  var slouch = null,
    id = 0,
    cluster = null;

  var data = {
    test_db1: [{
        _id: '1',
        foo: 'bar'
      },
      {
        _id: '2',
        yar: 'nar'
      },
    ],
    test_db2: [{
        _id: '3',
        foo: 'star'
      },
      {
        _id: '4',
        yar: 'raar'
      },
    ]
  };

  var createDocs = function (db, docs) {
    var promises = [];
    docs.forEach(function (doc) {
      promises.push(slouch.doc.create(db, doc));
    });
    return Promise.all(promises);
  };

  var createDatabase = function (db, docs) {
    return slouch.db.create(db).then(function () {
      return createDocs(db, docs);
    });
  };

  var createData = function () {
    var promises = [];
    sporks.each(data, function (docs, db) {
      promises.push(createDatabase(db + '_' + id, docs));
    });
    return Promise.all(promises);
  };

  var destroyData = function () {
    var promises = [];
    sporks.each(data, function (docs, db) {
      promises.push(slouch.db.destroy(db + '_' + id));
    });
    return Promise.all(promises);
  };

  beforeEach(function () {
    slouch = new Slouch('http://admin:admin@localhost:5984');

    // Use a unique id as back to back creation/deletion of the same DBs can lead to problems
    id++;

    return createData();
  });

  afterEach(function () {
    return destroyData();
  });

  it('should replicate', function () {
    var cluster = new Cluster({
      source: 'http://admin:admin@localhost:5984',
      target: 'http://admin:admin@localhost:5984'
    });
    return cluster.replicate();
  });

  // it('should skip when replicating', function () {
  //   var cluster = new Cluster({
  //     source: 'http://admin:admin@localhost:5984',
  //     target: 'http://admin:admin@localhost:5984',
  //     skip: ['_global_changes', '_replicator', '_users']
  //   });
  //   return cluster.replicate();
  // });

  // it('should support custom concurrency when replicating', function () {
  //
  // });

});
