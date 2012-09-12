### 0.1.0 (SNAPSHOT)
* Re-release 0.0.8 as 0.1.0 due to interface change

### 0.0.8
* Add reset, reset-db, and reset-doc targets; add Couchpenter#reset method
* Add prefix option to automatically prefix all database names
* Change Couchpenter constructor from (url, setupFile, dir) to (url, opts), with setupFile and dir specified in opts

### 0.0.7
* Inspect invalid item object to assist troubleshooting
* Fix error handling while retrieving database info
* Add -d flag to specify the base directory of document path specified in config file
* Move default arg handling from cli to couchpenter module since the API is exposed programmatically

### 0.0.6
* Fix setup doc handling when there's no doc to set up

### 0.0.5
* Use cly for config, init, and exit handling
* Add teardown target to delete databases
* Add setup-db and setup-doc targets
* Add teardown-db and teardown-doc targets

### 0.0.4 
* Fix bulk document fetch to work with CouchDB 1.1.1

### 0.0.3
* Fix executable binary name

### 0.0.2
* Simplify config file structure to db-docs mapping

### 0.0.1
* Initial version
