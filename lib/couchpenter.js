var _ = require('underscore'),
  db = require('./db'),
  fsx = require('fs.extra'),
  p = require('path');

/**
 * class Couchpenter
 *
 * @param {String} url: CouchDB URL in format http(s)://user:pass@host:port
 * @param {Object} opts: options { dir: , logEnabled: }. Default dir is current working directory, default logEnabled is false
 */
function Couchpenter(url, opts) {
  this.url = this.url || 'http://localhost:5984';

  // backward compatibility, v0.0.7 or older accepts dir String as second arg
  if (opts && _.isString(opts)) {
    this.opts = {};
  } else {
    this.opts = opts || {};
    this.opts.dir = this.opts.dir || process.cwd();
  }
  this.opts.logEnabled = this.opts.logEnabled || false;
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

/**
 * Execute database tasks in a series order.
 *
 * @param {Array} taskNames: the tasks to execute
 * @param {Object} dbConfig: database config
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.do = function (taskNames, dbConfig, cb) {
  var db = new db(this.url, dbConfig, this.dir),
    tasks = [];

  taskNames.forEach(function (taskName) {
    tasks.push(function (cb) {
      db[taskName](cb);
    });
  });

  async.series(tasks, cb);
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