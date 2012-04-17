var cly = require('cly'),
  Couchpenter = require('./couchpenter').Couchpenter,
  p = require('path');

function exec() {

  var options = {
    url: {
      string: '-u url',
      help: 'CouchDB URL, default: http://localhost:5984'
    },
    file: {
      string: '-f file',
      help: 'Path to configuration file, default: ./couchpenter.json'
    },
    dir: {
      string: '-d dir',
      help: 'Base directory where all configured documents are relative to'
    }
  };

  function _cb(taskNames) {
    return function (args) {
      console.log('Using CouchDB ' + args.url);
      new Couchpenter(args.url, args.file, args.dir).does(taskNames, cly.exit);
    };
  }

  var couchpenterDir = __dirname,
    execDir = process.cwd(),
    commands = {
      init: {
        callback: function (args) {
          console.log('Creating Couchpenter configuration file');
          cly.copyDir(p.join(couchpenterDir, '../examples'), '.', cly.exit);
        }
      },
      setup: {
        options: options,
        callback: _cb(['setUpDatabases', 'setUpDocuments'])
      },
      'setup-db': {
        options: options,
        callback: _cb(['setUpDatabases'])
      },
      'setup-doc': {
        options: options,
        callback: _cb(['setUpDocuments'])
      },
      teardown: {
        options: options,
        callback: _cb(['tearDownDatabases'])
      },
      'teardown-db': {
        options: options,
        callback: _cb(['tearDownDatabases'])
      },
      'teardown-doc': {
        options: options,
        callback: _cb(['tearDownDocuments'])
      }
    };

  cly.parse(couchpenterDir, 'couchpenter', commands);
}

exports.exec = exec;