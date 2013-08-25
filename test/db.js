var _ = require ('lodash'),
  buster = require('buster'),
  Db = require('../lib/db'),
  req = require('bagofrequest');

buster.testCase('db - db', {
  'should set proxy to nano when proxy environment variable is set': function () {
    this._mockNano = function () {
      return function (opts) {
        assert.equals(opts.request_defaults.proxy, 'http://someproxy');
        return { db: {} };
      };
    };
    this.stub(req, 'proxy', function () { return 'http://someproxy'; });
    new Db('http://localhost:5984', { nano: this._mockNano() });
  },
  'should not set request_defaults when there is no proxy environment variable': function () {
    this._mockNano = function () {
      return function (opts) {
        assert.equals(opts.request_defaults, undefined);
        return { db: {} };
      };
    };
    this.stub(req, 'proxy', function () { return null; });
    new Db('http://localhost:5984', { nano: this._mockNano() });
  }
});

buster.testCase('db - createDatabases', {
  setUp: function () {
    this._mockNano = function (createCb) {
      return function (opts) {
        assert.equals(opts.url, 'http://localhost:5984');
        return { db: { create: createCb } };
      };
    };
  },
  'should create databases successfully when the databases do not exist': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(function (dbName, cb) { cb(null, { ok: 'true' }); })
    });
    db.createDatabases(['db1', 'db2'], function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 2);
      assert.equals(result[0].id, 'db1');
      assert.equals(result[0].message, 'created');
      assert.equals(result[1].id, 'db2');
      assert.equals(result[1].message, 'created');
      done();
    });
  },
  'should display error message when create databases fail because they already exist': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(function (dbName, cb) { cb({ status_code: 412, error: 'file_exists' }); })
    });
    db.createDatabases(['db1', 'db2'], function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 2);
      assert.equals(result[0].id, 'db1');
      assert.equals(result[0].message, 'file_exists (412)');
      assert.equals(result[1].id, 'db2');
      assert.equals(result[1].message, 'file_exists (412)');
      done();
    });
  }
});

buster.testCase('db - removeDatabases', {
  setUp: function () {
    this._mockNano = function (destroyCb) {
      return function (url) {
        return { db: { destroy: destroyCb } };
      };
    };
  },
  'should remove databases successfully when the databases already exist': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(function (dbName, cb) { cb(null, { ok: 'true' }); })
    });
    db.removeDatabases(['db1', 'db2'], function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 2);
      assert.equals(result[0].id, 'db1');
      assert.equals(result[0].message, 'deleted');
      assert.equals(result[1].id, 'db2');
      assert.equals(result[1].message, 'deleted');
      done();
    });
  },
  'should display error message when remove databases fail because they do not exist': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(function (dbName, cb) { cb({ status_code: 404, error: 'missing' }); })
    });
    db.removeDatabases(['db1', 'db2'], function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 2);
      assert.equals(result[0].id, 'db1');
      assert.equals(result[0].message, 'missing (404)');
      assert.equals(result[1].id, 'db2');
      assert.equals(result[1].message, 'missing (404)');
      done();
    });
  }
});

buster.testCase('db - cleanDatabases', {
  setUp: function () {
    this._mockNano = function (listCb) {
      return function (url) {
        return { db: { list: listCb } };
      };
    };
  },
  'should remove non-Couchpenter databases when they exist': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(function (cb) { cb(null, ['db1', 'db2', 'db3']); })
    });
    db.removeDatabases = function (dbNames, cb) {
      assert.equals(dbNames.length, 1);
      assert.equals(dbNames[0], 'db3');
      done();
    };
    db.cleanDatabases(['db1', 'db2'], function (err, result) {
      assert.equals(err.message, 'some error');
      assert.equals(result, undefined);
    });
  },
  'should not have any result when there is no non-Couchpenter databases to remove': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(function (cb) { cb(null, ['db1', 'db2']); })
    });
    db.removeDatabases = function (dbNames, cb) {
      assert.equals(dbNames.length, 0);
      done();
    };
    db.cleanDatabases(['db1', 'db2'], function (err, result) {
      assert.equals(err.message, 'some error');
      assert.equals(result, undefined);
    });
  },
  'should pass standard error via callback': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(function (cb) { cb(new Error('some error')); })
    });
    db.cleanDatabases(['db1', 'db2'], function (err, result) {
      assert.equals(err.message, 'some error');
      assert.equals(result, undefined);
      done();
    });
  }
});

