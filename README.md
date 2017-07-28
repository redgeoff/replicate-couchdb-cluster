# replicate-couchdb-cluster

[![Greenkeeper badge](https://badges.greenkeeper.io/redgeoff/replicate-couchdb-cluster.svg)](https://greenkeeper.io/)

[![Circle CI](https://circleci.com/gh/redgeoff/replicate-couchdb-cluster.svg?style=svg&circle-token=29186a9bacd110b627323d86119076539d8b144e)](https://circleci.com/gh/redgeoff/replicate-couchdb-cluster)

A fault-tolerant way to replicate an entire CouchDB cluster


## Installation

    $ npm install -g replicate-couchdb-cluster


## Usage

    Usage: replicate-couchdb-cluster -s source -t target options

      -s source           The URL for the CouchDB cluster from which we will be
                          replicating

      -s target           The URL for the CouchDB cluster to which we will be
                          replicating

    Options:

      -c max-concurrency  The maximum number of concurrent replications. If this
                          value is omitted then the max-concurrency is defaulted
                          to 20.

      -i dbs-to-skip      A comma separated list of DBS to skip

      -a                  Use the target's _replicate API when replicating. This is
                          particularly useful when you are trying to replicate from
                          a remote source to localhost. By default, the source's
                          _replicate API is used.

      -v                  Verbose

    Examples:

      Replicate all DBs on example1.com to example2.com:

        $ replicate-couchdb-cluster -s http://example1.com:5984 -t http://example2.com:5984

      Replicate all DBs, except the _users and _replicator DBs:

        $ replicate-couchdb-cluster -s http://example1.com:5984 -t http://example2.com:5984 \
                                    -i _users,replicator

      Replicate all DBs using SSL and authentication:

        $ replicate-couchdb-cluster -s https://admin1:secrect1@example1.com:6984 \
                                    -t https://admin2:secrect2@example2.com:6984

      Replicate all DBs from a remote source to a local source:

        $ replicate-couchdb-cluster -s https://admin1:secrect1@example1.com \
                                    -t http://localhost:5984
                                    -a

## API

You can also use the API.

Example:

```js
var replicate = require('replicate-couchdb-cluster');

replicate({
  source: https://admin1:secrect1@example1.com:6984,
  target: https://admin2:secrect2@example2.com:6984,
  concurrency: 10,
  skip: ['_users', '_replicator'],
  verbose: true,
  useTargetAPI: true
}).then(function () {
  // Replication done
});
```

## [Testing](TESTING.md)
