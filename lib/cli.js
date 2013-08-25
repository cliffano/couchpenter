var _ = require('underscore'),
  bag = require('bagofcli'),
  Couchpenter = require('./couchpenter');

function _init() {
  new Couchpenter().init(bag.exit);
}

function _task(fn) {
  return function (args) {
    var couchpenter = new Couchpenter(
      args.url,
      { setupFile: args.setupFile, dir: args.dir, interval: args.interval }
    );
    couchpenter[fn](bag.exitCb(null, function (results) {
      results.forEach(function (result) {
        if (result.error) {
          console.error('%s - %s', result.id, result.message);
        } else {
          console.log('%s - %s', result.id, result.message);
        }
      });
    }));
  };
}

/**
 * Execute Couchpenter CLI.
 */
function exec() {

  // NOTE: pardon this cli target to Couchpenter methods mapping,
  // needed to preserve backward compatibility w/ v0.1.x
  const FUNCTIONS = {
    setup: 'setUp',
    'setup-db': 'setUpDatabases',
    'setup-doc': 'setUpDocuments',
    'setup-doc-overwrite': 'setUpDocumentsOverwrite',
    teardown: 'tearDown',
    'teardown-db': 'tearDownDatabases',
    'teardown-doc': 'tearDownDocuments',
    reset: 'reset',
    'reset-db': 'resetDatabases',
    'reset-doc': 'resetDocuments',
    clean: 'clean',
    'clean-db': 'cleanDatabases',
    'warm-view': 'warmViews',
    'live-deploy-view': 'liveDeployView'
  };

  var actions = {
    commands: {
      init: { action: _init }
    }
  };

  _.keys(FUNCTIONS).forEach(function (task) {
    actions.commands[task] = { action: _task(FUNCTIONS[task]) };
  });

  bag.command(__dirname, actions);
}

exports.exec = exec;
