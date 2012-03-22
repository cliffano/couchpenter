var _ = require('underscore'),
  async = require('async'),
  fs = require('fs'),
  nano = require('nano');

function Db(url) {

  var couch = nano(url);

  // set up CouchDB databases
  // - display already existing databases
  // - create inexisting databases
  function setDatabases(names, cb) {
    console.log('Preparing databases');

    couch.db.list(function (err, result) {

      if (err) {
        cb(err);

      } else {

        var exist = _.intersection(names, result),
          toCreate = _.difference(names, result);
        
        // log existing database names
        if (!_.isEmpty(exist)) {
          console.log('- databases already exist: ' + exist);  
        }
        
        // nothing to create
        if (!_.isEmpty(toCreate)) {
          cb(null, exist);
        
        // create inexisting databases
        } else {
          var tasks = {};
          toCreate.forEach(function (item) {
            tasks[item] = function (cb) {
              console.log('- creating database: ' + item);
              couch.db.create(item, cb);
            };
          });
          async.series(tasks, cb);
        }
      }
    });
  }

  // set up CouchDB documents
  // - create new documents
  // - update existing documents (revision number will be changed afterward)
  function setDocuments(dbDocs, cb) {
    console.log('Preparing documents');

    // prepare only the valid documents
    function _prepareDocs(arr) {
      var docs = [];

      arr.forEach(function (item) {
        if (typeof item === 'string') {
          // TODO construct document either with require or json parse
          try {
            docs.push(JSON.parse(fs.readFileSync(item)));
          } catch (e) {
            console.error('- ignoring invalid document file ' + item + ', error: ' + e.message);
          }
        } else if (typeof item === 'object') {
          docs.push(item);
        } else {
          console.warn('- ignoring invalid document: ' + doc + ', for having type ' + (typeof doc));
        }
      });

      // filter out documents without _id property
      docs = _.filter(docs, function (item) {
        if (_.isEmpty(item._id)) {
          console.warn('- ignoring invalid document: ' + item + ', for not having _id property');
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
    _.keys(dbDocs).forEach(function (db) {
      tasks[db] = function (cb) {

        var docs = _prepareDocs(dbDocs[db]);
        couch.use(db).fetch({ doc_names: _.pluck(docs, '_id') }, {}, function (err, result) {
          var existingDocs = _rows2Map(result.rows);

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
            console.log('- creating documents: ' + toCreate + ' - in database: ' + db);
          }
          if (!_.isEmpty(toUpdate)) {
            console.log('- updating documents: ' + toUpdate + ' - in database: ' + db);
          }

          couch.use(db).bulk({ docs: docs }, {}, cb);
        });
      };
    });
    async.series(tasks, cb);
  }

  return {
    setDatabases: setDatabases,
    setDocuments: setDocuments
  };
}

exports.Db = Db;