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
            parse: function (commands, dir) {
              checks.bag_parse_commands = commands;
              checks.bag_parse_dir = dir;
            },
            readCustomConfigFileSync: function (file) {
              checks.bag_configFile = file;
              if (mocks.bag_configFile) {
                return mocks.bag_configFile;
              } else {
                throw new Error('Config file not found.');
              }
            }
          }
        },
        './couchpenter': function (url, opts) {
          checks.couchpenter_url = url;
          checks.couchpenter_opts = opts;
          return {
            config: function (exit) {
              checks.couchpenter_config_exit = exit;
            },
            do: function (tasks, config, exit) {
              checks.couchpenter_do_tasks = tasks;
              checks.couchpenter_do_config = config;
              checks.couchpenter_do_exit = exit;
            }
          };
        },
        '/somedir/couchpenter/couchpenter': {},
        '/somedir/foobar.js': {}
      },
      globals: {
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

    it('should contain config command and delegate to couchpenter config when exec is called', function () {
      checks.bag_parse_commands.config.desc.should.equal('Create sample configuration file');
      checks.bag_parse_commands.config.action();
      checks.couchpenter_config_exit.should.be.a('function');
    });

    it('should contain setup command and delegate to couchpenter do when exec is called', function () {
      mocks.bag_configFile = '{ "foo": "bar" }';
      checks.bag_parse_commands.setup.desc.should.equal('Create databases, then create/update documents');
      checks.bag_parse_commands.setup.options.length.should.equal(3);
      checks.bag_parse_commands.setup.action({
        url: 'http://localhost:5984/somedb',
        configFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.logEnabled.should.equal(true);
      checks.couchpenter_do_tasks.length.should.equal(2);
      checks.couchpenter_do_tasks[0].should.equal('setUpDatabases');
      checks.couchpenter_do_tasks[1].should.equal('setUpDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain setup-db command and delegate to couchpenter do when exec is called', function () {
      mocks.bag_configFile = '{ "foo": "bar" }';
      checks.bag_parse_commands['setup-db'].desc.should.equal('Create databases only');
      checks.bag_parse_commands['setup-db'].options.length.should.equal(3);
      checks.bag_parse_commands['setup-db'].action({
        url: 'http://localhost:5984/somedb',
        configFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.logEnabled.should.equal(true);
      checks.couchpenter_do_tasks.length.should.equal(1);
      checks.couchpenter_do_tasks[0].should.equal('setUpDatabases');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain setup-doc command and delegate to couchpenter do when exec is called', function () {
      mocks.bag_configFile = '{ "foo": "bar" }';
      checks.bag_parse_commands['setup-doc'].desc.should.equal('Create documents only');
      checks.bag_parse_commands['setup-doc'].options.length.should.equal(3);
      checks.bag_parse_commands['setup-doc'].action({
        url: 'http://localhost:5984/somedb',
        configFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.logEnabled.should.equal(true);
      checks.couchpenter_do_tasks.length.should.equal(1);
      checks.couchpenter_do_tasks[0].should.equal('setUpDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain teardown command and delegate to couchpenter do when exec is called', function () {
      mocks.bag_configFile = '{ "foo": "bar" }';
      checks.bag_parse_commands.teardown.desc.should.equal('Delete databases, including documents');
      checks.bag_parse_commands.teardown.options.length.should.equal(3);
      checks.bag_parse_commands.teardown.action({
        url: 'http://localhost:5984/somedb',
        configFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.logEnabled.should.equal(true);
      checks.couchpenter_do_tasks.length.should.equal(1);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDatabases');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain teardown-db command and delegate to couchpenter do when exec is called', function () {
      mocks.bag_configFile = '{ "foo": "bar" }';
      checks.bag_parse_commands['teardown-db'].desc.should.equal('Alias for teardown');
      checks.bag_parse_commands['teardown-db'].options.length.should.equal(3);
      checks.bag_parse_commands['teardown-db'].action({
        url: 'http://localhost:5984/somedb',
        configFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.logEnabled.should.equal(true);
      checks.couchpenter_do_tasks.length.should.equal(1);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDatabases');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain teardown-doc command and delegate to couchpenter do when exec is called', function () {
      mocks.bag_configFile = '{ "foo": "bar" }';
      checks.bag_parse_commands['teardown-doc'].desc.should.equal('Delete documents only');
      checks.bag_parse_commands['teardown-doc'].options.length.should.equal(3);
      checks.bag_parse_commands['teardown-doc'].action({
        url: 'http://localhost:5984/somedb',
        configFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.logEnabled.should.equal(true);
      checks.couchpenter_do_tasks.length.should.equal(1);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain reset command and delegate to couchpenter do when exec is called', function () {
      mocks.bag_configFile = '{ "foo": "bar" }';
      checks.bag_parse_commands.reset.desc.should.equal('Delete then recreate databases and documents');
      checks.bag_parse_commands.reset.options.length.should.equal(3);
      checks.bag_parse_commands.reset.action({
        url: 'http://localhost:5984/somedb',
        configFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.logEnabled.should.equal(true);
      checks.couchpenter_do_tasks.length.should.equal(3);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDatabases');
      checks.couchpenter_do_tasks[1].should.equal('setUpDatabases');
      checks.couchpenter_do_tasks[2].should.equal('setUpDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain reset-db command and delegate to couchpenter do when exec is called', function () {
      mocks.bag_configFile = '{ "foo": "bar" }';
      checks.bag_parse_commands['reset-db'].desc.should.equal('Alias for reset');
      checks.bag_parse_commands['reset-db'].options.length.should.equal(3);
      checks.bag_parse_commands['reset-db'].action({
        url: 'http://localhost:5984/somedb',
        configFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.logEnabled.should.equal(true);
      checks.couchpenter_do_tasks.length.should.equal(3);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDatabases');
      checks.couchpenter_do_tasks[1].should.equal('setUpDatabases');
      checks.couchpenter_do_tasks[2].should.equal('setUpDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should contain reset-doc command and delegate to couchpenter do when exec is called', function () {
      mocks.bag_configFile = '{ "foo": "bar" }';
      checks.bag_parse_commands['reset-doc'].desc.should.equal('Delete then recreate documents only');
      checks.bag_parse_commands['reset-doc'].options.length.should.equal(3);
      checks.bag_parse_commands['reset-doc'].action({
        url: 'http://localhost:5984/somedb',
        configFile: 'someconfigfile.js',
        dir: 'curr/dir/'
      });
      checks.couchpenter_url.should.equal('http://localhost:5984/somedb');
      checks.couchpenter_opts.dir.should.equal('curr/dir/');
      checks.couchpenter_opts.logEnabled.should.equal(true);
      checks.couchpenter_do_tasks.length.should.equal(2);
      checks.couchpenter_do_tasks[0].should.equal('tearDownDocuments');
      checks.couchpenter_do_tasks[1].should.equal('setUpDocuments');
      checks.couchpenter_do_exit.should.be.a('function');
    });

    it('should use custom configuration file when specified and it exists', function () {
      mocks.bag_configFile = '{ "foo": "bar" }';
      try {
        checks.bag_parse_commands.setup.action({
          url: 'http://localhost:5984',
          configFile: '../foobar.js'
        });
      } catch (e) {
        should.fail('An error should not have been thrown since custom configuration should exist.' + e.message);
      }
      checks.bag_configFile.should.equal('../foobar.js');
    });

    it('should use default configuration file when configuration file is not specified', function () {
      mocks.bag_configFile = '{ "foo": "bar" }';
      try {
        checks.bag_parse_commands.setup.action({
          url: 'http://localhost:5984'
        });
      } catch (e) {
        should.fail('An error should not have been thrown since custom configuration should exist.' + e.message);
      }
      checks.bag_configFile.should.equal('couchpenter.json');
    });

    it('should throw error when custom configuration file is specified but it does not exist', function () {
      try {
        checks.bag_parse_commands.setup.action({
          url: 'http://localhost:5984',
          configFile: '../somefilethatdoesnotexist.js'
        });
        should.fail('An error should have been thrown since custom configuration should not exist.');
      } catch (e) {
      }
      checks.bag_configFile.should.equal('../somefilethatdoesnotexist.js');
    });
  });
});