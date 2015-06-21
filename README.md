<img align="right" src="https://raw.github.com/cliffano/couchpenter/master/avatar.jpg" alt="Avatar"/>

[![Build Status](https://img.shields.io/travis/cliffano/couchpenter.svg)](http://travis-ci.org/cliffano/couchpenter)
[![Dependencies Status](https://img.shields.io/david/cliffano/couchpenter.svg)](http://david-dm.org/cliffano/couchpenter)
[![Coverage Status](https://img.shields.io/coveralls/cliffano/couchpenter.svg)](https://coveralls.io/r/cliffano/couchpenter?branch=master)
[![Published Version](https://img.shields.io/npm/v/couchpenter.svg)](http://www.npmjs.com/package/couchpenter)
<br/>
[![npm Badge](https://nodei.co/npm/couchpenter.png)](http://npmjs.org/package/couchpenter)

Couchpenter 
-----------

Couchpenter is a CouchDB database and document setup tool.

This is handy when you want to create or delete CouchDB databases and documents based on a predefined setup file, either from the command-line or programmatically.

A common usage scenario is to hook up Couchpenter to application start up code, ensuring CouchDB to have the required databases along with any data, design, and replication documents, before the server starts listening.

Another usage is for integration testing, either from test libraries (e.g. Mocha's beforeEach/afterEach), or from a Continuous Integration build pipeline (e.g. resetting the databases prior to running the test suites).

Installation
------------

    npm install -g couchpenter 

Usage
-----

Create a sample couchpenter.json setup file:

    couchpenter init

Execute a task against a CouchDB URL using default couchpenter.json setup file:

    couchpenter <task> -u http://user:pass@host:port

CouchDB URL can also be set via COUCHDB_URL environment variable:

(*nix)

    export COUCHDB_URL=http://user:pass@host:port

(Windows)

    set COUCHDB_URL=http://user:pass@host:port

Execute a task using custom setup file:

    couchpenter <task> -u http://user:pass@host:port -f somecouchpenter.json

Tasks:

<table>
<tr><th>Task</th><th>Description</th></tr>
<tr><td>setup</td><td>Create databases and documents, overwrite if documents exist.</td></tr>
<tr><td>setup-db</td><td>Create databases only.</td></tr>
<tr><td>setup-doc</td><td> Create documents only, does not overwrite if exist.</td></tr>
<tr><td>setup-doc-overwrite</td><td>Create documents only, overwrite if exist.</td></tr>
<tr><td>teardown</td><td>Alias for teardown-db.</td></tr>
<tr><td>teardown-db</td><td>Delete databases.</td></tr>
<tr><td>teardown-doc</td><td>Delete documents.</td></tr>
<tr><td>reset</td><td>Alias for reset-doc.</td></tr>
<tr><td>reset-db</td><td>Delete then recreate databases and documents.</td></tr>
<tr><td>reset-doc</td><td>Delete then recreate documents only.</td></tr>
<tr><td>clean</td><td>Alias for clean-db.</td></tr>
<tr><td>clean-db</td><td>Delete unknown databases (not configured in setup file).</td></tr>
<tr><td>warm-view</td><td>Warm up views specified in design documents.</td></tr>
</table>

Programmatically:

    // use default couchpenter.json setup file
    var couchpenter = new (require('couchpenter'))(
      'http://user:pass@host:port'
    );

    // use custom setup file
    var couchpenter = new (require('couchpenter'))(
      'http://user:pass@host:port',
      { setupFile: 'somecouchpenter.json' }
    );

    // use setup object (instead of setup file)
    var couchpenter = new (require('couchpenter'))(
      'http://user:pass@host:port',
      { dbSetup: {
          "db1": [
            { "_id": "doc1", "foo": "bar" },
            { "_id": "doc2", "foo": "bar" },
            "path/to/doc3file.json"
          ]
        }
      }
    );

    // prefix the database names
    // handy for running multiple tests in parallel without interrupting each other
    var couchpenter = new (require('couchpenter'))(
      'http://user:pass@host:port',
      { prefix: 'testrun123_' }
    );

    // specify a base directory for the documents specified in setup file
    var couchpenter = new (require('couchpenter'))(
      'http://user:pass@host:port',
      { dir: '../some/dir/' }
    );

    // set up databases and documents
    couchpenter.setUp(function (err, results) {
    });

    // delete databases and documents
    couchpenter.tearDown(function (err, results) {
    });

    // delete databases and documents, then set up databases and documents
    couchpenter.reset(function (err, results) {
    });

    // delete documents, then set up documents
    couchpenter.resetDocuments(function (err, results) {
    });

    // warm up all views specified in design documents
    couchpenter.warmViews(function (err, results) {
    });

    // warm up all views specified in design documents every minute (scheduled)
    couchpenter.warmViews('* * * * *', function (err, results) {
    });

Check out [lib/couchpenter](https://github.com/cliffano/couchpenter/blob/master/lib/couchpenter.js) for other available methods.

Configuration
-------------

Couchpenter setup file is just a simple JSON file:

    {
      "db1": [
        { "_id": "doc1", "foo": "bar" },
        { "_id": "doc2", "foo": "bar" },
        "path/to/doc3file.json"
      ],
      "db2": [
        { "_id": "doc4", "foo": "bar" },
        "path/to/modulename"
      ],
      "db3": [],
      "_replicator": {
        {
          "_id": "db1_pull",
          "source": "http://user:pass@remotehost:5984/db1",
          "target": "db1",
          "user_ctx": {
            "name": "user",
            "roles": ["_admin"]
          },
          "continuous": true
        }
      }
    }

Property keys are the names of the databases, property values are the documents in each database.

A document can be represented as:

* an object
* a file path string containing a JSON document, file name must end with .json
* a module path string

Paths are relative to current directory if it's used from command-line, or relative to opts.dir if it's used programmatically (defaults to current directory if opts.dir is not specified).

Colophon
--------

[Developer's Guide](http://cliffano.github.io/developers_guide.html#nodejs)

Build reports:

* [Code complexity report](http://cliffano.github.io/couchpenter/complexity/plato/index.html)
* [Unit tests report](http://cliffano.github.io/couchpenter/test/buster.out)
* [Test coverage report](http://cliffano.github.io/couchpenter/coverage/buster-istanbul/lcov-report/lib/index.html)
* [Integration tests report](http://cliffano.github.io/couchpenter/test-integration/cmdt.out)
* [API Documentation](http://cliffano.github.io/couchpenter/doc/dox-foundation/index.html)

Related Projects:

* [couchtato](http://github.com/cliffano/couchtato) - CouchDB documents iterator tool
