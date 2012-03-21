var Couchpenter = require('./couchpenter').Couchpenter,
  fs = require('fs'),
  nomnom = require('nomnom'),
  p = require('path');

function exec() {
  
  var scriptOpts = {
      version: {
        string: '-v',
        flag: true,
        help: 'Couchpenter version number',
        callback: function () {
          return JSON.parse(fs.readFileSync(p.join(__dirname, '../package.json'))).version;
        }
      }
    };


  nomnom.scriptName('couchpenter').opts(scriptOpts);

  nomnom.command('init').callback(function (args) {
    console.log('Creating Couchpenter configuration file');
    new Couchpenter().init(__dirname, function (err) {
      if (err) {
        console.error('An error has occured. ' + err.message);
      }
      process.exit((err) ? 1 : 0);
    });
  });

  nomnom.command('setup').opts({
    url: {
      string: '-u url',
      help: 'CouchDB URL, default: http://localhost:5984'
    },
    file: {
      string: '-f file',
      help: 'Path to configuration file, default: ./couchpenter.json'
    }
  }).callback(function (args) {
    args.url = args.url || 'http://localhost:5984';
    args.file = args.file  || './couchpenter.json';

    console.log('Couchpenter is setting up CouchDB ' + args.url);
    new Couchpenter().setUp(args.url, args.file, function (err) {
      if (err) {
        console.error('An error has occured. ' + err.message);
      }
      process.exit((err) ? 1 : 0);
    });
  });

  nomnom.command('').callback(function (args) {
    console.log(nomnom.getUsage());
  });

  nomnom.parseArgs();
}

exports.exec = exec;