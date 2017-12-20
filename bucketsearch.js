// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const fs = require('fs');
const HASH_SIZE = 40;
const LINE_LENGTH = 42;
const buckets = '01234567890ABCDEF'.split('');
const debug = require('util').debuglog('search');
const path = require('path');
var stat, open, read;

function checkArgs(...args){
  return args.some(num=>{ return num < 0; });
}

module.exports = function(strategy){
  debug(`strategy: ${strategy}`);
  if(strategy == 'local'){
    stat = fs.stat;
    open = fs.open;
    read = fs.read;
  } else if(strategy == 'web-range'){
    const request = require('request');
    const fetch = require('./fetch');
    debug(`gcsPrefix: ${fetch.gcsPrefix}`);
    stat = function(filename, cb){
      const fname = path.basename(filename);
      debug(`stat: ${filename} -> ${fname}`);
      return request.head(`${fetch.gcsPrefix}${fname}`, function(err, response, body){
        if(err) return cb(err);
        debug(`stat size: ${response.headers['content-length']}`);
        return cb(null, {size: response.headers['content-length']});
      });
    };
    // open is a no-op for web requests
    open = function(fname, mode, cb){
      debug('open called, ignoring');
      return cb(null, fname);
    };
    read = function(fd, buf, offset, length, pos, cb){
      const fname = path.basename(fd);
      const url = `${fetch.gcsPrefix}${fname}`;
      const range = `bytes=${pos}-${pos+length}`;
      debug(`searching ${url} for ${range}`);
      return request.get({url: url, headers: {'Range':range}}, function(err, response, body){
        if(err) return cb(err);
        buf.write(body);
        cb();
      });
    };
  } else if(strategy == 'fuzzy-web-range'){
    // calculate the offset, then fetch from pos-<jitter1> to pos+40+<jitter2>
  }
  return function radixSearchSha(needle, filename, cb){
    const needleInt = parseInt(needle, 16);
    const MAX_HASH = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    const EXPECTED_LOCATION = needleInt / MAX_HASH;
    stat(filename, (err, stats) => {
      if(err) return cb(err);

      const end = stats.size;
      let visited = {};
      open(filename, 'r', (err, fd) => {
        if(err) return cb(err);

        // each line is LINE_LENGTH bytes long (with \r\n at the end)
        // we can estimate the position of each leading character as
        // it should be uniformly distributed with 1/16th of the file covering each one
        let b = needle.charCodeAt(0) - 48;
        if(b > 15){ b -= 7; }
        let iterations = 0;
        let currChar = 0;
        function bucketSearch(start, bucket, len) {
          if(checkArgs(start, bucket, len)){
            debug(`crap, nan found!\nstart: ${start}, bucket: ${bucket}, len: ${len}`);
            return cb(null, false);
          }
          debug(`${filename} - start: ${start}, bucket: ${bucket}, len: ${len} % of file: ${Math.floor(100*(len-start)/end)}, total lines left: ${(len-start)/42}/${end/42}`);
          if(start >= len){
            debug(`start overran length.\nstart: ${start}, bucket: ${bucket}, len: ${len}`);
            // we have exhausted the search, not found
            return cb(null, false);
          }
          let nextBucket = Math.max(0, Math.min(16, bucket));
          let multiplier = nextBucket/16;
          let pos = (len - start) * multiplier + start;
          // small optimization to target the expected location first
          if(bucket > 0 && bucket < 1){
            pos = end * bucket;
          }
          pos -= pos % LINE_LENGTH;
          if(pos >= end){
            return cb(null, false);
          }
          // make sure the position is divisible by LINE_LENGTH to get a hash at the beginning
          let buf = Buffer.alloc(HASH_SIZE);
          iterations++;
          // read HASH_SIZE bytes from pos, to make sure we have a complete hash
          read(fd, buf, 0, HASH_SIZE, pos, (err/*, bytesRead, buf */) => {
            let currHash = buf.toString();
            if(visited[currHash]){
              debug(`${filename}: loop detected`);
            }
            visited[currHash] = true;
            debug(`${filename} - pos: ${pos}\ncurrent hash: ${currHash}`);
            let newbucket = bucket;
            if(currHash < needle) {
              pos += LINE_LENGTH;
              debug(`${filename} - currHash < needle`);
              // we need to go further into the file
              if(currHash.slice(0,currChar) < needle.slice(0,currChar)){
                // we are not at the right bucket yet
                newbucket++;
                debug(`${filename} - we are not at the right bucket yet, start: ${pos}, newbucket: ${buckets[newbucket]}, len: ${len}`);
                if(newbucket > 15){
                  debug(`${filename} - at the last bucket, search again`);
                  newbucket = 0;
                }
              } else if(currHash.slice(0,currChar) > needle.slice(0,currChar)){
                // we overran the bucket
                newbucket--;
                debug(`${filename} - we overran the bucket, start: ${pos}, newbucket: ${buckets[newbucket]}, len: ${len}`);
              } else {
                // in the right bucket, step to the next char
                currChar++;
                debug(`${filename} - currChar: ${currChar}`);
                if(currChar > HASH_SIZE){
                  // at the last char, just keep going
                  currChar--;
                  debug(`${filename} - currChar > HASH_SIZE`);
                }
                newbucket = needle.charCodeAt(currChar) - 48;
                newbucket -= newbucket > 15 ? 7 : 0;
                debug(`${filename} - in the right bucket, start: ${pos}, newbucket: ${buckets[newbucket]}, len: ${len}`);
              }
              bucketSearch(pos, newbucket, len);
            } else if(currHash > needle) {
              debug(`${filename} - currHash > needle`);
              // we went too far into the file
              if(currHash.slice(0,currChar) < needle.slice(0,currChar)){
                // we are not at the right bucket yet
                newbucket++;
                debug(`${filename} - we are not at the right bucket yet, start: ${start}, newbucket: ${buckets[newbucket]}, len: ${pos}`);
                if(newbucket > 15){
                  debug(`${filename} - at the last bucket, decrementing start to cause jitter`);
                  start -= LINE_LENGTH;
                  newbucket-=2;
                } else if(newbucket < 0){
                  debug(`${filename} - at the first bucket, decrementing end to cause jitter`);
                  len -= LINE_LENGTH;
                  newbucket = 0;
                }
              } else if(currHash.slice(0,currChar) > needle.slice(0,currChar)){
                // we overran the bucket
                newbucket--;
                debug(`${filename} - we overran the bucket, start: ${start}, newbucket: ${buckets[newbucket]}, len: ${pos}`);
              } else {
                // in the right bucket, step to the next char
                currChar++;
                debug(`${filename} - currChar: ${currChar}`);
                if(currChar > HASH_SIZE){
                  // at the last char, just keep going
                  currChar--;
                  debug(`${filename} - currChar > HASH_SIZE`);
                }
                newbucket = needle.charCodeAt(currChar) - 48;
                newbucket -= newbucket > 15 ? 7 : 0;
                debug(`${filename} - in the right bucket, start: ${start}, newbucket: ${buckets[newbucket]}, len: ${pos}`);
              }
              bucketSearch(start, newbucket, pos);
            } else {
              // ffffffffffffound!
              debug(`found after ${iterations} iterations`);
              return cb(null, true, pos / LINE_LENGTH);
            }
          });
        }
        bucketSearch(0, EXPECTED_LOCATION, end);
      });
    });
  };
};
