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
 * @param {Object} dbConfig: database config
 * @return {Array} an array of database names
 */
function _databases(dbConfig) {
  return _.keys(dbConfig);
}

/**
 * Check each document:
 * - if it's an object, leave as-is
 * - if it's a json file then assign the content of the file as the document
 * - otherwise assume it's a module and require it
 * Location of file and module is based on the configured dir.
 *
 * @param {Object} dbConfig: database config
 * @return {Array} an array of database names
 */
function _docs(dbConfig, dir) {
  _.keys(dbConfig).forEach(function (dbName) {
    for (var i = 0, ln = dbConfig[dbName].length; i < ln; i += 1) {
      var item = dbConfig[dbName][i];
      if (_.isString(item)) {
        if (item.match(/\.json$/)) {
          dbConfig[dbName][i] = JSON.parse(fs.readFileSync(p.join(dir, item)));
        } else {
          dbConfig[dbName][i] = require(p.join(dir, item));
        }
      }
    }
  });
  return dbConfig;
}

/**
 * class Couchpenter
 *
 * @param {String} url: CouchDB URL in format http(s)://user:pass@host:port
 * @param {Object} configFile: JSON file containing Couchpenter data config, default: couchpenter.json
 * @param {String} opts: optional settings, for <= v0.0.7 compatibility, accept String containing base directory of document paths in database config file, default is current working directory
 */
function Couchpenter(url, configFile, opts) {
  this.url = url || 'http://localhost:5984';
  this.configFile = configFile || 'couchpenter.json';

  if (opts) {
    if (_.isString(opts)) {
      this.opts = {
        dir: opts
      };
    } else {
      this.opts = {
        dir: opts.dir || process.cwd(),
        prefix: opts.prefix
      };
    }
  } else {
    this.opts = {};
  }
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
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.task = function (taskNames, cb) {  
  var dbConfig = JSON.parse(bag.cli.readCustomConfigFileSync(this.configFile)),
    _db = new db(this.url, dbConfig, this.dir),
    tasks = [],
    self = this;

  if (this.opts.prefix) {
    _.keys(dbConfig).forEach(function (dbName) {
      dbConfig[this.opts.prefix + dbName] = dbConfig[dbName];
      delete dbConfig[dbName];
    });
  }

  taskNames.forEach(function (taskName) {
    tasks.push(function (cb) {
      var data = (taskName.match(/Databases$/)) ? 
        _databases(dbConfig) :
        _docs(dbConfig, self.opts.dir);
      _db[taskName](data, cb);
    });
  });
  async.series(tasks, cb);
};

/**
 * Set up databases and documents.
 * Convenient function for programmatical usage of Couchpenter.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.setUp = function (cb) {
  this.task(['setUpDatabases', 'setUpDocuments'], cb);
};

/**
 * Delete databases and documents.
 * Convenient function for programmatical usage of Couchpenter.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.tearDown = function (cb) {
  this.task(['tearDownDatabases'], cb);
};

module.exports = Couchpenter;