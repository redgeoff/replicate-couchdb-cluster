'use strict';

var Cluster = require('./cluster');

module.exports = function (params) {
  var cluster = new Cluster(params);
  return cluster.replicate();
};
