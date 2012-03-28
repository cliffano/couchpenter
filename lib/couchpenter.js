var async = require('async'),
  Db = require('./db').Db,
  fsp = require('cly').fsp,
  p = require('path');

function Couchpenter() {
  
  function init(dir, cb) {
    fsp.copyDir(p.join(dir, '../examples'), '.', cb);
  }

  function setUp(dbUrl, configFile, dir, cb) {
    var db = new Db(dbUrl, fsp.readJsonFile(configFile));

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