buster.testCase('db - createDocuments', {
  setUp: function () {
    this._mockNano = function (insertCb) {
      return function (url) {
        return { use: function (dbName) { return { insert: insertCb }; }};
      };
    };
  },
  'should create documents successfully when the documents do not already exist': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(function (doc, cb) { cb(null, { ok: 'true' }); })
    });
    db.createDocuments({ db1: [{ _id: 'docA' }], db2: [{ _id: 'docB'}, { _id: 'docC'}] }, function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 3);
      assert.equals(result[0].id, 'db1/docA');
      assert.equals(result[0].message, 'created');
      assert.equals(result[1].id, 'db2/docB');
      assert.equals(result[1].message, 'created');
      assert.equals(result[2].id, 'db2/docC');
      assert.equals(result[2].message, 'created');
      done();
    });
  },
  'should display error message when create documents fail because they already exist': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(function (doc, cb) { cb({ status_code: 409, error: 'conflict' }); })
    });
    db.createDocuments({ db1: [{ _id: 'docA' }], db2: [{ _id: 'docB'}, { _id: 'docC'}] }, function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 3);
      assert.equals(result[0].id, 'db1/docA');
      assert.equals(result[0].message, 'conflict (409)');
      assert.equals(result[1].id, 'db2/docB');
      assert.equals(result[1].message, 'conflict (409)');
      assert.equals(result[2].id, 'db2/docC');
      assert.equals(result[2].message, 'conflict (409)');
      done();
    });
  }
});

buster.testCase('db - saveDocuments', {
  setUp: function () {
    this._mockNano = function (insertCb, getCb) {
      return function (url) {
        return { use: function (dbName) { return { insert: insertCb, get: getCb }; }};
      };
    };
  },
  'should create documents successfully when the documents do not already exist': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(function (doc, cb) { cb(null, { ok: 'true' }); })
    });
    db.saveDocuments({ db1: [{ _id: 'docA' }], db2: [{ _id: 'docB'}, { _id: 'docC'}] }, function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 3);
      assert.equals(result[0].id, 'db1/docA');
      assert.equals(result[0].message, 'created');
      assert.equals(result[1].id, 'db2/docB');
      assert.equals(result[1].message, 'created');
      assert.equals(result[2].id, 'db2/docC');
      assert.equals(result[2].message, 'created');
      done();
    });
  },
  'should display error message when create documents fail because non conflict error': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(
        function (doc, cb) {
          if (doc._rev) {
            cb(null, { ok: 'true' });
          } else {
            cb({ status_code: 404, error: 'missing' });
          }
        },
        function (id, cb) {
          cb(null, { _rev: 'rev' + id });
        }
      )
    });
    db.saveDocuments({ db1: [{ _id: 'docA' }], db2: [{ _id: 'docB'}, { _id: 'docC'}] }, function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 3);
      assert.equals(result[0].id, 'db1/docA');
      assert.equals(result[0].message, 'missing (404)');
      assert.equals(result[1].id, 'db2/docB');
      assert.equals(result[1].message, 'missing (404)');
      assert.equals(result[2].id, 'db2/docC');
      assert.equals(result[2].message, 'missing (404)');
      done();
    });
  },
  'should update documents successfully when the document already exists': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(
        function (doc, cb) {
          if (doc._rev) {
            cb(null, { ok: 'true' });
          } else {
            cb({ status_code: 409, error: 'conflict' });
          }
        },
        function (id, cb) {
          cb(null, { _rev: 'rev' + id });
        }
      )
    });
    db.saveDocuments({ db1: [{ _id: 'docA' }], db2: [{ _id: 'docB'}, { _id: 'docC'}] }, function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 3);
      assert.equals(result[0].id, 'db1/docA');
      assert.equals(result[0].message, 'updated');
      assert.equals(result[1].id, 'db2/docB');
      assert.equals(result[1].message, 'updated');
      assert.equals(result[2].id, 'db2/docC');
      assert.equals(result[2].message, 'updated');
      done();
    });
  }
});

