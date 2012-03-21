var fs = require('fs'),
  ncp = require('ncp'),
  p = require('path');

function Config() {

  function read(file) {
    return JSON.parse(fs.readFileSync(file));
  }
    
  function write(dir, cb) {
    ncp.ncp(p.join(dir, '../examples/'), '.', cb);  
  }

  return {
    read: read,
    write: write
  };
}

exports.Config = Config;