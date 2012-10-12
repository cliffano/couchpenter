var _ = require('underscore'),
  async = require('async'),
  bag = require('bagofholding'),
  db = require('./db'),
  fs = require('fs'),
  fsx = require('fs.extra'),
  p = require('path');

/**
 * Get database names from config keys.
 *
 * @param {Object} dbSetup: database config
 * @return {Array} an array of database names
 */
function _databases(dbSetup) {
  return _.keys(dbSetup);
}

/**
 * Check each document:
 * - if it's an object, leave as-is
 * - if it's a json file then assign the content of the file as the document
 * - otherwise assume it's a module and require it
 * Location of file and module is based on the configured dir.
 *
 * @param {Object} dbSetup: database config
 * @return {Array} an array of database names
 */
function _docs(dbSetup, dir) {
  _.keys(dbSetup).forEach(function (dbName) {
    for (var i = 0, ln = dbSetup[dbName].length; i < ln; i += 1) {
      var item = dbSetup[dbName][i];
      if (_.isString(item)) {
        if (item.match(/\.json$/)) {
          dbSetup[dbName][i] = JSON.parse(fs.readFileSync(p.join(dir, item)));
        } else {
          dbSetup[dbName][i] = require(p.join(dir, item));
        }
      }
    }
  });
  return dbSetup;
}

/**
 * class Couchpenter
 *
 * @param {String} url: CouchDB URL in format http(s)://user:pass@host:port
 * @param {String} opts: optional settings
 */
function Couchpenter(url, opts) {
  this.url = url || 'http://localhost:5984';
  this.opts = opts || {};
  if (opts) {
    this.opts.setupFile = opts.setupFile || 'couchpenter.json';
    this.opts.dir = opts.dir || process.cwd();
    this.opts.prefix = opts.prefix;
    this.opts.dbSetup = opts.dbSetup;
  }
}

/**
 * Create a sample couchpenter.json setup file in current directory.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.init = function (cb) {
  console.log('Creating sample setup file: couchpenter.json');
  fsx.copy(p.join(__dirname, '../examples/couchpenter.json'), 'couchpenter.json', cb);
};

/**
 * Execute database tasks in a series order.
 *
 * @param {Array} taskNames: the tasks to execute
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.task = function (taskNames, cb) {  
  var dbSetup = this.opts.dbSetup || JSON.parse(bag.cli.readCustomConfigFileSync(this.opts.setupFile)),
    _db = new db(this.url, dbSetup, this.dir),
    tasks = [],
    self = this;

  if (self.opts.prefix) {
    _.keys(dbSetup).forEach(function (dbName) {
      dbSetup[self.opts.prefix + dbName] = dbSetup[dbName];
      delete dbSetup[dbName];
    });
  }

  taskNames.forEach(function (taskName) {
    tasks.push(function (cb) {
      var data = (taskName.match(/Databases$/)) ? 
        _databases(dbSetup) :
        _docs(dbSetup, self.opts.dir);
      _db[taskName](data, cb);
    });
  });
  async.series(tasks, cb);
};

/**
 * Set up databases and documents.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.setUp = function (cb) {
  this.task(['setUpDatabases', 'setUpDocuments'], cb);
};

/**
 * Delete databases and documents.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.tearDown = function (cb) {
  this.task(['tearDownDatabases'], cb);
};

/**
 * Delete databases and documents, then set up databases and documents.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.reset = function (cb) {
  this.task(['tearDownDatabases', 'setUpDatabases', 'setUpDocuments'], cb);
};

/**
 * Delete documents, then set up documents.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.resetDocuments = function (cb) {
  this.task(['tearDownDocuments', 'setUpDocuments'], cb);
};

module.exports = Couchpenter;
