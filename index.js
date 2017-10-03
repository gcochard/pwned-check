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
  let offset = 0;
  call(filenames, (name, cb) => {
    debug(`Searching file: ${name}`);
    fs.stat(name, (err, stats) => {
      const run = (err) => {
        if(err){
          return cb(err);
        }
        find(needle, name, (err, found, loc) => {
          if(err){
            console.error(err);
            cb(err);
          }
          if(found){
            debug(`found in file: ${name} at line ${loc}`);
            offset = loc;
          } else {
            debug(`not found in file: ${name}`);
          }
          cb(null, found);
        });
      }
      if(err && err.code == 'ENOENT'){
        console.log(`${name} not found, fetching...`);
        return fetcher(fetcher[name], run);
      }
      run();
    });
  }, (err, result, loc) => {
    if(err){
      return callback(err);
    }
    if(result){
      return callback(null, result, offset);
    } else {
      return callback(null, false);
    }
  });
}

function hashAndFind(password, callback){
  const hash = crypto.createHash('sha1');
  hash.on('readable', () => {
    const data = hash.read();
    if(data){
      findHash(data, (err, result, loc) => {
        if(err){
          console.error(err);
        }
        if(result){
          debug(`found in file ${result} at line ${loc.toLocaleString()}`);
          callback(null, result, loc);
        } else {
          debug('Not found, but could still be compromised');
          callback(null, false);
        }
      });
    }
  });
  hash.write(password);
  hash.end();
}

module.exports = { hashAndFind, findHash };
