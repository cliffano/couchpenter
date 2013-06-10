var bag = require('bagofcli'),
  buster = require('buster'),
  cli = require('../lib/cli'),
  Couchpenter = require('../lib/couchpenter');

buster.testCase('cli - exec', {
  'should contain commands with actions': function (done) {
    var mockCommand = function (base, actions) {
      assert.defined(base);
      assert.defined(actions.commands.init.action);
      assert.defined(actions.commands.setup.action);
      assert.defined(actions.commands['setup-db'].action);
      assert.defined(actions.commands['setup-doc'].action);
      assert.defined(actions.commands['setup-doc-overwrite'].action);
      assert.defined(actions.commands.teardown.action);
      assert.defined(actions.commands['teardown-db'].action);
      assert.defined(actions.commands['teardown-doc'].action);
      assert.defined(actions.commands.reset.action);
      assert.defined(actions.commands['reset-db'].action);
      assert.defined(actions.commands['reset-doc'].action);
      assert.defined(actions.commands.clean.action);
      assert.defined(actions.commands['clean-db'].action);
      assert.defined(actions.commands['warm-view'].action);
      assert.defined(actions.commands['live-deploy-view'].action);
      done();
    };
    this.stub(bag, 'command', mockCommand);
    cli.exec();
  }
});

buster.testCase('cli - init', {
  'should contain init command and delegate to couchpenter init when exec is called': function (done) {
    this.stub(bag, 'command', function (base, actions) {
      actions.commands.init.action();
    });
    this.stub(Couchpenter.prototype, 'init', function (cb) {
      assert.equals(typeof bag.exit, 'function');
      done();
    });
    cli.exec();
  }
});

buster.testCase('cli - task', {
  setUp: function () {
    var mockConsole = this.mock(console),
      mockProcess = this.mock(process),
      self = this;
    
    this._test = function (command, couchpenterFn) {
      mockConsole.expects('log').once().withExactArgs('%s - %s', 'id1', 'someresult1');
      mockConsole.expects('error').once().withExactArgs('%s - %s', 'id2', 'someresult2');
      mockProcess.expects('exit').once().withExactArgs(0);
      self.stub(Couchpenter.prototype, couchpenterFn, function (cb) {
        cb(null, [{ id: 'id1', message: 'someresult1' }, { id: 'id2', message: 'someresult2', error: { status_code: 404 } }]);
      });
      if (bag.command.restore) {
        bag.command.restore();
      }
      self.stub(bag, 'command', function (base, actions) {
        actions.commands[command].action({ url: 'http://someurl', setupFile: 'somesetupfile', dir: 'somedir', interval: 2000 });
      });
      cli.exec();
    };
  },
  'should contain commands and delegate to couchpenter functions when exec is called': function () {
    this._test('setup', 'setUp');
    this._test('setup-db', 'setUpDatabases');
    this._test('setup-doc', 'setUpDocuments');
    this._test('setup-doc-overwrite', 'setUpDocumentsOverwrite');
    this._test('teardown', 'tearDown');
    this._test('teardown-db', 'tearDownDatabases');
    this._test('teardown-doc', 'tearDownDocuments');
    this._test('reset', 'reset');
    this._test('reset-db', 'resetDatabases');
    this._test('reset-doc', 'resetDocuments');
    this._test('clean', 'clean');
    this._test('clean-db', 'cleanDatabases');
    this._test('warm-view', 'warmViews');
  }
});