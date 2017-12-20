#!/usr/bin/env node
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
const debug = require('util').debuglog('main');
const {findHash, hashAndFind, setFindStrategy} = require('./index');
const yargs = require('yargs');
const args = yargs.boolean('web').argv;
if(args.web){
  setFindStrategy('web-range');
}

if(args._.length && args._){
  hashAndFind(args._[0], function(err, result, loc){
    if(err){
      console.error(err);
    }
    if(result){
      console.log(`found in file ${result} at line ${loc.toLocaleString()}`);
      //process.exit(1);
    } else {
      console.log('Not found, but could still be compromised');
    }
    process.exit(0);
  });
} else {
  async.forever((next) => {
    const hash = crypto.createHash('sha1');
    hash.on('readable', () => {
      const data = hash.read();
      if(data){
        findHash(data, (err, result, loc) => {
          if(err){
            console.error(err);
            next(err);
          }
          if(result){
            console.log(`found in file ${result} at line ${loc.toLocaleString()}`);
          } else {
            console.log('Not found, but could still be compromised');
          }
          next();
        });
      }
    });
    let hashBuf = '';
    process.stdout.write('enter password to sha (ctrl+c to cancel): ');
    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
    const listener = (c) => {
      const charcode = c.charCodeAt(0);
      debug(charcode);
      if(charcode == 0x03){
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', listener);
        process.stdout.write('\n');
        return next(new Error('cancelled'));
      }
      if(charcode == 0x7F || charcode == 0x08){
        // remove the char from the buffer
        hashBuf = hashBuf.slice(0, -1);
        // and remove the * from the terminal
        process.stdout.write('\b \b');
        return;
      }
      // fall-through
      if(charcode <= 0x13){
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', listener);
        process.stdout.write('\n');
        hash.write(hashBuf);
        hash.end();
        return;
      }
      hashBuf += c;
      process.stdout.write('*');
    };
    process.stdin.resume().on('data', listener);
  });
}
