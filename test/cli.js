var bag = require('bagofholding'),
  sandbox = require('sandboxed-module'),
  should = require('should'),
  checks, mocks,
  cli;

describe('cli', function () {

  function create(checks, mocks) {
    return sandbox.require('../lib/cli', {
      requires: {
        bagofholding: {
          cli: {
            exit: bag.cli.exit,
            exitCb: function (errorCb, successCb) {
              return function (err, result) {
                successCb(result);
              };
            },
            parse: function (commands, dir) {
              checks.bag_parse_commands = commands;
              checks.bag_parse_dir = dir;
            }
          }
        },
        './couchpenter': function (url, opts) {
          checks.couchpenter_url = url;
          checks.couchpenter_opts = opts;
          return {
            init: function (exit) {
              checks.couchpenter_init_exit = exit;
            },
            task: function (tasks, exit) {
              checks.couchpenter_do_tasks = tasks;
              checks.couchpenter_do_exit = exit;
              exit(mocks.task_error, mocks.task_result);
            }
          };
        },
        '/somedir/couchpenter/couchpenter': {},
        '/somedir/foobar.js': {}
      },
      globals: {
        console: bag.mock.console(checks, mocks),
        process: bag.mock.process(checks, mocks)
      }
    });
  }

  beforeEach(function () {
    checks = {};
    mocks = {
      process_cwd: '/somedir/couchpenter'
    };
    cli = create(checks, mocks);
    cli.exec();
  });

  describe('exec', function () {

    it('should contain init command and delegate to couchpenter init when exec is called', function () {
      checks.bag_parse_commands.init.desc.should.equal('Create sample setup file');
      checks.bag_parse_commands.init.action();
      checks.couchpenter_init_exit.should.be.a('function');
    });

    it('should contain setup command and delegate to couchpenter do when exec is called', function () {
      checks.bag_parse_commands.setup.desc.should.equal('Create databases, then create/update documents');
      checks.bag_parse_commands.setup.options.length.should.equal(3);
      checks.bag_parse_commands.setup.action({
        url: 'http://localhost:5984/somedb',
        setupFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.setupFile.should.equal('someconfigfile.js');
      checks.couchpenter_do_tasks.length.should.equal(2);
      checks.couchpenter_do_tasks[0].should.equal('setUpDatabases');
      checks.couchpenter_do_tasks[1].should.equal('setUpDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain setup-db command and delegate to couchpenter do when exec is called', function () {
      checks.bag_parse_commands['setup-db'].desc.should.equal('Create databases only');
      checks.bag_parse_commands['setup-db'].options.length.should.equal(3);
      checks.bag_parse_commands['setup-db'].action({
        url: 'http://localhost:5984/somedb',
        setupFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.setupFile.should.equal('someconfigfile.js');
      checks.couchpenter_do_tasks.length.should.equal(1);
      checks.couchpenter_do_tasks[0].should.equal('setUpDatabases');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain setup-doc command and delegate to couchpenter do when exec is called', function () {
      checks.bag_parse_commands['setup-doc'].desc.should.equal('Create documents only');
      checks.bag_parse_commands['setup-doc'].options.length.should.equal(3);
      checks.bag_parse_commands['setup-doc'].action({
        url: 'http://localhost:5984/somedb',
        setupFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.setupFile.should.equal('someconfigfile.js');
      checks.couchpenter_do_tasks.length.should.equal(1);
      checks.couchpenter_do_tasks[0].should.equal('setUpDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain teardown command and delegate to couchpenter do when exec is called', function () {
      checks.bag_parse_commands.teardown.desc.should.equal('Delete databases, including documents');
      checks.bag_parse_commands.teardown.options.length.should.equal(3);
      checks.bag_parse_commands.teardown.action({
        url: 'http://localhost:5984/somedb',
        setupFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.setupFile.should.equal('someconfigfile.js');
      checks.couchpenter_do_tasks.length.should.equal(1);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDatabases');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain teardown-db command and delegate to couchpenter do when exec is called', function () {
      checks.bag_parse_commands['teardown-db'].desc.should.equal('Alias for teardown');
      checks.bag_parse_commands['teardown-db'].options.length.should.equal(3);
      checks.bag_parse_commands['teardown-db'].action({
        url: 'http://localhost:5984/somedb',
        setupFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.setupFile.should.equal('someconfigfile.js');
      checks.couchpenter_do_tasks.length.should.equal(1);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDatabases');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain teardown-doc command and delegate to couchpenter do when exec is called', function () {
      checks.bag_parse_commands['teardown-doc'].desc.should.equal('Delete documents only');
      checks.bag_parse_commands['teardown-doc'].options.length.should.equal(3);
      checks.bag_parse_commands['teardown-doc'].action({
        url: 'http://localhost:5984/somedb',
        setupFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.setupFile.should.equal('someconfigfile.js');
      checks.couchpenter_do_tasks.length.should.equal(1);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain reset command and delegate to couchpenter do when exec is called', function () {
      checks.bag_parse_commands.reset.desc.should.equal('Delete then recreate databases and documents');
      checks.bag_parse_commands.reset.options.length.should.equal(3);
      checks.bag_parse_commands.reset.action({
        url: 'http://localhost:5984/somedb',
        setupFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.setupFile.should.equal('someconfigfile.js');
      checks.couchpenter_do_tasks.length.should.equal(3);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDatabases');
      checks.couchpenter_do_tasks[1].should.equal('setUpDatabases');
      checks.couchpenter_do_tasks[2].should.equal('setUpDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain reset-db command and delegate to couchpenter do when exec is called', function () {
      checks.bag_parse_commands['reset-db'].desc.should.equal('Alias for reset');
      checks.bag_parse_commands['reset-db'].options.length.should.equal(3);
      checks.bag_parse_commands['reset-db'].action({
        url: 'http://localhost:5984/somedb',
        setupFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.setupFile.should.equal('someconfigfile.js');
      checks.couchpenter_do_tasks.length.should.equal(3);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDatabases');
      checks.couchpenter_do_tasks[1].should.equal('setUpDatabases');
      checks.couchpenter_do_tasks[2].should.equal('setUpDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain reset-doc command and delegate to couchpenter do when exec is called', function () {
      checks.bag_parse_commands['reset-doc'].desc.should.equal('Delete then recreate documents only');
      checks.bag_parse_commands['reset-doc'].options.length.should.equal(3);
      checks.bag_parse_commands['reset-doc'].action({
        url: 'http://localhost:5984/somedb',
        setupFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.setupFile.should.equal('someconfigfile.js');
      checks.couchpenter_do_tasks.length.should.equal(2);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDocuments');
      checks.couchpenter_do_tasks[1].should.equal('setUpDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should log task result', function () {
      mocks.task_result = [{
        'Created': ['foo', 'db1'],
        'Ignored': ['db2']
      }];
      checks.bag_parse_commands.setup.action({
        url: 'http://localhost:5984/somedb',
        setupFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.console_log_messages.length.should.equal(2);
      checks.console_log_messages[0].should.equal('Created: foo, db1');
      checks.console_log_messages[1].should.equal('Ignored: db2');
    });
  });
});