buster.testCase('db - removeDocuments', {
  setUp: function () {
    this._mockNano = function (getCb, destroyCb) {
      return function (url) {
        return { use: function (dbName) { return { get: getCb, destroy: destroyCb }; }};
      };
    };
  },
  'should remove documents successfully when the documents already exist': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(
        function (id, cb) {
          cb(null, { _rev: 'rev' + id });
        },
        function (doc, rev, cb) {
          cb(null, { ok: 'true' });
        }
      )
    });
    db.removeDocuments({ db1: [{ _id: 'docA' }], db2: [{ _id: 'docB'}, { _id: 'docC'}] }, function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 3);
      assert.equals(result[0].id, 'db1/docA');
      assert.equals(result[0].message, 'deleted');
      assert.equals(result[1].id, 'db2/docB');
      assert.equals(result[1].message, 'deleted');
      assert.equals(result[2].id, 'db2/docC');
      assert.equals(result[2].message, 'deleted');
      done();
    });
  },
  'should display error message when documents do not exist': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(
        function (id, cb) {
          cb({ status_code: 404, error: 'missing' });
        }
      )
    });
    db.removeDocuments({ db1: [{ _id: 'docA' }], db2: [{ _id: 'docB'}, { _id: 'docC'}] }, function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 3);
      assert.equals(result[0].id, 'db1/docA');
      assert.equals(result[0].message, 'missing (404)');
      assert.equals(result[1].id, 'db2/docB');
      assert.equals(result[1].message, 'missing (404)');
      assert.equals(result[2].id, 'db2/docC');
      assert.equals(result[2].message, 'missing (404)');
      done();
    });
  }
});

buster.testCase('db - warmViews', {
  setUp: function () {
    this._mockNano = function (viewCb) {
      return function (url) {
        return { use: function (dbName) { return { view: viewCb }; }};
      };
    };
  },
  'should ignore documents that are not design docs': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano()
    });
    db.warmViews({ db1: [{ _id: 'docA' } ] }, function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result.length, 0);
      done();
    });
  },
  'should exercise each view in design docs': function (done) {
    var viewInvocations = [],
      db = new Db('http://localhost:5984', {
        nano: this._mockNano(
          function (designDocName, viewName, params, cb) {
            assert.equals(designDocName, 'somedesigndoc');
            assert.isTrue(viewName === 'view1' || viewName === 'view2');
            assert.equals(params.limit, 0);
            viewInvocations.push({ designDocName: designDocName, viewName: viewName, params: params });
            cb(null, { results: [ { seq: 15, id: 'abcdef', changes: [ { rev: '2-abcdef' } ], deleted: true } ], last_seq: 15 });
          }
        )
      });
    db.warmViews({ db1: [{ _id: 'docA' }, { _id: '_design/somedesigndoc', views: { view1: {}, view2: {} } } ] }, 
     function (err, result) {
       assert.equals(err, undefined);
       assert.equals(result.length, 1);
       assert.equals(result[0].id, 'db1/_design/somedesigndoc');
       assert.equals(result[0].message, 'warmed view1, view2');
       done();
     });
  }

});


