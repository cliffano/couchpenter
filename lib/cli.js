var cly = require('cly'),
  Couchpenter = require('./couchpenter').Couchpenter,
  nomnom = require('nomnom');

function exec() {

  var couchpenterDir = __dirname,
    execDir = process.cwd(),
    commands = {
      init: {
        callback: function (args) {
          console.log('Creating Couchpenter configuration file');
          new Couchpenter().init(couchpenterDir, function (err) {
            if (err) {
              console.error('An error has occured. ' + err.message);
            }
            process.exit((err) ? 1 : 0);
          });
        }
      },
      setup: {
        opts: {
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
          new Couchpenter().setUp(args.url, args.file, execDir, function (err) {
            if (err) {
              console.error('An error has occured. ' + err.message);
            }
            process.exit((err) ? 1 : 0);
          });
        }
      }
    };

  cly.exec(nomnom, couchpenterDir, 'couchpenter', commands);
}

exports.exec = exec;