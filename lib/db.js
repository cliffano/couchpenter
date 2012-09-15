var _ = require('underscore'),
  async = require('async'),
  nano = require('nano');

/**
 * Get an array of existing and inexisting databases.
 *
 * @param {Object} couch: nano instance
 * @param {Array} dbNames: name of databases
 * @param {Function} successCb: callback when there is no error, identifying which databases exist and which ones don't
 * @param {Function} errorCb: callback for handling error while getting a list of existing databases
 */
function _databases(couch, dbNames, successCb, errorCb) {
  couch.db.list(function (err, result) {
    if (err) {
      errorCb(err);
    } else {
      var exist = _.intersection(dbNames, result),
        inexist = _.difference(dbNames, result);
      successCb(exist, inexist);
    }
  });
}

/**
 * Fetch the documents for all databases specified in the setup.
 *
 * @param {Object} couch: nano instance
 * @param {Object} dbSetup: database setup, keys are database names, values are documents
 * @param {Function} docsCb: callback for handling document processing
 * @param {Function} cb: main callback, handles error while fetching documents, and also passed to document processing for handling any further error
 */
function _documents(couch, dbSetup, docsCb, cb) {

  var tasks = [];
  _.keys(dbSetup).forEach(function (dbName) {
    tasks.push(function (cb) {
      var all = dbSetup[dbName];
      // TODO: handle bad docs with no _id
      couch.use(dbName).fetch({ keys: _.pluck(all, '_id') }, {}, function (err, result) {
        if (err) {
          cb(err);
        } else {
          var exist = {},
            inexist = {};

          // set existing docs with the search result docs
          if (result.rows) {
            var lookup = _.reduce(all, function (memo, doc) {
              memo[doc._id] = doc;
              return memo;
            }, {});
            result.rows.forEach(function (row) {
              if (row.doc) {
                exist[row.key] = lookup[row.key];
                exist[row.key]._rev = row.doc._rev;
              }
            });
          }

          // set inexisting docs with the delta of all and existing docs
          all.forEach(function (doc) {
            if (!exist[doc._id]) {
              inexist[doc._id] = doc;
            }
          });

          docsCb(dbName, exist, inexist, cb);
        }
      });
    });
  });

  async.parallel(tasks, function (err, results) {
    var statuses = {};
    if (!err) {
      results.forEach(function (result) {
        _.extend(statuses, result);
      });
    }
    cb(err, statuses);
  });
}

/**
 * class Db
 *
 * @param {String} url: CouchDB instance URL in format http(s)://user:pass@host:port
 */
function Db(url) {
  this.couch = nano(url);
}

/**
 * Create inexisting databases, ignore existing databases.
 *
 * @param {Array} dbNames: name of databases
 * @param {Function} cb: standard cb(err, result) callback
 *                       result contain information of which database names were created and ignored
 */
Db.prototype.setUpDatabases = function (dbNames, cb) {
  var self = this;
  _databases(this.couch, dbNames, function (exist, inexist) {
    var tasks = [];
    inexist.forEach(function (dbName) {
      tasks.push(function (cb) {
        self.couch.db.create(dbName, cb);
      });
    });
    async.parallel(tasks, function (err, results) {
      cb(err, {
        'Ignored databases (already exist)': exist,
        'Created databases': inexist
      });
    });
  }, cb);
};

/**
 * Delete existing databases, ignore inexisting databases.
 *
 * @param {Array} dbNames: name of databases
 * @param {Function} cb: standard cb(err, result) callback
 *                       result contain information of which database names were deleted and ignored
 */
Db.prototype.tearDownDatabases = function (dbNames, cb) {
  var self = this;
  _databases(this.couch, dbNames, function (exist, inexist) {
    var tasks = [];
    exist.forEach(function (dbName) {
      tasks.push(function (cb) {
        self.couch.db.destroy(dbName, cb);
      });
    });
    async.parallel(tasks, function (err, results) {
      cb(err, {
        'Ignored databases (do not exist)': inexist,
        'Deleted databases': exist
      });
    });
  }, cb);
};

/**
 * Create inexisting documents, ignore existing documents.
 *
 * @param {Object} dbSetup: database setup, keys are database names, values are documents
 * @param {Function} cb: standard cb(err, result) callback
 *                       result contain information of which documents were created and ignored
 */
Db.prototype.setUpDocuments = function (dbSetup, cb) {
  var self = this;

  _documents(this.couch, dbSetup, function (dbName, exist, inexist, cb) {

    var status = {};
    status['Updated documents (already exist) in database ' + dbName] = (exist) ? _.pluck(exist, '_id') : [];
    status['Created documents in database ' + dbName] = (inexist) ? _.pluck(inexist, '_id') : [];

    var all = _.values(exist).concat(_.values(inexist));
    if (!_.isEmpty(all)) {
      self.couch.use(dbName).bulk({ docs: all }, {}, function (err, result) {
        cb(err, status);
      });
    } else {
      cb(null, status);
    }
  }, cb);
};

/**
 * Delete existing documents, ignore inexisting documents.
 *
 * @param {Object} dbSetup: database setup, keys are database names, values are documents
 * @param {Function} cb: standard cb(err, result) callback
 *                       result contain information of which documents were deleted and ignored
 */
Db.prototype.tearDownDocuments = function (dbSetup, cb) {
  var self = this;

  _documents(this.couch, dbSetup, function (dbName, exist, inexist, cb) {

    var status = {};
    status['Ignored documents (do not exist) in database ' + dbName] = (inexist) ? _.pluck(inexist, '_id') : [];
    status['Deleted documents in database ' + dbName] = (exist) ? _.pluck(exist, '_id') : [];

    if (!_.isEmpty(exist)) {
      _.keys(exist).forEach(function (key) {
        exist[key]._deleted = true;
      });
      self.couch.use(dbName).bulk({ docs: _.values(exist) }, {}, function (err, result) {
        cb(err, status);
      });
    } else {
      cb(null, status);
    }
  }, cb);
};

module.exports = Db;