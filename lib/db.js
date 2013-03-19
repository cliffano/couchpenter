/*jshint esnext: true */
var _ = require('underscore'),
  async = require('async'),
  bag = require('bagofholding'),
  clone = require('clone'),
  nano = require('nano'),
  util = require('util');

/**
 * class Db
 *
 * CouchDB errors are camouflaged as results to allow multiple operations to resume
 * even though there is an error encountered on at least one of the operations
 * (e.g. database delete should not cause an error regardless whether the database already exists or not).
 * Non-CouchDB errors (e.g. connection error) will still be passed via standard callback error.
 *
 * @param {String} url: CouchDB instance URL in format http(s)://user:pass@host:port
 * @param {Object} opts: optional
 * - nano: for test purpose only, temporary until I find a way to mock required function module using Sinon.js, resort to dependency injection for now
 */
function Db(url, opts) {
  const DEFAULT_INTERVAL = 10000;
  var couchOpts = { url: url },
    envProxy = bag.http.proxy(url);

  if (envProxy) {
    couchOpts.request_defaults = { proxy: envProxy };
  }

  this.couch = (opts && opts.nano ? opts.nano : nano)(couchOpts);
  this.interval = (opts && opts.interval) ? opts.interval : DEFAULT_INTERVAL;
}

/**
 * Create inexisting databases.
 *
 * @param {Array} dbNames: name of databases
 * @param {Function} cb: standard cb(err, result) callback
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
 */
