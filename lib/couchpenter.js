var _ = require('underscore'),
  db = require('./db'),
  fsx = require('fs.extra'),
  p = require('path');

/**
 * class Couchpenter
 *
 * @param {String} url: CouchDB URL in format http(s)://user:pass@host:port
 * @param {Object} dbConfig: database config
 * @param {String} dir: base directory of document paths in database config file, default is current working directory
 */
function Couchpenter(url, dbConfig, dir) {
  this.url = url || 'http://localhost:5984';
  this.dbConfig = dbConfig || {};
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

/**
 * Execute database tasks in a series order.
 *
 * @param {Array} taskNames: the tasks to execute
 * @param {Function} cb: standard cb(err, result) callback
 */
Couchpenter.prototype.task = function (taskNames, cb) {
  var db = new db(this.url, this.config, this.dir);
  async.forEachSeries(taskNames, function (taskName, cb) {
    db[taskName](cb);
  }, cb);
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