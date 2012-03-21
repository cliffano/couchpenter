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

    var couchpenter = new Couchpenter();
    couchpenter.setUp('http://user:pass@localhost:5984', './couchpenter.json', function (err) {
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
       	   { "_id": "doc2", "foox": "barx" },
       	   "path/to/doc3file.json"
       	 ],
       	 "db2": [
           { "_id": "doc4", "fooy": "bary" }
       	 ]
       }
    }

Databases property specifies the name of the databases that should exist in CouchDB. If the database does not exist, then it will be created.

Documents property TODO

Colophon
--------

Follow [@cliffano](http://twitter.com/cliffano) on Twitter.
