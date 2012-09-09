var bag = require('bagofholding'),
  sandbox = require('sandboxed-module'),
  should = require('should'),
  checks, mocks,
  db;

describe('db', function () {

  function create(checks, mocks) {
    var count = 0;
    checks.nano_create_dbNames = [];
    checks.nano_destroy_dbNames = [];
    return sandbox.require('../lib/db', {
      requires: {
        nano: function (dbUrl) {
          checks.nano_dburl = dbUrl;

          return {
            db: {
              create: function (dbName, cb) {
                checks.nano_create_dbNames.push(dbName);
                cb(
                  mocks.nano_create_err, 
                  mocks.nano_create_results ? mocks.nano_create_results[count++] : undefined
                );
              },
              destroy: function (dbName, cb) {
                checks.nano_destroy_dbNames.push(dbName);
                cb(
                  mocks.nano_destroy_err, 
                  mocks.nano_destroy_results ? mocks.nano_destroy_results[count++] : undefined
                );
              },
              list: function (cb) {
                cb(
                  mocks.nano_list_err, 
                  mocks.nano_list_results ? mocks.nano_list_results[count++] : undefined
                );
              }
            },
            use: function (dbName) {
              checks.nano_use_dbname = dbName;
              var count = 0;
              return {
                bulk: function (opts, cb) {
                  checks.nano_bulk_opts = opts;
                  cb(
                    mocks.nano_bulk_err, 
                    mocks.nano_bulk_results ? mocks.nano_bulk_results[count++] : undefined
                  );                  
                },
                fetch: function (keys, opts, cb) {
                  checks.nano_fetch_keys = keys;
                  checks.nano_fetch_opts = opts;
                  cb(
                    mocks.nano_fetch_err, 
                    mocks.nano_fetch_results ? mocks.nano_fetch_results[count++] : undefined
                  );
                }
              };
            }
          };
        }
      },
      globals: {}
    });
  }

  beforeEach(function () {
    checks = {};
    mocks = {};
  });

  describe('setUpDatabases', function () {

    it('should pass error when db list gives an error', function (done) {
      mocks.nano_list_err = new Error('someerror');
      db = new (create(checks, mocks))('http://localhost:5984');
      db.setUpDatabases(['db1', 'db2'], function (err, results) {
        checks.db_setupdatabases_err = err;
        checks.db_setupdatabases_results = results;
        done();
      });
      checks.db_setupdatabases_err.message.should.equal('someerror');
      should.not.exist(checks.db_setupdatabases_results);
    });

    it('should create inexisting databases', function (done) {
      mocks.nano_list_results = [];
      db = new (create(checks, mocks))('http://localhost:5984');
      db.setUpDatabases(['db1', 'db2'], function (err, results) {
        checks.db_setupdatabases_err = err;
        checks.db_setupdatabases_results = results;
        done();
      });
      checks.nano_create_dbNames.length.should.equal(2);
      checks.nano_create_dbNames[0].should.equal('db1');
      checks.nano_create_dbNames[1].should.equal('db2');
      should.not.exist(checks.db_setupdatabases_err);
      var createdResults = checks.db_setupdatabases_results['Created databases'];
      createdResults.length.should.equal(2);
      createdResults[0].should.equal('db1');
      createdResults[1].should.equal('db2');
      var ignoredResults = checks.db_setupdatabases_results['Ignored databases (already exist)'];
      ignoredResults.length.should.equal(0);
    });

    it('should ignore existing databases', function (done) {
      mocks.nano_list_results = [['db1', 'db2']];
      db = new (create(checks, mocks))('http://localhost:5984');
      db.setUpDatabases(['db1', 'db2'], function (err, results) {
        checks.db_setupdatabases_err = err;
        checks.db_setupdatabases_results = results;
        done();
      });
      checks.nano_create_dbNames.length.should.equal(0);
      should.not.exist(checks.db_setupdatabases_err);
      var createdResults = checks.db_setupdatabases_results['Created databases'];
      createdResults.length.should.equal(0);
      var ignoredResults = checks.db_setupdatabases_results['Ignored databases (already exist)'];
      ignoredResults.length.should.equal(2);
      ignoredResults[0].should.equal('db1');
      ignoredResults[1].should.equal('db2');
    });
  });

  describe('tearDownDatabases', function () {

    it('should pass error when db list gives an error', function (done) {
      mocks.nano_list_err = new Error('someerror');
      db = new (create(checks, mocks))('http://localhost:5984');
      db.tearDownDatabases(['db1', 'db2'], function (err, results) {
        checks.db_teardowndatabases_err = err;
        checks.db_teardowndatabases_results = results;
        done();
      });
      checks.db_teardowndatabases_err.message.should.equal('someerror');
      should.not.exist(checks.db_teardowndatabases_results);
    });

    it('should ignore inexisting databases', function (done) {
      mocks.nano_list_results = [];
      db = new (create(checks, mocks))('http://localhost:5984');
      db.tearDownDatabases(['db1', 'db2'], function (err, results) {
        checks.db_teardowndatabases_err = err;
        checks.db_teardowndatabases_results = results;
        done();
      });
      checks.nano_destroy_dbNames.length.should.equal(0);
      should.not.exist(checks.db_teardowndatabases_err);
      var createdResults = checks.db_teardowndatabases_results['Deleted databases'];
      createdResults.length.should.equal(0);
      var ignoredResults = checks.db_teardowndatabases_results['Ignored databases (do not exist)'];
      ignoredResults.length.should.equal(2);
      ignoredResults[0].should.equal('db1');
      ignoredResults[1].should.equal('db2');
    });

    it('should delete existing databases', function (done) {
      mocks.nano_list_results = [['db1', 'db2']];
      db = new (create(checks, mocks))('http://localhost:5984');
      db.tearDownDatabases(['db1', 'db2'], function (err, results) {
        checks.db_teardowndatabases_err = err;
        checks.db_teardowndatabases_results = results;
        done();
      });
      checks.nano_destroy_dbNames.length.should.equal(2);
      checks.nano_destroy_dbNames[0].should.equal('db1');
      checks.nano_destroy_dbNames[1].should.equal('db2');
      should.not.exist(checks.db_teardowndatabases_err);
      var createdResults = checks.db_teardowndatabases_results['Deleted databases'];
      createdResults.length.should.equal(2);
      createdResults[0].should.equal('db1');
      createdResults[1].should.equal('db2');
      var ignoredResults = checks.db_teardowndatabases_results['Ignored databases (do not exist)'];
      ignoredResults.length.should.equal(0);
    });
  });

  describe('setUpDocuments', function () {

    it('should create inexisting documents', function () {

    });

    it('should update existing documents', function () {

    });
  });

  describe('tearDownDocuments', function () {

    it('should ignore inexisting documents', function () {

    });

    it('should delete existing documents', function () {

    });
  });
});
 