const fs = require('fs');
const tty = require('tty');
const async = require('async');
const crypto = require('crypto');
const hash = crypto.createHash('sha1');
const fetcher = require('./fetch.js');
const find = require('./binsearch.js');
const debug = require('util').debuglog('main');

let str = '';
let filenames = ['pwned-passwords-1.0.txt','pwned-passwords-update-1.txt','pwned-passwords-update-2.txt'];
const par = (process.env.NODE_DEBUG||'').indexOf('search') < 0;
if(par){
  debug('running in parallel');
} else {
  debug('running in series');
}
hash.on('readable', () => {
  const data = hash.read();
  if(data){
    let needle = data.toString('hex').toUpperCase();
    console.log(`Hashed password, attempting to locate...\n${needle}`);
    const findcb = (filename, cb, err, found) => {
      if(err){
        console.error(err);
        cb(err);
      }
      if(found){
        debug(`found in file: ${filename} :(`);
        cb(null, true, filename);
      } else {
        debug(`not found in file: ${filename}`);
        cb(null, false, filename);
      }
    };
    const call = par ? async.filter : async.filterSeries;
    call(filenames, (name, cb) => {
      debug(`Searching file: ${name}`);
      fs.stat(name, (err, stats) => {
        const done = (err) => {
          if(err){
            return cb(err);
          }
          find(needle, name, findcb.bind(null, name, cb));
        }
        if(err && err.code == 'ENOENT'){
          console.log(`${name} not found, fetching...`);
          return fetcher(fetcher[name], done);
        }
        done();
      });
    }, (err, result) => {
      if(err){
        console.error(err);
      }
      if(result.length){
        console.log(`found in file ${result} :(`);
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
