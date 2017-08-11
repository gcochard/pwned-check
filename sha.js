const fs = require('fs');
const tty = require('tty');
const async = require('async');
const crypto = require('crypto');
const hash = crypto.createHash('sha1');
const find = require('./binsearch.js');

let str = '';
let filenames = ['pwned-passwords-1.0.txt','pwned-passwords-update-1.txt','pwned-passwords-update-2.txt'];
const par = process.env.NODE_DEBUG != 'search';
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
        console.log(`found in file: ${filename} :(`);
        cb(null, true);
      } else {
        console.log(`not found in file: ${filename}`);
        cb(null, false);
      }
    };
    const call = par ? async.some : async.someSeries;
    call(filenames, (name, cb) => {
      console.log(`Searching file: ${name}`);
      fs.stat(name, (err, stats) => {
        const done = find.bind(null, needle, name, findcb.bind(null, name, cb));
        if(err && err.code == 'ENOENT'){
          console.log(`${name} not found, fetching...`);
          let fetcher = require('./fetch.js');
          return fetcher(fetcher[name], done);
        }
        done();
      });
    }, (err, result) => {
      if(err){
        console.error(err);
      }
      if(result){
        console.log(`found :(`);
        process.exit(1);
      }
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
