const request = require('request');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const lists = ['https://downloads.pwnedpasswords.com/passwords/pwned-passwords-1.0.txt.7z', 'https://downloads.pwnedpasswords.com/passwords/pwned-passwords-update-1.txt.7z', 'https://downloads.pwnedpasswords.com/passwords/pwned-passwords-update-2.txt.7z'];
const fetcher = (listUrl, cb) => {
  console.log(`fetching ${listUrl} ...`);
  let filename = path.basename(listUrl), rs;
  rs = fs.createWriteStream(filename, {flags: 'wx'});
  rs.on('error', e => {
    if(e.code == 'EEXIST'){
      console.log(`warning: ${filename} already exists, skipping download...`);
      return;
    }
  });
  request(listUrl).on('error', err => {
    console.error(err);
  }).on('end', () => {
    console.log(`unzipping ${filename} ...`);
    let child = spawn('7z', ['x', '-y', filename]);
    child.on('error', err => {
      console.error(err);
      return cb(err);
    });
    child.on('close', code => {
      console.log(`finished unzipping ${filename}`);
      if(cb){
        return cb();
      }
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }).pipe(rs);
};

if(!module.parent){
  lists.forEach(fetcher);
}
fetcher.lists = {};
lists.forEach(list => {
  fetcher.lists[path.basename(list)] = list;
});
module.exports = fetcher;
