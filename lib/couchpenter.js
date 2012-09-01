var _ = require('underscore'),
  db = require('./db'),
  fsx = require('fs.extra'),
  p = require('path');

/**
 * class Couchpenter
 */
function Couchpenter(conf, dir) {
  this.conf = conf || {};
  this.dir = dir || process.cwd();
}

/**
 * Create a sample couchpenter.json configuration file in current directory.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.config = function (cb) {
  console.log('Creating sample configuration file: couchpenter.json');
  fsx.copy(p.join(__dirname, '../examples/couchpenter.json'), 'couchpenter.json', cb);
};

module.exports = Couchpenter;

/*
var async = require('async'),
  cly = require('cly'),
  Db = require('./db').Db;

function Couchpenter(dbUrl, configFile, dir) {

  dbUrl = dbUrl || 'http://localhost:5984';
  configFile = configFile || 'couchpenter.json';
  dir = dir || process.cwd();

  var db = new Db(dbUrl, cly.readJsonFile(configFile), dir);

  function does(taskNames, cb) {

    var tasks = [];
    taskNames.forEach(function (taskName) {
      tasks.push(function (cb) {
        db[taskName](cb);
      });
    });

    async.series(tasks, cb);
  }

  function setUp(cb) {
    does(['setUpDatabases', 'setUpDocuments'], cb);
  }

  function tearDown(cb) {
    does(['tearDownDatabases'], cb);
  }

  return {
    does: does,
    setUp: setUp,
    tearDown: tearDown
  };
}

*/