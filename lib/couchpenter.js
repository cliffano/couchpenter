var async = require('async'),
  cly = require('cly'),
  Db = require('./db').Db;

function Couchpenter(dbUrl, configFile, dir) {

  dbUrl = dbUrl || 'http://localhost:5984';
  configFile = configFile || 'couchpenter.json';
  dir = dir || process.cwd();

  var db = new Db(dbUrl, cly.readJsonFile(configFile), dir);

  function does(taskNames, cb) {

    var tasks = [];
    taskNames.forEach(function (taskName) {
      tasks.push(function (cb) {
        db[taskName](cb);
      });
    });

    async.series(tasks, cb);
  }

  function setUp(cb) {
    does(['setUpDatabases', 'setUpDocuments'], cb);
  }

  function tearDown(cb) {
    does(['tearDownDatabases'], cb);
  }

  return {
    does: does,
    setUp: setUp,
    tearDown: tearDown
  };
}

exports.Couchpenter = Couchpenter;