Db.prototype.saveDocuments = function (dbSetup, cb) {
  const CONFLICT = 409;
  var self = this,
    tasks = [];
  _.keys(dbSetup).forEach(function (dbName) {
    dbSetup[dbName].forEach(function (doc) {
      function task(cb) {

        // try to create documents, but with conflict error handling
        function _errorCb(err, result) {

          // if there is a conflict error, retrieve the document's revision first
          function _successCb(err, result) {

            // use the revision to update the existing documents
            // NOTE: it is not impossible that the revision of this document
            // is modified by other operations right before updating, Couchpenter
            // will only try once to avoid any possibility of retrying infinitely.
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
 */
Db.prototype.removeDocuments = function (dbSetup, cb) {
  var self = this,
    tasks = [];
  _.keys(dbSetup).forEach(function (dbName) {
    dbSetup[dbName].forEach(function (doc) {
      function task(cb) {

        // retrieve the document revision and use it to delete the document
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

/**
 * Warm views.
 *
 * @param {Object} dbSetup: database setup, keys are database names, values are documents
 * @param {Function} cb: standard cb(err, result) callback
 */
Db.prototype.warmViews = function (dbSetup, cb) {
  // retrieve no document to keep response size as minimum as possible
  const NO_DOCS = 0;
  var self = this,
    tasks = [];
  _.keys(dbSetup).forEach(function (dbName) {
    dbSetup[dbName].forEach(function (doc) {
      if (doc._id && doc._id.match(/^_design\//) && doc.views) {
        tasks.push(function(cb) {

          var _successCb = self._handle(cb, {
            dbName: dbName,
            docId: doc._id, 
            message: 'warmed ' + _.keys(doc.views).join(', ')
          });

          async.each(_.keys(doc.views), function (viewName, cb) {

            self.couch.use(dbName).view(
              doc._id.replace('_design/', ''),
              viewName,
              { limit: NO_DOCS },
              cb);

          }, _successCb);
        });
      }
    });
  });
  async.parallel(tasks, cb);
};

/**
 * Live deploy view changes
 * https://wiki.apache.org/couchdb/How_to_deploy_view_changes_in_a_live_environment
 *
 * @param {Object} dbSetup: database setup, keys are database names, values are design documents
 * @param {Function} cb: standard cb(err, result) callback
 */
Db.prototype.liveDeployView = function (dbSetup, cb) {
  const POSTFIX = '_new';
  var self = this;

  function _cloneSetup(dbSetup) {
    var _clone = clone(dbSetup);
    
    _.keys(_clone).forEach(function (dbName) {
      _clone[dbName].forEach(function (doc) {
        if (doc._id && doc._id.match(/^_design\//) && doc.views) {
          doc._id = doc._id + POSTFIX;
        } else {
          _clone[dbName].splice(_clone[dbName].indexOf(doc), 1);
        }
      });
    });

    return _clone;
  }

  function _startViewIndexTask(doc, dbName) {
    const NO_DOCS = 0;
    return function (cb) {
      _.keys(doc.views).forEach(function (viewName) {
        self.couch.use(dbName).view(
          doc._id.replace('_design/', ''),
          viewName,
          { limit: NO_DOCS, stale: 'update_after' },
          function(err, result) {}
        );
      });
      cb(null, { message: 'view index has been kicked off' });  
    };
  }

  function _indexProgressTask(doc, dbName) {
    return function (cb) {           
      var inProgress = true;
      async.whilst(
        function () { 
          return inProgress; 
        },
        function (_cb) {
          self.couch.request({
              'db': dbName, 
              'path': doc._id + '/_info' 
            },
            function(err, result) {
              if (!err) {
                inProgress = result.view_index.updater_running;
                console.log('%s - view index updater running: %s', result.name, result.view_index.updater_running);
              } else {
                inProgress = false;
                console.log('%s - %s', doc._id, err);
              }
            }
          );
          setTimeout(_cb, self.interval);
        },
        function (err) {
          cb(err, {});
        }
      );
    };
  }

  function _overwriteOldDesignDocTask(doc, dbName) {
    return function (cb) {
      function headCb(opts) {
        self.couch.use(dbName).copy(
          doc._id,
          doc._id.replace(POSTFIX, ''), 
          { overwrite: opts.update }, 
          cb
        );
      }
      self.couch.use(dbName).head(doc._id.replace(POSTFIX, ''), function(err, _, headers) {
         if (!err) {
          headCb({ update: true });
        } else {
          headCb({ update: false });
        }
      });
    };
  }

  var dbSetupCopy = _cloneSetup(dbSetup),
    seriesTasks = [],
    viewIndexTasks = [], 
    overwriteDocTasks = [], 
    indexProgressTasks = [];

  _.keys(dbSetupCopy).forEach(function (dbName) {
    dbSetupCopy[dbName].forEach(function (doc) {
      viewIndexTasks.push(_startViewIndexTask(doc, dbName));
      indexProgressTasks.push(_indexProgressTask(doc, dbName));
      overwriteDocTasks.push(_overwriteOldDesignDocTask(doc, dbName));
    });

    function _executeSeriesOfTasks(cb) {
      async.series([ 
        function (cb) { self.saveDocuments(dbSetupCopy, cb); }, 
        function (cb) { async.parallel(viewIndexTasks, cb); }, 
        function (cb) { async.parallel(indexProgressTasks, cb); }, 
        function (cb) { async.parallel(overwriteDocTasks, cb); }, 
        function (cb) { self.removeDocuments(dbSetupCopy, cb); }
      ], cb);
    }

    seriesTasks.push(_executeSeriesOfTasks);
  });

  async.parallel(seriesTasks, cb);
};


Db.prototype._handle = function (cb, opts) {
  var self = this;

  // construct result object, the existence of error field indicates whether
  // the result is a success or not
  function _result(err, dbName, docId, message) {
    var result = {
      id: util.format('%s%s%s', dbName, (docId) ? '/' : '', docId || ''),
      message: message || util.format('%s (%s)', err.error, err.status_code)
    };
    if (err) {
      result.error = err;
    }
    return result;
  }

  return function (err, result) {
    if (err) {
      // special status code, delegate to error callback
      if (opts.errorCb && err.status_code === opts.errorCode) {
        opts.errorCb(err, result);
      // CouchDB error is camouflaged as result (status_code field is set by nano)
      } else if (err.status_code) {
        cb(null, _result(err, opts.dbName, opts.docId));
      // standard error (e.g. connection refused) is passed as standard error
      } else {
        cb(err);
      }
    } else {
      // delegate to success callback
      if (opts.successCb) {
        opts.successCb(err, result);
      // standard success
      } else {
        cb(null, _result(null, opts.dbName, opts.docId, opts.message));
      }
    }
  };
};

module.exports = Db;
