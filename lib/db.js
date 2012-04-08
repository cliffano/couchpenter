var _ = require('underscore'),
  async = require('async'),
  fs = require('fs'),
  nano = require('nano'),
  p = require('path'),
  util = require('util');

function Db(url, conf, dir) {

  var couch = nano(url);

  function _databases(cb) {
    couch.db.list(function (err, result) {

      if (err) {
        cb(err);
      } else {
        var names = _.keys(conf),
          exist = _.intersection(names, result),
          inexist = _.difference(names, result);
        cb(exist, inexist);
      }
    });
  }

  // set up CouchDB databases
  // - display already existing databases
  // - create inexisting databases
  function setUpDatabases(cb) {
    console.log('Setting up databases');
    _databases(function (exist, inexist) {

      // log existing database names
      if (!_.isEmpty(exist)) {
        console.log('- databases already exist: ' + exist);  
      }
      
      // nothing to create
      if (_.isEmpty(inexist)) {
        cb(null, inexist);
      
      // create inexisting databases
      } else {
        var tasks = {};
        inexist.forEach(function (item) {
          tasks[item] = function (cb) {
            console.log('- creating database: ' + item);
            couch.db.create(item, cb);
          };
        });
        async.series(tasks, cb);
      }      
    });
  }

  // tearing down CouchDB databases
  // - display inexisting databases
  // - delete existing databases
  function tearDownDatabases(cb) {
    console.log('Tearing down databases');
    _databases(function (exist, inexist) {

      // log inexisting database names
      if (!_.isEmpty(inexist)) {
        console.log('- databases do not exist: ' + inexist);  
      }
      
      // nothing to delete
      if (_.isEmpty(exist)) {
        cb(null, exist);
      
      // create existing databases
      } else {
        var tasks = {};
        exist.forEach(function (item) {
          tasks[item] = function (cb) {
            console.log('- deleting database: ' + item);
            couch.db.destroy(item, cb);
          };
        });
        async.series(tasks, cb);
      }
    });
  }

  function _documents(filter, cb) {

    // prepare only the valid documents
    function _prepareDocs(arr) {
      var docs = [];

      arr.forEach(function (item) {
        if (typeof item === 'string') {
          try {
            if (item.match(/\.json$/)) {
              docs.push(JSON.parse(fs.readFileSync(p.join(dir, item))));
            } else {
              docs.push(require(p.join(dir, item)));
            }
          } catch (e) {
            console.error('- ignoring invalid document file ' + util.inspect(item) + ', error: ' + e.message);
          }
        } else if (typeof item === 'object') {
          docs.push(item);
        } else {
          console.warn('- ignoring invalid document: ' + util.inspect(item) + ', for having type ' + (typeof item));
        }
      });

      // filter out documents without _id property
      docs = _.filter(docs, function (item) {
        if (_.isEmpty(item._id)) {
          console.warn('- ignoring invalid document: ' + util.inspect(item) + ', for not having _id property');
        }
        return !_.isEmpty(item._id);
      });

      return docs;
    }

    // convert result rows array to documents map for easy lookup
    function _rows2Map(rows) {
      var map = {};
      rows = rows || [];
      
      rows.forEach(function (row) {
        map[row.key] = row.doc;
      });
      return map;
    }

    var tasks = {};
    _.keys(conf).forEach(function (db) {
      tasks[db] = function (cb) {

        var docs = _prepareDocs(conf[db]);
        couch.use(db).fetch({ keys: _.pluck(docs, '_id') }, {}, function (err, result) {
          var existingDocs = _rows2Map(result.rows),
            toProcess = filter(db, docs, existingDocs);
          if (!_.isEmpty(toProcess)) {
            couch.use(db).bulk({ docs: toProcess }, {}, cb);
          } else {
            cb();
          }
        });
      };
    });
    async.series(tasks, cb);
  }

  // set up documents
  // - create new documents
  // - update existing documents (revision number will be changed afterward)
  function setUpDocuments(cb) {
    console.log('Setting up documents');

    _documents(function (db, docs, existingDocs) {

      // set revision of already existing documents
      docs.forEach(function (doc) {
        if (existingDocs[doc._id]) {
          doc._rev = existingDocs[doc._id]._rev;
        }
      });

      var toCreate = _.pluck(_.filter(docs, function(item) { return _.isEmpty(item._id); }), '_id'),
        toUpdate = _.pluck(_.filter(docs, function(item) { return !_.isEmpty(item._id); }), '_id');
      
      // log document IDs to create/update
      if (!_.isEmpty(toCreate)) {
        console.log('- creating documents: ' + toCreate + '; in database: ' + db);
      }
      if (!_.isEmpty(toUpdate)) {
        console.log('- updating documents: ' + toUpdate + '; in database: ' + db);
      }
      if (_.isEmpty(docs)) {
        console.log('- no document to set up in database: ' + db);
      }

      return docs;
    }, cb);
  }

  // tear down documents
  // - log inexisting document
  // - delete existing documents
  function tearDownDocuments(cb) {
    console.log('Tearing down documents');

    _documents(function (db, docs, existingDocs) {

      // prepare documents to delete, ignore inexisting docs
      var toDelete = [];
      docs.forEach(function (doc) {
        if (existingDocs[doc._id]) {
          toDelete.push({
            _id: existingDocs[doc._id]._id,
            _rev: existingDocs[doc._id]._rev,
            _deleted: true
          });
        } else {
          console.log('- ignoring inexisting document: ' + docs._id + '; in database: ' + db);
        }
      });

      if (!_.isEmpty(toDelete)) {
        console.log('- deleting documents: ' + _.pluck(toDelete, '_id') + '; in database: ' + db);
      }

      return toDelete;
    }, cb);
  }

  return {
    setUpDatabases: setUpDatabases,
    tearDownDatabases: tearDownDatabases,
    setUpDocuments: setUpDocuments,
    tearDownDocuments: tearDownDocuments
  };
}

exports.Db = Db;
