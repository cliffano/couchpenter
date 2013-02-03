var bag = require('bagofholding'),
  buster = require('buster'),
  Couchpenter = require('../lib/couchpenter'),
  Db = require('../lib/db'),
  fs = require('fs'),
  fsx = require('fs.extra');

buster.testCase('couchpenter - init', {
  setUp: function () {
    this.mockConsole = this.mock(console);
  },
  'should copy sample couchpenter.js file to current directory when init is called': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Creating sample setup file: couchpenter.json');
    this.stub(fsx, 'copy', function (src, dest, cb) {
      assert.isTrue(src.match(/\/examples\/couchpenter.json$/).length === 1);
      assert.equals(dest, 'couchpenter.json');
      cb();
    });
    var couchpenter = new Couchpenter();
    couchpenter.init(function (err, result) {
      assert.equals(err, undefined);
      done();
    });
  }
});

buster.testCase('couchpenter - task', {
  setUp: function () {
    var self = this;
    this.calls = [];
    this.stub(Db.prototype, 'createDatabases', function (data, cb) { self.calls.push('createDatabases'); cb(); });
    this.stub(Db.prototype, 'removeDatabases', function (data, cb) { self.calls.push('removeDatabases'); cb(); });
    this.stub(Db.prototype, 'cleanDatabases', function (data, cb) { self.calls.push('cleanDatabases'); cb(); });
    this.stub(Db.prototype, 'createDocuments', function (data, cb) { self.calls.push('createDocuments'); cb(); });
    this.stub(Db.prototype, 'saveDocuments', function (data, cb) { self.calls.push('saveDocuments'); cb(); });
    this.stub(Db.prototype, 'removeDocuments', function (data, cb) { self.calls.push('removeDocuments'); cb(); });
  },
  'should call correct tasks for setUp method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.setUp(function (err, result) {
      assert.equals(self.calls.length, 2);
      assert.equals(self.calls[0], 'createDatabases');
      assert.equals(self.calls[1], 'createDocuments');
      done();
    });
  },
  'should call correct tasks for setUpDatabases method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.setUpDatabases(function (err, result) {
      assert.equals(self.calls.length, 1);
      assert.equals(self.calls[0], 'createDatabases');
      done();
    });
  },
  'should call correct tasks for setUpDocuments method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.setUpDocuments(function (err, result) {
      assert.equals(self.calls.length, 1);
      assert.equals(self.calls[0], 'createDocuments');
      done();
    });
  },
  'should call correct tasks for setUpDocumentsOverwrite method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.setUpDocumentsOverwrite(function (err, result) {
      assert.equals(self.calls.length, 1);
      assert.equals(self.calls[0], 'saveDocuments');
      done();
    });
  },
  'should call correct tasks for tearDown method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.tearDown(function (err, result) {
      assert.equals(self.calls.length, 1);
      assert.equals(self.calls[0], 'removeDatabases');
      done();
    });
  },
  'should call correct tasks for tearDownDatabases method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.tearDownDatabases(function (err, result) {
      assert.equals(self.calls.length, 1);
      assert.equals(self.calls[0], 'removeDatabases');
      done();
    });
  },
  'should call correct tasks for tearDownDocuments method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.tearDownDocuments(function (err, result) {
      assert.equals(self.calls.length, 1);
      assert.equals(self.calls[0], 'removeDocuments');
      done();
    });
  },
  'should call correct tasks for reset method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.reset(function (err, result) {
      assert.equals(self.calls.length, 3);
      assert.equals(self.calls[0], 'removeDatabases');
      assert.equals(self.calls[1], 'createDatabases');
      assert.equals(self.calls[2], 'createDocuments');
      done();
    });
  },
  'should call correct tasks for resetDatabases method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.resetDatabases(function (err, result) {
      assert.equals(self.calls.length, 2);
      assert.equals(self.calls[0], 'removeDatabases');
      assert.equals(self.calls[1], 'createDatabases');
      done();
    });
  },
  'should call correct tasks for resetDocuments method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.resetDocuments(function (err, result) {
      assert.equals(self.calls.length, 3);
      assert.equals(self.calls[0], 'removeDatabases');
      assert.equals(self.calls[1], 'createDatabases');
      assert.equals(self.calls[2], 'createDocuments');
      done();
    });
  },
  'should call correct tasks for clean method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.clean(function (err, result) {
      assert.equals(self.calls.length, 1);
      assert.equals(self.calls[0], 'cleanDatabases');
      done();
    });
  },
  'should call correct tasks for cleanDatabases method': function (done) {
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } }),
      self = this;
    couchpenter.cleanDatabases(function (err, result) {
      assert.equals(self.calls.length, 1);
      assert.equals(self.calls[0], 'cleanDatabases');
      done();
    });
  }
});

