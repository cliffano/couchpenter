var _ = require('underscore'),
  async = require('async'),
  nano = require('nano');

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

function _documents(couch, dbConfig, docsCb, cb) {

  var tasks = [];
  _.keys(dbConfig).forEach(function (dbName) {
    tasks.push(function (cb) {
      var all = dbConfig[dbName];
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

function Db(url) {
  this.couch = nano(url);
}

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

Db.prototype.setUpDocuments = function (dbConfig, cb) {
  var self = this;

  _documents(this.couch, dbConfig, function (dbName, exist, inexist, cb) {

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

Db.prototype.tearDownDocuments = function (dbConfig, cb) {
  var self = this;

  _documents(this.couch, dbConfig, function (dbName, exist, inexist, cb) {

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