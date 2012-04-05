var async = require('async'),
  cly = require('cly'),
  Db = require('./db').Db;

function Couchpenter() {

  function setUp(dbUrl, configFile, dir, cb) {
    var db = new Db(dbUrl, cly.readJsonFile(configFile));

    async.series([
      function (cb) {
        db.setUpDatabases(cb);
      },
      function (cb) {
        db.setUpDocuments(dir, cb);
      }], cb);
  }

  function tearDown(dbUrl, configFile, dir, cb) {
    var db = new Db(dbUrl, cly.readJsonFile(configFile));
    db.tearDownDatabases(cb);
  }

  return {
    setUp: setUp,
    tearDown: tearDown
  };
}

exports.Couchpenter = Couchpenter;