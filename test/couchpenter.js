var bag = require('bagofholding'),
  _jscov = require('../lib/couchpenter'),
  sandbox = require('sandboxed-module'),
  should = require('should'),
  checks, mocks,
  couchpenter;

describe('couchpenter', function () {

  function create(checks, mocks) {
    return sandbox.require('../lib/couchpenter', {
      requires: mocks.requires,
      globals: {
        console: bag.mock.console(checks),
        process: bag.mock.process(checks, mocks)
      },
      locals: {
        __dirname: '/somedir/couchpenter/lib'
      }
    });
  }

  beforeEach(function () {
    checks = {};
    mocks = {};
  });

  describe('config', function () {

    it('should copy sample couchpenter.js file to current directory when config is called', function (done) {
      mocks.requires = {
        'fs.extra': {
          copy: function (source, target, cb) {
            checks.fsx_copy_source = source;
            checks.fsx_copy_target = target;
            cb();
          }
        }
      };
      couchpenter = new (create(checks, mocks))();
      couchpenter.config(function () {
        done();
      }); 
      checks.fsx_copy_source.should.equal('/somedir/couchpenter/examples/couchpenter.json');
      checks.fsx_copy_target.should.equal('couchpenter.json');
      checks.console_log_messages.length.should.equal(1);
      checks.console_log_messages[0].should.equal('Creating sample configuration file: couchpenter.json');
    });
  });
});
 