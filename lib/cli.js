var _ = require('underscore'),
  bag = require('bagofholding'),
  couchpenter = require('./couchpenter');

/**
 * Execute couchpenter.
 */
function exec() {

  function _init() {
    new couchpenter().init(bag.cli.exit);
  }

  function _execTasks(tasks) {

    return function (args) {
      new couchpenter(args.url, { setupFile: args.setupFile, dir: args.dir })
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
      { arg: '-f, --setup-file <setupFile>', desc: 'Setup file | default: couchpenter.json' },
      { arg: '-d, --dir <dir>', desc: 'Base directory of the documents specified in config file' }
    ],
    commands = {
      init: {
        desc: 'Create sample setup file',
        action: _init
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