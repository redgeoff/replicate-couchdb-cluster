'use strict';

var Promise = require('sporks/scripts/promise'),
  Cluster = require('../scripts'),
  sporks = require('sporks'),
  Slouch = require('couch-slouch');

describe('node and browser', function () {

  var slouch = null,
    id = 0;

  var data = {
    test_db1: {
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
    test_db2: {
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
      promises.push(createDatabase(db + '_' + id, data));
    });
    return Promise.all(promises);
  };

  var destroyData = function () {
    var promises = [];
    sporks.each(data, function (data, db) {
      promises.push(slouch.db.destroy(db + '_' + id));
    });
    return Promise.all(promises);
  };

  var docsShouldEql = function (db, docs) {
    var savedDocs = {};
    return slouch.doc.all(db, { include_docs: true }).each(function (item) {
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
      promises.push(dbDataShouldEql(db + '_' + id, data));
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
    return cluster.replicate().then(function () {
      return dataShouldEql();
    });
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
