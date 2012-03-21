var async = require('async'),
  Config = require('./config').Config,
  Db = require('./db').Db;

function Couchpenter() {
  
  var config = new Config();

  function init(dir, cb) {
    config.write(dir, cb);
  }

  function setUp(dbUrl, configFile, cb) {
    var conf = config.read(configFile),
      db = new Db(dbUrl);
    async.series([
      function (cb) {
        db.setDatabases(conf.databases, cb);
      },
      function (cb) {
        db.setDocuments(conf.documents, cb);
      }
    ], cb);
  }

  return {
    init: init,
    setUp: setUp
  };
}

exports.Couchpenter = Couchpenter;