buster.testCase('db - liveDeployView', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this._mockNano = function (viewCb, requestCb, headCb, copyCb) {
      return function (url) {
        return { 
          use: function (dbName) { 
            return { 
              view: viewCb,
              head: headCb,
              copy: copyCb
           }; 
          },
          request: requestCb
        };
      };
    };
  },
  'should ignore non design docs': function (done) {
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(),
      interval: 0,
      parallelLimit: 100
    });
    db.liveDeployView({ db1: [{ _id: 'docA' }]}, function (err, result) {
      assert.equals(err, undefined);
      assert.isTrue(_.isEmpty(result.length));
      done();
    });
  },
  'should kickoff index for each views in design docs': function (done) {
    this.mockConsole.expects('log').twice().withExactArgs('%s - view index updater running: %s', 'somename', false);
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(
        function (docId, viewName, opts, cb) {
          cb(null, {_id: 'docA' });
        }, 
        function (opts, cb) {
          var result = { name: 'somename', view_index: { updater_running: false }};
          cb(null, result);
        },
        function (docId, cb) {
          cb(null, { something: 'undescore' }, { some: 'headers' });
        },
        function (docId, newDocId, opts, cb) {
          cb(null, { message: ' success' });
        }
      ),
      interval: 1
    });
    db.removeDocuments = function (dbSetup, cb) {
      assert.equals(dbSetup.db1[0]._id, '_design/content_new');
      assert.defined(dbSetup.db1[0].views);
      assert.defined(dbSetup.db1[0].views.somename);
      assert.equals(dbSetup.db1[1]._id, '_design/content2_new');
      assert.defined(dbSetup.db1[1].views);
      assert.defined(dbSetup.db1[1].views.somename);
      cb(null, {ok: true});
    };
    db.saveDocuments = function (dbSetup, cb) {
      assert.equals(dbSetup.db1[0]._id, '_design/content_new');
      assert.defined(dbSetup.db1[0].views);
      assert.defined(dbSetup.db1[0].views.somename);
      assert.equals(dbSetup.db1[1]._id, '_design/content2_new');
      assert.defined(dbSetup.db1[1].views);
      assert.defined(dbSetup.db1[1].views.somename);
      cb(null, {ok: true});
    };

    db.liveDeployView(
      { db1: 
        [ 
          { _id: '_design/content',
            views: {
              somename: {
                map: function (doc) { }
              }
            },
            lists: {},
            language: 'javascript',
            filters: {},
            shows: {} 
          },
          { _id: '_design/content2',
            views: {
              somename: {
                map: function (doc) { }
              }
            },
            lists: {},
            language: 'javascript',
            filters: {},
            shows: {} 
          }
        ] 
      }, 
     function (err, result) {
       assert.equals(err, undefined);
       assert.isFalse(_.isEmpty(result));
       assert.equals('view index has been kicked off', result[0][1][0].message);
       assert.equals('view index has been kicked off', result[0][1][1].message);
       done();
    });
  },
  'should overwrite the old design doc with the new one regardless of whether old design doc exists or not': function (done) {
    this.mockConsole.expects('log').twice().withExactArgs('%s - view index updater running: %s', 'somename', false);
    var db = new Db('http://localhost:5984', {
      nano: this._mockNano(
        function (docId, viewName, opts, cb) {
          cb(null, {_id: 'docA' });
        }, 
        function (opts, cb) {
          var result = { name: 'somename', view_index: { updater_running: false } };
          cb(null, result);
        },
        function (docId, cb) {
          cb({err: 'conflict', status: '409'}, undefined, { some: 'headers' });
        },
        function (docId, newDocId, opts, cb) {
          cb(null, { message: 'success' });
        }
      ),
      interval: 1
    });
    db.removeDocuments = function (dbSetup, cb) {
      assert.equals(dbSetup.db1[0]._id, '_design/content_new');
      assert.defined(dbSetup.db1[0].views);
      assert.defined(dbSetup.db1[0].views.somename);
      assert.equals(dbSetup.db1[1]._id, '_design/content2_new');
      assert.defined(dbSetup.db1[1].views);
      assert.defined(dbSetup.db1[1].views.somename);
      cb(null, {ok: true});
    };
    db.saveDocuments = function (dbSetup, cb) {
      assert.equals(dbSetup.db1[0]._id, '_design/content_new');
      assert.defined(dbSetup.db1[0].views);
      assert.defined(dbSetup.db1[0].views.somename);
      assert.equals(dbSetup.db1[1]._id, '_design/content2_new');
      assert.defined(dbSetup.db1[1].views);
      assert.defined(dbSetup.db1[1].views.somename);
      cb(null, {ok: true});
    };

    db.liveDeployView(
      { db1: 
        [ 
          { _id: '_design/content',
            views: {
              somename: {
                map: function(doc) { }
              }
            },
            lists: {},
            language: 'javascript',
            filters: {},
            shows: {} 
          },
          { _id: '_design/content2',
            views: {
              somename: {
                map: function(doc) { }
              }
            },
            lists: {},
            language: 'javascript',
            filters: {},
            shows: {} 
          }
        ] 
      }, 
     function (err, result) {
       assert.equals(err, undefined);
       assert.isTrue(!_.isEmpty(result));
       assert.equals("success", result[0][3][0].message);
       assert.equals("success", result[0][3][1].message);
       done();
    });
  },
  'should continue polling _info until index is fully built': function (done) {
    this.mockConsole.expects('log').twice().withExactArgs('%s - view index updater running: %s', 'somename', false);
    var db = new Db('http://localhost:5984', {
        nano: this._mockNano(
          function (docId, viewName, opts, cb) {
            cb(null, {_id: 'docA' });
          }, 
          function (opts, cb) {
            var result = { name: 'somename', view_index: { updater_running: false } };
            cb(null, result);
          },
          function (docId, cb) {
            cb({err: 'conflict', status: '409'}, undefined, { some: 'headers' });
          },
          function (docId, newDocId, opts, cb) {
            cb(null, { message: ' success' });
          }
        ),
        interval: 1
      });
    db.removeDocuments = function (dbSetup, cb) {
      assert.equals(dbSetup.db1[0]._id, '_design/content_new');
      assert.defined(dbSetup.db1[0].views);
      assert.defined(dbSetup.db1[0].views.somename);
      assert.equals(dbSetup.db1[1]._id, '_design/content2_new');
      assert.defined(dbSetup.db1[1].views);
      assert.defined(dbSetup.db1[1].views.somename);
      cb(null, {ok: true});
    };
    db.saveDocuments = function (dbSetup, cb) {
      assert.equals(dbSetup.db1[0]._id, '_design/content_new');
      assert.defined(dbSetup.db1[0].views);
      assert.defined(dbSetup.db1[0].views.somename);
      assert.equals(dbSetup.db1[1]._id, '_design/content2_new');
      assert.defined(dbSetup.db1[1].views);
      assert.defined(dbSetup.db1[1].views.somename);
      cb(null, {ok: true});
    };

    db.liveDeployView(
      { db1: 
        [ 
          { _id: '_design/content',
            views: {
              somename: {
                map: function(doc) { }
              }
            },
            lists: {},
            language: 'javascript',
            filters: {},
            shows: {} 
          },
          { _id: '_design/content2',
            views: {
              somename: {
                map: function(doc) { }
              }
            },
            lists: {},
            language: 'javascript',
            filters: {},
            shows: {} 
          }
        ] 
      }, 
     function (err, result) {
       assert.equals(err, undefined);
       assert.isTrue(!_.isEmpty(result));
       assert.isTrue(result[0][4].ok);
       done();
    });
  },
  'should stop polling _info when couchdb error occurs': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('%s - %s', '_design/content_new', {error: 'Not Found'});
    var db = new Db('http://localhost:5984', {
        nano: this._mockNano(
          function (docId, viewName, opts, cb) {
            cb(null, {_id: 'docA' });
          }, 
          function (opts, cb) {
            cb({error: 'Not Found'}, undefined);
          },
          function (docId, cb) {
            cb({err: 'conflict', status: '409'}, undefined, { some: 'headers' });
          },
          function (docId, newDocId, opts, cb) {
            cb(null, { message: ' success' });
          }
        ),
        interval: 1
      });
    db.removeDocuments = function (dbSetup, cb) {
      assert.equals(dbSetup.db1[0]._id, '_design/content_new');
      assert.defined(dbSetup.db1[0].views);
      assert.defined(dbSetup.db1[0].views.somename);
      cb(null, {ok: true});
    };
    db.saveDocuments = function (dbSetup, cb) {
      assert.equals(dbSetup.db1[0]._id, '_design/content_new');
      assert.defined(dbSetup.db1[0].views);
      assert.defined(dbSetup.db1[0].views.somename);
      cb(null, {ok: true});
    };

    db.liveDeployView(
      { db1: 
        [ 
          { _id: '_design/content',
            views: {
              somename: {
                map: function(doc) { }
              }
            },
            lists: {},
            language: 'javascript',
            filters: {},
            shows: {} 
          }
        ] 
      }, 
     function (err, result) {
       assert.equals(err, undefined);
       assert.isTrue(!_.isEmpty(result));
       assert.isTrue(result[0][4].ok);
       done();
    });
  }

});


