var async = require('async'),
  Config = require('./config').Config,
  Db = require('./db').Db;

function Couchpenter() {
  
  var config = new Config();

  function init(dir, cb) {
    config.write(dir, cb);
  }

  function setUp(dbUrl, configFile, moduleDir, cb) {
    var conf = config.read(configFile),
      db = new Db(dbUrl),
      tasks = [];

    if (conf.databases) {
      tasks.push(function (cb) {
        db.setDatabases(conf.databases, cb);
      });
    }

    if (conf.documents) {
      tasks.push(function (cb) {
        db.setDocuments(conf.documents, moduleDir, cb);
      });
    }

    async.series(tasks, cb);
  }

  return {
    init: init,
    setUp: setUp
  };
}

exports.Couchpenter = Couchpenter;