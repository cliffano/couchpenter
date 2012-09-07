var bag = require('bagofholding'),
  _jscov = require('../lib/couchpenter'),
  sandbox = require('sandboxed-module'),
  should = require('should'),
  checks, mocks,
  couchpenter;

describe('couchpenter', function () {

  function create(checks, mocks) {
    return sandbox.require('../lib/couchpenter', {
      requires: mocks.requires,
      globals: {
        console: bag.mock.console(checks),
        process: bag.mock.process(checks, mocks)
      },
      locals: {
        __dirname: '/somedir/couchpenter/lib'
      }
    });
  }

  beforeEach(function () {
    checks = {};
    mocks = {};
  });

  describe('config', function () {

    it('should copy sample couchpenter.js file to current directory when config is called', function (done) {
      mocks.requires = {
        'fs.extra': {
          copy: function (source, target, cb) {
            checks.fsx_copy_source = source;
            checks.fsx_copy_target = target;
            cb();
          }
        }
      };
      couchpenter = new (create(checks, mocks))();
      couchpenter.config(function () {
        done();
      }); 
      checks.fsx_copy_source.should.equal('/somedir/couchpenter/examples/couchpenter.json');
      checks.fsx_copy_target.should.equal('couchpenter.json');
      checks.console_log_messages.length.should.equal(1);
      checks.console_log_messages[0].should.equal('Creating sample configuration file: couchpenter.json');
    });
  });

  describe('task', function () {

    it('should execute db task functions', function (done) {
      checks.db_foo_call_counts = 0;
      checks.db_bar_call_counts = 0;
      mocks.requires = {
        './db': function (url, config, dir) {
          checks.db_url = url;
          checks.db_config = config;
          checks.db_dir = dir;
          return {
            foo: function(data, cb) {
              checks.db_foo_call_counts++;
              cb();
            },
            bar: function(data, cb) {
              checks.db_bar_call_counts++;
              cb();
            }
          };
        }
      };
      couchpenter = new (create(checks, mocks))();
      couchpenter.task(['foo', 'bar'], function () {
        done();
      });

      checks.db_foo_call_counts.should.equal(1);
      checks.db_bar_call_counts.should.equal(1);
    });

    it('should use config keys as database data when a database task is specified', function (done) {
      mocks.requires = {
        './db': function (url, config, dir) {
          return {
            fooDatabases: function(data, cb) {
              checks.db_data = data;
              cb();
            }
          };
        }
      };
      couchpenter = new (create(checks, mocks))('http://localhost:5984', { somedb1: [], somedb2: [] });
      couchpenter.task(['fooDatabases'], function () {
        done();
      });

      checks.db_data.length.should.equal(2);
      checks.db_data[0].should.equal('somedb1');
      checks.db_data[1].should.equal('somedb2');
    });

    it('should use config as-is as document data when a document is an object', function (done) {
      mocks.requires = {
        './db': function (url, config, dir) {
          return {
            fooDocuments: function(data, cb) {
              checks.db_data = data;
              cb();
            }
          };
        }
      };
      couchpenter = new (create(checks, mocks))('http://localhost:5984', { somedb1: [ { _id: 'id1' } ], somedb2: [ { _id: 'id2' } ] });
      couchpenter.task(['fooDocuments'], function () {
        done();
      });
      checks.db_data.somedb1[0]._id.should.equal('id1');
      checks.db_data.somedb2[0]._id.should.equal('id2');
    });

    it('should use content of a file when document value is a file name ending with .json', function (done) {
      mocks['fs_readFileSync_curr/dir/a/b/c/file1.json'] = '{ "_id": "id1" }';
      mocks['fs_readFileSync_curr/file2.json'] = '{ "_id": "id2" }';
      mocks.requires = {
        './db': function (url, config, dir) {
          return {
            fooDocuments: function(data, cb) {
              checks.db_data = data;
              cb();
            }
          };
        },
        fs: bag.mock.fs(checks, mocks)
      };
      couchpenter = new (create(checks, mocks))('http://localhost:5984', { somedb1: [ 'a/b/c/file1.json' ], somedb2: [ '../file2.json' ] }, 'curr/dir/');
      couchpenter.task(['fooDocuments'], function () {
        done();
      });
      checks.db_data.somedb1[0]._id.should.equal('id1');
      checks.db_data.somedb2[0]._id.should.equal('id2');
    });

    it('should require module when document value is a string not a .json file name', function (done) {
      mocks.requires = {
        './db': function (url, config, dir) {
          return {
            fooDocuments: function(data, cb) {
              checks.db_data = data;
              cb();
            }
          };
        },
        'curr/dir/a/b/c/module1': { _id: 'id1' },
        'curr/module2': { _id: 'id2' }
      };
      couchpenter = new (create(checks, mocks))('http://localhost:5984', { somedb1: [ 'a/b/c/module1' ], somedb2: [ '../module2' ] }, 'curr/dir/');
      couchpenter.task(['fooDocuments'], function () {
        done();
      });
      checks.db_data.somedb1[0]._id.should.equal('id1');
      checks.db_data.somedb2[0]._id.should.equal('id2');
    });
  });

  describe('setUp', function () {

    it('should execute db task functions', function (done) {
      checks.db_setUpDatabases_call_counts = 0;
      checks.db_setUpDocuments_call_counts = 0;
      mocks.requires = {
        './db': function (url, config, dir) {
          checks.db_url = url;
          checks.db_config = config;
          checks.db_dir = dir;
          return {
            setUpDatabases: function(data, cb) {
              checks.db_setUpDatabases_call_counts++;
              cb();
            },
            setUpDocuments: function(data, cb) {
              checks.db_setUpDocuments_call_counts++;
              cb();
            }
          };
        }
      };
      couchpenter = new (create(checks, mocks))();
      couchpenter.setUp(function () {
        done();
      });
      checks.db_setUpDatabases_call_counts.should.equal(1);
      checks.db_setUpDocuments_call_counts.should.equal(1);
    });
  });

  describe('tearDown', function () {

    it('should execute db task functions', function (done) {
      checks.db_tearDownDatabases_call_counts = 0;
      mocks.requires = {
        './db': function (url, config, dir) {
          checks.db_url = url;
          checks.db_config = config;
          checks.db_dir = dir;
          return {
            tearDownDatabases: function(data, cb) {
              checks.db_tearDownDatabases_call_counts++;
              cb();
            }
          };
        }
      };
      couchpenter = new (create(checks, mocks))();
      couchpenter.tearDown(function () {
        done();
      });
      checks.db_tearDownDatabases_call_counts.should.equal(1);
    });
  });
});
 