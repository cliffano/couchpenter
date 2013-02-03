var _ = require('underscore'),
  async = require('async'),
  nano = require('nano'),
  util = require('util');

/**
 * class Db
 * CouchDB operation errors are included in results to allow multiple operations
 * to resume even though there is an error encountered on at least one of the operations.
 * (e.g. database delete should not cause an error even though the database already exists or not)
 * Non-CouchDB errors (e.g. connection error) will still be passed via callback error.
 *
 * @param {String} url: CouchDB instance URL in format http(s)://user:pass@host:port
 */
function Db(url) {
  this.couch = nano(url);
}

/**
 * Create inexisting databases.
 *
 * @param {Array} dbNames: name of databases
 * @param {Function} cb: standard cb(err, result) callback
 *                       result contain information of which database names were created and ignored
 */
Db.prototype.createDatabases = function (dbNames, cb) {
  var self = this,
    tasks = [];
  dbNames.forEach(function (dbName) {
    function task(cb) {
      self.couch.db.create(dbName, self._handle(cb, {
        dbName: dbName,
        message: 'created'
      }));
    }
    tasks.push(task);
  });
  async.parallel(tasks, cb);
};

/**
 * Delete existing databases.
 *
 * @param {Array} dbNames: name of databases
 * @param {Function} cb: standard cb(err, result) callback
 *                       result contain information of which database names were deleted and ignored
 */
Db.prototype.removeDatabases = function (dbNames, cb) {
  var self = this,
    tasks = [];
  dbNames.forEach(function (dbName) {
    function task(cb) {
      self.couch.db.destroy(dbName, self._handle(cb, {
        dbName: dbName,
        message: 'deleted'
      }));
    }
    tasks.push(task);
  });
  async.parallel(tasks, cb);
};

/**
 * Delete unknown databases (those not configured in setup file).
 * NOTE: in CouchDB v1.2.0, _users database deletion does not trigger any error, but the _users database can't be deleted
 *
 * @param {Array} dbNames: name of databases
 * @param {Function} cb: standard cb(err, result) callback
 *                       result contain information of which database names were deleted and ignored
 */
Db.prototype.cleanDatabases = function (dbNames, cb) {
  var self = this;
  this.couch.db.list(function (err, result) {
    if (err) {
      cb(err);
    } else {
      var dbNamesToClean = [];
      result.forEach(function (dbName) {
        if (dbNames.indexOf(dbName) === -1) {
          dbNamesToClean.push(dbName);
        }
      });
      self.removeDatabases(dbNamesToClean, cb);
    }
  });
};

/**
 * Create inexisting documents, leave existing documents untouched as conflict error.
 *
 * @param {Object} dbSetup: database setup, keys are database names, values are documents
 * @param {Function} cb: standard cb(err, result) callback
 *                       result contain information of which documents were created and updated
 */
Db.prototype.createDocuments = function (dbSetup, cb) {
  var self = this,
    tasks = [];
  _.keys(dbSetup).forEach(function (dbName) {
    dbSetup[dbName].forEach(function (doc) {
      function task(cb) {
        self.couch.use(dbName).insert(doc, self._handle(cb, {
          dbName: dbName,
          docId: doc._id,
          message: 'created'
        }));
      }
      tasks.push(task);
    });
  });
  async.parallel(tasks, cb);
};

/**
 * Create inexisting documents, update existing documents.
 *
 * @param {Object} dbSetup: database setup, keys are database names, values are documents
 * @param {Function} cb: standard cb(err, result) callback
 *                       result contain information of which documents were created and updated
 */
Db.prototype.saveDocuments = function (dbSetup, cb) {
  const CONFLICT = 409;
  var self = this,
    tasks = [];
  _.keys(dbSetup).forEach(function (dbName) {
    dbSetup[dbName].forEach(function (doc) {
      function task(cb) {
        function _errorCb(err, result) {
          function _successCb(err, result) {
            doc._rev = result._rev;
            self.couch.use(dbName).insert(doc, self._handle(cb, {
              dbName: dbName,
              docId: doc._id,
              message: 'updated'
            }));
          }
          self.couch.use(dbName).get(doc._id, self._handle(cb, {
            dbName: dbName,
            docId: doc._id,
            successCb: _successCb
          }));
        }
        self.couch.use(dbName).insert(doc, self._handle(cb, {
          dbName: dbName,
          docId: doc._id,
          message: 'created',
          errorCb: _errorCb,
          errorCode: CONFLICT
        }));
      }
      tasks.push(task);
    });
  });
  async.parallel(tasks, cb);
};

/**
 * Delete existing documents.
 *
 * @param {Object} dbSetup: database setup, keys are database names, values are documents
 * @param {Function} cb: standard cb(err, result) callback
 *                       result contain information of which documents were deleted and ignored
 */
Db.prototype.removeDocuments = function (dbSetup, cb) {
  var self = this,
    tasks = [];
  _.keys(dbSetup).forEach(function (dbName) {
    dbSetup[dbName].forEach(function (doc) {
      function task(cb) {
        function _successCb(err, result) {
          self.couch.use(dbName).destroy(result._id, result._rev, self._handle(cb, {
            dbName: dbName,
            docId: doc._id,
            message: 'deleted'
          }));
        }
        self.couch.use(dbName).get(doc._id, self._handle(cb, {
          dbName: dbName,
          docId: doc._id,
          successCb: _successCb
        }));
      }
      tasks.push(task);
    });
  });
  async.parallel(tasks, cb);
};

Db.prototype._handle = function (cb, opts) {
  var self = this;

  function _result(err, dbName, docId, message) {
    var id = util.format('%s%s%s', dbName, (docId) ? '/' : '', docId || '');
    message = message || util.format('%s (%s)', err.error, err.status_code);
    return { id: id, error: err, message: message };
  }

  return function (err, result) {
    if (err) {
      if (opts.errorCb && err.status_code === opts.errorCode) {
        opts.errorCb(err, result);
      } else if (err.status_code) {
        cb(null, _result(err, opts.dbName, opts.docId));
      } else {
        cb(err);
      }
    } else {
      if (opts.successCb) {
        opts.successCb(err, result);
      } else {
        cb(null, _result(null, opts.dbName, opts.docId, opts.message));
      }
    }
  };
};

module.exports = Db;