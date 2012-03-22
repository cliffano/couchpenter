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

Set up databases and documents:

    couchpenter setup -u http://user:pass@localhost:5984 -f ./couchpenter.json

Programmatically:

    var couchpenter = new require('couchpenter').Couchpenter();
    couchpenter.setUp('http://user:pass@localhost:5984', './couchpenter.json', process.cwd(), function (err) {
      // do something
    });

Configuration
-------------

Couchpenter setup file is a just a simple JSON file:

    {
       "databases": ["db1", "db2", "db3" ],
       "documents": {
       	 "db1": [
       	   { "_id": "doc1", "foo": "bar" },
       	   { "_id": "doc2", "foo": "bar" },
       	   "path/to/doc3file.json"
       	 ],
       	 "db2": [
           { "_id": "doc4", "foo": "bar" },
           "path/to/modulename"
       	 ]
       }
    }

Databases property specifies the name of the databases that should exist in CouchDB. If the database does not exist, then it will be created.

Documents property specifies a mapping between the database and the documents that should exist in that database. If the document does not exist, then it will be created. If it already exists, then it will be updated.
The document value can be:
* an object
* a file path string containing a JSON document, file name must end with .json
* a module path string, path must be relative to current directory if it's used from command-line, or relative to setUp() moduleDir if it's used programmatically

Colophon
--------

Follow [@cliffano](http://twitter.com/cliffano) on Twitter.
