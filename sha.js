const tty = require('tty');
const crypto = require('crypto');
const hash = crypto.createHash('sha1');
const find = require('./binsearch.js');

process.stdin.setRawMode(true);
process.stdout.write('enter password to sha: ');

process.stdin.setEncoding('utf8');
let str = '';
let filenames = ['pwned-passwords-1.0.txt','pwned-passwords-update-1.txt','pwned-passwords-update-2.txt'];
const par = process.env.NODE_DEBUG != 'search';
hash.on('readable', () => {
  const data = hash.read();
  if(data){
    let needle = data.toString('hex').toUpperCase();
    console.log(`Hashed password, attempting to locate...\n${needle}`);
    if(par){
      const findcb = (filename, err, found) => {
        if(err){
          console.error(err);
        }
        if(found){
          console.log(`found in file: ${filename} :(`);
        } else {
          console.log(`not found in file: ${filename}`);
        }
      };
      filenames.forEach(name => {
        console.log(`Searching file: ${name}`);
        find(needle, name, findcb.bind(null, name));
      });
    } else {
      const findcb = (filename, err, found) => {
        if(err){
          console.error(err);
        }
        if(found){
          console.log(`found in file: ${filename} :(`);
        } else {
          console.log(`not found in file: ${filename}`);
        }
        next();
      };
      const nextFactory = (arr) => {
        idx = 0;
        return () => {
          if(idx == arr.length){
            return;
          }
          let name = arr[idx];
          idx++;
          find(needle, name, findcb.bind(null, name));
        }
      };
      var next = nextFactory(filenames);
      next();
    }
  }
});

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
