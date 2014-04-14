var fs = require('fs-ext');

var MalformedTTFError = function() {};

var SEEK_SET = 0,
    SEEK_CUR = 1,
    SEEK_END = 2;

var readbe32, getByte, putByte, ftell;
readbe32 = function(fd) {
    var buffer = new Buffer(4);
    fs.readSync(fd, buffer, 0, buffer.length, null);
    return buffer.readUInt32BE(0);
};
getByte = function(fd) {
    var buffer = new Buffer(1);
    var bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
    return bytesRead === 0 ? -1 : buffer.readUInt8(0);
};
putByte = function(fd, b) {
    var buffer = new Buffer([b]);
    fs.writeSync(fd, buffer, 0, buffer.length, null);
};
ftell = function(fd) {
    return fs.seekSync(fd, 0, SEEK_CUR);
};

module.exports = function ttembed(config, callback) {
    fs.open(config.filename, config.dryRun ? 'r' : 'r+', function(error, fd) {
        if (error) {
            return callback(error);
        }

        var oldFsTypeString;

        var x;
        var type = new Buffer(4);
        
        var ftype = readbe32(fd);
        if (ftype !== 0x00010000 && ftype !== 0x4f54544f) {
            fs.closeSync(fd);
            return callback(filename + ': Not TTF/OTF');
        }
        try {
            fs.seekSync(fd, 12, 0);
            for (;;) {
                for (x=0; x<4; x++) {
                    if (-1 === (type[x] = getByte(fd))) {
                        throw new MalformedTTFError(); 
                    }
                }
                if (type.toString() === 'OS/2') {
                    var length;
                    var loc, fstype, oldfstype, sum=0;
                    loc = ftell(fd); /* location for checksum */
                    readbe32(fd);
                    fstype = readbe32(fd);
                    length = readbe32(fd);
                    fs.seekSync(fd, fstype + 8, SEEK_SET);
                    oldfstype = getByte(fd) << 8;
                    oldfstype |= getByte(fd);
                    if (oldfstype === 0) {
                        oldFsTypeString = '0000';
                    } else {
                        oldFsTypeString = ('0000' + oldfstype.toString(16)).slice(-4);
                        if (! config.dryRun) {
                            fs.seekSync(fd, fstype + 8, SEEK_SET);
                            putByte(fd, 0);
                            putByte(fd, 0);
                            fs.seekSync(fd, fstype, SEEK_SET);
                            for (x=length; x>0; x-=4) {
                                sum += readbe32(fd);
                            }
                            fs.seekSync(fd, loc, SEEK_SET); /* write checksum */
                            putByte(fd, sum >> 24);
                            putByte(fd, 255 & (sum >> 16));
                            putByte(fd, 255 & (sum >> 8));
                            putByte(fd, 255 & sum);
                        }
                    }
                    fs.closeSync(fd);
                    break;
                }
                for (x=12; x--;) {
                    if (-1 === getByte(fd)) {
                        throw new MalformedTTFError();
                    }
                }
            }
        } catch (e) {
            fs.closeSync(fd);
            if (e instanceof MalformedTTFError) {
                return callback(filename + ': Malformed TTF');   
            }
            throw e;
        }
        return callback(null, oldFsTypeString);
    });
};
