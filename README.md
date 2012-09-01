Couchpenter [![http://travis-ci.org/cliffano/couchpenter](https://secure.travis-ci.org/cliffano/couchpenter.png?branch=master)](http://travis-ci.org/cliffano/couchpenter)
-----------

Couchpenter is CouchDB database and document setup tool.

Installation
------------

    npm install -g couchpenter 

Usage
-----

Create setup file example:

    couchpenter init

Execute a command against a CouchDB URL with specific Couchpenter configuration file:

    couchpenter <target> -u http://user:pass@localhost:5984 -f couchpenter.json

Targets:

<table>
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

    var couchpenter = new require('couchpenter').Couchpenter(
      'http://user:pass@localhost:5984',
      'couchpenter.json',
      process.cwd()
    );
    couchpenter.setUp(function (err) {
      // handle error
    });

Configuration
-------------

Couchpenter setup file is a just a simple JSON file containing:

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
          "continuous": true,
          "max_replication_retry_count": "infinity"
        }
      }
    }

Property keys are the names of the databases that should exist in CouchDB. If a database does not exist, it will then be created.

Property values are the documents that should exist in each database. If the document does not exist, it will then be created. If it already exists, it will then be updated.

A document can be represented as:

* an object
* a file path string containing a JSON document, file name must end with .json
* a module path string

Paths are relative to current directory if it's used from command-line, or relative to setUp's dir (process.cwd() in the usage example further above) if it's used programmatically.

Colophon
--------

Follow [@cliffano](http://twitter.com/cliffano) on Twitter.