buster.testCase('couchpenter - _task', {
  'should use optional setup object when specified': function (done) {
    this.stub(Db.prototype, 'createDocuments', function (data, cb) {
      assert.equals(data.db1.foo, 'bar');
      cb();
    });
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } });
    couchpenter._task(['createDocuments'], function (err, result) {
      assert.isNull(err);
      done();
    });
  },
  'should combine results from multiple tasks into a single array': function (done) {
    this.stub(Db.prototype, 'removeDocuments', function (data, cb) {
      assert.equals(data.db1.foo, 'bar');
      cb(null, [{ id: 'id1', message: 'someresult1' }]);
    });
    this.stub(Db.prototype, 'createDocuments', function (data, cb) {
      assert.equals(data.db1.foo, 'bar');
      cb(null, [{ id: 'id2', message: 'someresult2' }]);
    });
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } });
    couchpenter._task(['removeDocuments', 'createDocuments'], function (err, result) {
      assert.isNull(err);
      assert.equals(result.length, 2);
      assert.equals(result[0].id, 'id1');
      assert.equals(result[0].message, 'someresult1');
      assert.equals(result[1].id, 'id2');
      assert.equals(result[1].message, 'someresult2');
      done();
    });
  },
  'should fallback to optional setup file when setup object is not specified': function (done) {
    this.stub(bag, 'cli', {
      lookupFile: function (file) {
        assert.equals(file, 'somefile.json');
        return '{ "db1": { "foo": "bar" }}';
      }
    });
    this.stub(Db.prototype, 'createDocuments', function (data, cb) {
      assert.equals(data.db1.foo, 'bar');
      cb();
    });
    var couchpenter = new Couchpenter('http://somehost', { setupFile: 'somefile.json' });
    couchpenter._task(['createDocuments'], function (err, result) {
      assert.isNull(err);
      done();
    });
  },
  'should pass database names as data when task name is postfixed with Databases': function (done) {
    this.stub(Db.prototype, 'createDatabases', function (data, cb) {
      assert.equals(data[0], 'db1');
      cb();
    });
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } });
    couchpenter._task(['createDatabases'], function (err, result) {
      assert.isNull(err);
      done();
    });
  },
  'should prefix database names when optional prefix is specified': function (done) {
    this.stub(Db.prototype, 'createDatabases', function (data, cb) {
      assert.equals(data[0], 'test1_db1');
      cb();
    });
    var couchpenter = new Couchpenter('http://somehost', { prefix: 'test1_', dbSetup: { db1: { foo: 'bar' } } });
    couchpenter._task(['createDatabases'], function (err, result) {
      assert.isNull(err);
      done();
    });
  },
  'should pass setup with processed documents as data when task name is not postfixed with Databases': function (done) {
    this.stub(Db.prototype, 'createDocuments', function (data, cb) {
      assert.equals(data.db1.foo, 'bar');
      cb();
    });
    var couchpenter = new Couchpenter('http://somehost', { dbSetup: { db1: { foo: 'bar' } } });
    couchpenter._task(['createDocuments'], function (err, result) {
      assert.isNull(err);
      done();
    });
  }
});

buster.testCase('couchpenter - _docs', {
  setUp: function () {
    this.mockFs = this.mock(fs);
  },
  'should leave document as-is when value is an object': function () {
    var couchpenter = new Couchpenter(),
      setup = couchpenter._docs({ db1: [{ foo: 'bar' }] });
    assert.equals(setup.db1[0].foo, 'bar');
  },
  'should set file content when value is .json file': function () {   
    this.mockFs.expects('readFileSync').once().withExactArgs('/curr/dir/foo/file1.json').returns('{ "foo": "bar" }');
    var couchpenter = new Couchpenter(),
      setup = couchpenter._docs({ db1: ['foo/file1.json'] }, '/curr/dir');
    assert.equals(setup.db1[0].foo, 'bar');
  },
  'should require document when value is a non .json file string': function () {
    var couchpenter = new Couchpenter(),
      setup = couchpenter._docs({ db1: ['test/fixtures/somemodule'] }, process.cwd());
    assert.equals(setup.db1[0].foo, 'bar');
  },
  'should throw error when value is non object and non string': function () {
    var couchpenter = new Couchpenter();
    try {
      couchpenter._docs({ db1: [ 123 ] });
    } catch (err) {
      assert.equals(err.message, 'Invalid document 123 in db db1, only object and string allowed');
    }
  }
});