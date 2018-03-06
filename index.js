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

const crypto = require('crypto');
const util = require('util');
const request = require('request');
const debug = util.debuglog('main');
const apiPrefix = 'https://api.pwnedpasswords.com/range';

function sha1p(value){
  let hash = value;
  let prefix = hash.substring(0,5);
  let rest = hash.substring(5,40);
  return [prefix, rest];
}

function find(needle, callback){
  let [prefix, rest] = sha1p(needle);
  request(`${apiPrefix}/${prefix}`, (err, res, list) => {

    for(let line of list.split('\n')){
      line = line.trim();
      if(line.split(':')[0] == rest){
        debug('test');
        debug(line);
        let count = line.split(':')[1].trim();
        debug(`line: "${line}", rest: ${rest}, count: ${count}`)
        return callback(null, true, count);
      }
    }
    return callback(null, false);
  });
}

function findHash(data, callback){
  let needle = data.toString('hex').toUpperCase();
  console.log(`Hashed password, attempting to locate...\n${needle}`);
  find(needle, (err, found, times) => {
    if(err){
      console.error(err);
      return callback(err);
    }
    if(found){
      return callback(null, found, times);
    }
    return callback(null, found);
  });
}

function hashAndFind(password, callback){
  const hash = crypto.createHash('sha1');
  hash.on('readable', () => {
    const data = hash.read();
    if(data){
      findHash(data, (err, result, times) => {
        if(err){
          console.error(err);
        }
        if(result){
          debug(`Pwned ${times} times! Consider changing the password!`);
          callback(null, result, times);
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
