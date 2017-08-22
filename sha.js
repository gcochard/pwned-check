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
const tty = require('tty');
const async = require('async');
const crypto = require('crypto');
const hash = crypto.createHash('sha1');
const fetcher = require('./fetch.js');
const find = require('./bucketsearch.js');
const debug = require('util').debuglog('main');

let str = '';
let filenames = ['pwned-passwords-1.0.txt','pwned-passwords-update-1.txt','pwned-passwords-update-2.txt'];
const par = (process.env.NODE_DEBUG||'').indexOf('par') < 0;
if(par){
  debug('running in parallel');
} else {
  debug('running in series');
}

function findHash(data, callback){
  let needle = data.toString('hex').toUpperCase();
  console.log(`Hashed password, attempting to locate...\n${needle}`);
  const call = par ? async.detect : async.detectSeries;
  call(filenames, (name, cb) => {
    debug(`Searching file: ${name}`);
    fs.stat(name, (err, stats) => {
      const done = (err) => {
        if(err){
          return cb(err);
        }
        find(needle, name, (err, found) => {
          if(err){
            console.error(err);
            cb(err);
          }
          if(found){
            debug(`found in file: ${name}`);
            cb(null, true, name);
          } else {
            debug(`not found in file: ${name}`);
            cb(null, false, name);
          }
        });
      }
      if(err && err.code == 'ENOENT'){
        console.log(`${name} not found, fetching...`);
        return fetcher(fetcher[name], done);
      }
      done();
    });
  }, (err, result) => {
    if(err){
      return callback(err);
    }
    if(result){
      return callback(null, result);
    } else {
      return callback(null, false);
    }
  });
}
hash.on('readable', () => {
  const data = hash.read();
  if(data){
    findHash(data, (err, result) => {
      if(err){
        console.error(err);
      }
      if(result){
        console.log(`found in file ${result}`);
        //process.exit(1);
      } else {
        console.log('Not found, but could still be compromised');
      }
      process.exit(0);
    });
  }
});

if(process.argv.length > 2 && process.argv[2]){
  hash.write(process.argv[2]);
  hash.end();
} else {
  process.stdout.write('enter password to sha: ');
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.resume().on('data', (c) => {
    if(c.charCodeAt(0) <= 0x13){
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      hash.end();
      return;
    }
    hash.write(c);
    process.stdout.write('*');
  });
}
