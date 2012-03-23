var async = require('async'),
  Config = require('./config').Config,
  Db = require('./db').Db;

function Couchpenter() {
  
  var config = new Config();

  function init(dir, cb) {
    config.write(dir, cb);
  }

  function setUp(dbUrl, configFile, dir, cb) {
    var db = new Db(dbUrl, config.read(configFile));

    async.series([
      function (cb) {
        db.setDatabases(cb);
      },
      function (cb) {
        db.setDocuments(dir, cb);
      }], cb);
  }

  return {
    init: init,
    setUp: setUp
  };
}

exports.Couchpenter = Couchpenter;