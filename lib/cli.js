var cly = require('cly'),
  Couchpenter = require('./couchpenter').Couchpenter,
  p = require('path');

function exec() {

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
        options: {
          url: {
            string: '-u url',
            help: 'CouchDB URL, default: http://localhost:5984'
          },
          file: {
            string: '-f file',
            help: 'Path to configuration file, default: ./couchpenter.json'
          }
        },
        callback: function (args) {
          args.url = args.url || 'http://localhost:5984';
          args.file = args.file  || 'couchpenter.json';

          console.log('Couchpenter is setting up CouchDB ' + args.url);
          new Couchpenter().setUp(args.url, args.file, execDir, cly.exit);
        }
      }
    };

  cly.parse(couchpenterDir, 'couchpenter', commands);
}

exports.exec = exec;