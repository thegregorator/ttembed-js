ttembed-js
==========

This module removes embedding limitations from TrueType fonts, by setting the
fsType field in the OS/2 table to zero (Installable Embedding mode).

Note that using this to embed fonts which you are not licensed to embed
does not make it legal.

This version is written by Greg Littlefield and based heavily upon the work
of Paul Flo Williams (https://github.com/hisdeedsaredust/ttembed), which
is based upon the work of Tom Murphy VII
(http://carnage-melon.tom7.org/embed/).

All versions of this code so far are public domain. Use at your own risk...

Installation
--------------

Install via npm:

    $ npm install ttembed-js 

Usage
-----

By default, ttembed modifies the specified file, switching it to Installable Embedding mode.

```js
var ttembed = require('ttembed-js');

ttembed({
    filename: './path/to/my_font.ttf'
}, function(error, oldFsType) {
    if (error) {
        console.error('Something went wrong.', error);
        return;
    }
    if (oldFsType === '0000') {
        console.log('fsType was already 0000; no action taken.');
    } else {
        console.log('Successfully changed fsType from ' + oldFsType + ' to 0000.');
    }
});
```

The config can be augmented with a ``dryRun`` property, which parses the font and reads the fsType without modifying the file.

```js
var ttembed = require('ttembed-js');

ttembed({
    filename: './path/to/my_font.ttf',
    dryRun: true
}, function(error, fsType) {
    if (error) {
        console.error('Something went wrong.', error);
        return;
    }
    if (fsType === '0000') {
        console.log('fsType is 0000; no action will be taken if run with {dryRun: false}.');
    } else {
        console.log('Current fsType is ' + fsType + '; running again with {dryRun: false} will modify the file.');
    }
});
```