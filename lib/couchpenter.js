var async = require('async'),
  cly = require('cly'),
  Db = require('./db').Db;

function Couchpenter() {

  function setUp(dbUrl, configFile, dir, cb) {
    var db = new Db(dbUrl, cly.readJsonFile(configFile));

    async.series([
      function (cb) {
        db.setDatabases(cb);
      },
      function (cb) {
        db.setDocuments(dir, cb);
      }], cb);
  }

  return {
    setUp: setUp
  };
}

exports.Couchpenter = Couchpenter;