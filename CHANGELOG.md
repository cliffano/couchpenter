### 0.2.3-pre
*

### 0.2.2
* Add warm-view target with cron scheduling support via couchpenter#warmViews.

### 0.2.1
* Add proxy support via http(s)_proxy environment variable

### 0.2.0
* Add setup-doc-overwrite, clean, and clean-db cli targets
* Support local document (with _local/* ID) by replacing bulk documents operation with one operation per database/document (tradeoff performance for completeness)
* Change cli output to display one database/document operation per line (used to be grouped)
* Change result format, was 2-dimensional array of strings, now 1-dimensional array of result objects in format { id: , error: , message: }. Error will be undefined when that particular result is a success.
* couchpenter#setUpDocuments now no longer allows update/overwrite (e.g. if documents already exist, it will result in conflict (419)), use couchpenter#setUpDocumentsOverwrite to update/overwrite documents (if it doesn't exist then create the document, if it already exists then update the document)

### 0.1.3
* Add couchpenter#resetDocuments to delete then reset documents programatically.

### 0.1.2
* Add URL setting via COUCHDB_URL environment variable

### 0.1.1
* Add dbSetup to Couchpenter opts to allow passing setup object as an alternative to passing setup file name

### 0.1.0
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
