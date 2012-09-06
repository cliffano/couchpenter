var _ = require('underscore'),
  bag = require('bagofholding'),
  couchpenter = require('./couchpenter');

/**
 * Execute couchpenter.
 */
function exec() {

  function _config() {
    new couchpenter().config(bag.cli.exit);
  }

  function _execTasks(tasks) {

    return function (args) {
      var config = JSON.parse(bag.cli.readCustomConfigFileSync(args.configFile || 'couchpenter.json'));

      new couchpenter(args.url, config, args.dir)
        .task(tasks, bag.cli.exitCb(null, function (results) {
          if (results) {
            results.forEach(function (result) {
              _.keys(result).forEach(function (type) {
                if (result[type] && result[type].length >= 1) {
                  console.log(type + ': ' + result[type].join(', '));
                }
              });
            });
          }
        }));
    };
  }

  var options = [
      { arg: '-u, --url <url>', desc: 'CouchDB URL | default: http://localhost:5984' },
      { arg: '-c, --config-file <configFile>', desc: 'Configuration file | default: couchpenter.json' },
      { arg: '-d, --dir <dir>', desc: 'Base directory of the documents specified in config file' }
    ],
    commands = {
      config: {
        desc: 'Create sample configuration file',
        action: _config
      },
      setup: {
        desc: 'Create databases, then create/update documents',
        options: options,
        action: _execTasks(['setUpDatabases', 'setUpDocuments'])
      },
      'setup-db': {
        desc: 'Create databases only',
        options: options,
        action: _execTasks(['setUpDatabases'])
      },
      'setup-doc': {
        desc: 'Create documents only',
        options: options,
        action: _execTasks(['setUpDocuments'])
      },
      teardown: {
        desc: 'Delete databases, including documents',
        options: options,
        action: _execTasks(['tearDownDatabases'])
      },
      'teardown-db': {
        desc: 'Alias for teardown',
        options: options,
        action: _execTasks(['tearDownDatabases'])
      },
      'teardown-doc': {
        desc: 'Delete documents only',
        options: options,
        action: _execTasks(['tearDownDocuments'])
      },
      reset: {
        desc: 'Delete then recreate databases and documents',
        options: options,
        action: _execTasks(['tearDownDatabases', 'setUpDatabases', 'setUpDocuments'])
      },
      'reset-db': {
        desc: 'Alias for reset',
        options: options,
        action: _execTasks(['tearDownDatabases', 'setUpDatabases', 'setUpDocuments'])
      },
      'reset-doc': {
        desc: 'Delete then recreate documents only',
        options: options,
        action: _execTasks(['tearDownDocuments', 'setUpDocuments'])
      }
    };

  bag.cli.parse(commands, __dirname);
}

exports.exec = exec;