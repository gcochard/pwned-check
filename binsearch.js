const fs = require('fs');
const HASH_SIZE = 40;
const LINE_LENGTH = 42;
debug = require('util').debuglog('search');

function checkNaN(...args){
  return args.some(num=>{ return num > 0 == false && num < 0 == false && num != 0; });
}

module.exports = function radixSearchSha(needle, filename, cb){
  const needleInt = parseInt(needle, 16);
  fs.stat(filename, (err, stats) => {
    if(err) return cb(err);

    const end = stats.size;
    let visited = {};
    fs.open(filename, 'r', (err, fd) => {
      if(err) return cb(err);

      // each line is LINE_LENGTH bytes long (with \r\n at the end)
      // we can estimate the position of each leading character as
      // it should be uniformly distributed with 1/16th of the file covering each one
      let b = needle.charCodeAt(0) - 48;
      if(b > 15){ b -= 7; }
      let iterations = 0;
      let beyond = false;
      let currChar = 0;
      function bucketSearch(start, bucket, len) {
        if(checkNaN(start, bucket, len)){
          debug(`crap, nan found!\nstart: ${start}, bucket: ${bucket}, len: ${len}`);
          return cb(null, false);
        }
        debug(`${filename} - start: ${start}, bucket: ${bucket}, len: ${len} % of file: ${Math.floor(100*(len-start)/end)}, total lines left: ${(len-start)/42}/${end/42}`);
        if(start >= len){
          debug(`crap, start overran length!\nstart: ${start}, bucket: ${bucket}, len: ${len}`);
          // we have exhausted the search
          return cb(null, false);
        }
        if(bucket > 15){ bucket = 15; }
        let multiplier = bucket/16;
        let pos = (len - start) * multiplier + start;
        pos -= pos % LINE_LENGTH;
        if(pos >= end){
          return cb(null, false);
        }
        // make sure the position is divisible by LINE_LENGTH to get a hash at the beginning
        let buf = Buffer.alloc(HASH_SIZE);
        // read HASH_SIZE bytes from pos, to make sure we have a complete hash
        if(iterations > 100){
          debug(`iterations going crazy, at ${iterations}`);
          return cb(new Error(`don't want to blow the stack`));
        }
        iterations++;
        fs.read(fd, buf, 0, HASH_SIZE, pos, (err, bytesRead/*, buf */) => {
          let str = buf.toString();
          if(visited[str]){
            debug(`${filename}: loop detected`);
          }
          visited[str] = true;
          debug(`${filename} - pos: ${pos}\ncurrent hash: ${str}`);
          // str is the hash
          let newbucket = bucket;
          if(str < needle) {
            pos += LINE_LENGTH;
            debug(`${filename} - str < needle`);
            // we need to go further
            if(str[currChar] < needle[currChar]){
              // we are not at the right bucket yet
              newbucket++;
              debug(`${filename} - we are not at the right bucket yet, start: ${pos}, newbucket: ${newbucket}, len: ${len}`);
              if(newbucket > 15){
                debug(`${filename} - at the last bucket, incrementing start to cause jitter`);
                pos += LINE_LENGTH;
                newbucket = 1;
              }
            } else if(str[currChar] > needle[currChar]){
              // we overran the bucket
              newbucket--;
              debug(`${filename} - we overran the bucket, start: ${pos}, newbucket: ${newbucket}, len: ${len}`);
            } else {
              // in the right bucket, step to the next char
              currChar += 1;
              debug(`${filename} - currChar: ${currChar}`);
              if(currChar > HASH_SIZE){
                debug(`${filename} - currChar > HASH_SIZE`);
                return cb(null, false);
              }
              newbucket = needle.charCodeAt(currChar) - 48;
              newbucket -= newbucket > 15 ? 7 : 0;
              debug(`${filename} - bucket: ${newbucket}`);
              debug(`${filename} - in the right bucket, start: ${pos}, newbucket: ${newbucket}, len: ${len}`);
            }
            bucketSearch(pos, newbucket, len);
          } else if(str > needle) {
            debug(`${filename} - str > needle`);
            beyond = true;
            // we need to step back
            if(str[currChar] < needle[currChar]){
              // we are not at the right bucket yet
              newbucket++;
              debug(`${filename} - we are not at the right bucket yet, start: ${start}, newbucket: ${newbucket}, len: ${pos}`);
              if(newbucket > 15){
                debug(`${filename} - at the last bucket, decrementing start to cause jitter`);
                start -= LINE_LENGTH;
                newbucket-=2;
              }
            } else if(str[currChar] > needle[currChar]){
              // we overran the bucket
              newbucket--;
              debug(`${filename} - we overran the bucket, start: ${start}, newbucket: ${newbucket}, len: ${pos}`);
            } else {
              // in the right bucket, step to the next char
              currChar += 1;
              debug(`${filename} - currChar: ${currChar}`);
              if(currChar > HASH_SIZE){
                debug(`${filename} - currChar > HASH_SIZE`);
                return cb(null, false);
              }
              newbucket = needle.charCodeAt(currChar) - 48;
              newbucket -= newbucket > 15 ? 7 : 0;
              debug(`${filename} - in the right bucket, start: ${start}, newbucket: ${newbucket}, len: ${pos}`);
              debug(`${filename} - bucket: ${newbucket}`);
            }
            bucketSearch(start, newbucket, pos);
          } else {
            // ffffffffffffound!
            debug(`found after ${iterations} iterations`);
            console.log(`found after ${iterations} iterations`);
            return cb(null, true);
          }
        });
      }
      bucketSearch(0, b, end);
    });
  });
};
