# replicate-couchdb-cluster

[![Greenkeeper badge](https://badges.greenkeeper.io/redgeoff/replicate-couchdb-cluster.svg)](https://greenkeeper.io/) [![Circle CI](https://circleci.com/gh/redgeoff/replicate-couchdb-cluster.svg?style=svg&circle-token=29186a9bacd110b627323d86119076539d8b144e)](https://circleci.com/gh/redgeoff/replicate-couchdb-cluster)

A fault-tolerant way to replicate an entire CouchDB cluster


## Installation

    $ npm install -g replicate-couchdb-cluster


## Usage

    Usage: replicate-couchdb-cluster -s source -t target options

      -s source           The URL for the CouchDB cluster from which we will be
                          replicating

      -t target           The URL for the CouchDB cluster to which we will be
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

      -d                  Debug info such as details of the requests and responses.
                          Useful for determining why long replications are failing.

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

## In a docker container

This can be useful for scheduling a reoccurring backup.

Run the replication in the foreground:

    $ docker run -it \
        -e SOURCE="https://admin1:secrect1@example1.com:6984" \
        -e TARGET="https://admin2:secrect2@example2.com:6984" \
        redgeoff/replicate-couchdb-cluster

Replicate every hour in the background. This will persist through server reboots:

    $ docker run -d --name replicate-couchdb-cluster \
        --restart always \
        -e SOURCE="https://admin1:secrect1@example1.com:6984" \
        -e TARGET="https://admin2:secrect2@example2.com:6984" \
        -e RUN_EVERY_SECS=3600 \
        -e VERBOSE=true \
        redgeoff/replicate-couchdb-cluster

Notes:
- If the replication takes longer than RUN_EVERY_SECS, it will result to running the replications back to back. You can use `RUN_EVERY_SECS=0` if you always want the replication to run continuously.
- You can view the output at `/var/lib/docker/containers/<container id>/<container id>-json.log`

Replicate every day at 23:00 UTC (11 PM). This will persist through server reboots:

    $ docker run -d --name replicate-couchdb-cluster \
        --restart always \
        -e SOURCE="https://admin1:secrect1@example1.com:6984" \
        -e TARGET="https://admin2:secrect2@example2.com:6984" \
        -e RUN_AT="23:00" \
        -e VERBOSE=true \
        redgeoff/replicate-couchdb-cluster

All options:

    $ docker run -d --name replicate-couchdb-cluster \
        --restart always
        -e SOURCE="https://admin1:secrect1@example1.com:6984" \
        -e TARGET="https://admin2:secrect2@example2.com:6984" \
        -e RUN_AT="HH:MM" \
        -e RUN_EVERY_SECS=3600 \
        -e CONCURRENCY=10 \
        -e SKIP="_users,_replicator" \
        -e USE_TARGET_API=1 \
        -e VERBOSE=true \
        -e DEBUG=true \
        redgeoff/replicate-couchdb-cluster

Note: The RUN_AT and RUN_EVERY_SECS options cannot be used simultaneously. RUN_AT will always take precedence over RUN_EVERY_SECS.


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
  useTargetAPI: true,
  debug: true
}).then(function () {
  // Replication done
});
```


## Why?

You may be wondering why you would need such a tool when CouchDB 2 automatically replicates data between nodes:

* We feel it is much safer to have a separate backup of our data in case something happens to our data, e.g. we accidentally delete data, there is a hacking attempt, etc...
* Sometimes you want to replicate a cluster to a different region of the world. (The built-in clustering in CouchDB 2 isn't designed to be used across different regions of the world)
* In rare cases, we have found that CouchDB sometimes corrupts database files and in these rare cases, we've had to restore data from our backups.


## [Testing](TESTING.md)


## [Building](BUILDING.md)