buster.testCase('db - _handle', {
  setUp: function () {
    this.db = new Db('http://localhost:5984', { nano: function (url) {} });
  },
  'should return result object when there is no error': function (done) {
    function _cb(err, result) {
      assert.isNull(err);
      assert.equals(result.id, 'db1/doc1');
      assert.equals(result.message, 'created');
      done();
    }
    this.db._handle(_cb, { dbName: 'db1', docId: 'doc1', message: 'created' })();
  },
  'should delegate to optional success callback when there is no error and success callback is specified': function (done) {
    function _successCb(err, result) {
      assert.isNull(err);
      assert.equals(result.ok, 'true');
      done();
    }
    this.db._handle(null, { dbName: 'db1', docId: 'doc1', message: 'created', successCb: _successCb })(null, { ok: 'true' });
  },
  'should camouflage error as result when there is a CouchDB error (error has status_code)': function (done) {
    function _cb(err, result) {
      assert.isNull(err);
      assert.equals(result.id, 'db1/doc1');
      assert.equals(result.message, 'conflict (419)');
      done();
    }
    this.db._handle(_cb, { dbName: 'db1', docId: 'doc1' })({ status_code: 419, error: 'conflict' });
  },
  'should pass error via callback when there is a standard error (e.g. connection refused)': function (done) {
    function _cb(err, result) {
      assert.equals(err.message, 'some error');
      assert.equals(result, undefined);
      done();
    }
    this.db._handle(_cb, { dbName: 'db1', docId: 'doc1' })(new Error('some error'));
  },
  'should delegate to optional error callback when error code matches status_code': function (done) {
    function _errorCb(err, result) {
      assert.equals(err.status_code, 419);
      assert.equals(err.error, 'conflict');
      assert.equals(result, undefined);
      done();
    }
    this.db._handle(null, { dbName: 'db1', docId: 'doc1', errorCb: _errorCb, errorCode: 419 })({ status_code: 419, error: 'conflict' });
  }
});
