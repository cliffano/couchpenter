Couchpenter [![http://travis-ci.org/cliffano/couchpenter](https://secure.travis-ci.org/cliffano/couchpenter.png?branch=master)](http://travis-ci.org/cliffano/couchpenter)
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

    couchpenter <task> -u http://user:pass@localhost:5984

Execute a task using custom setup file:

    couchpenter <task> -u http://user:pass@localhost:5984 -f somecouchpenter.json

Tasks:

<table>
<tr><th>Task</th><th>Description</th></tr>
<tr><td>setup</td><td>Create databases, then create/update documents.</td></tr>
<tr><td>setup-db</td><td>Create databases only.</td></tr>
<tr><td>setup-doc</td><td>Create documents only.</td></tr>
<tr><td>teardown</td><td>Delete databases, including documents.</td></tr>
<tr><td>teardown-db</td><td>Alias for teardown</td></tr>
<tr><td>teardown-doc</td><td>Delete documents only.</td></tr>
<tr><td>reset</td><td>Delete then recreate databases and documents.</td></tr>
<tr><td>reset-db</td><td>Alias for reset</td></tr>
<tr><td>reset-doc</td><td>Delete then recreate documents only.</td></tr>
</table>

Programmatically:

    // use default couchpenter.json setup file
    var couchpenter = new (require('couchpenter'))(
      'http://user:pass@localhost:5984'
    );

    // use custom setup file
    var couchpenter = new (require('couchpenter'))(
      'http://user:pass@localhost:5984',
      { setupFile: 'somecouchpenter.json' }
    );

    // use setup object (instead of setup file)
    var couchpenter = new (require('couchpenter'))(
      'http://user:pass@localhost:5984',
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
      'http://user:pass@localhost:5984',
      { prefix: 'testrun123_' }
    );

    // specify a base directory for the documents specified in setup file
    var couchpenter = new (require('couchpenter'))(
      'http://user:pass@localhost:5984',
      { dir: '../some/dir/' }
    );

    // set up databases and documents
    couchpenter.setUp(function (err, result) {
    });

    // delete databases and documents
    couchpenter.tearDown(function (err, result) {
    });

    // delete databases and documents, then set up databases and documents
    couchpenter.reset(function (err, result) {
    });

Configuration
-------------

Couchpenter setup file is a just a simple JSON file:

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

Paths are relative to current directory if it's used from command-line, or relative to dir opt if it's used programmatically (defaults to current directory).