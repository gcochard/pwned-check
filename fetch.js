const async = require('async');
const request = require('request');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const lists = ['https://downloads.pwnedpasswords.com/passwords/pwned-passwords-1.0.txt.7z', 'https://downloads.pwnedpasswords.com/passwords/pwned-passwords-update-1.txt.7z', 'https://downloads.pwnedpasswords.com/passwords/pwned-passwords-update-2.txt.7z'];
const fetcher = (listUrl, cb) => {
  console.log(`fetching ${listUrl} ...`);
  let filename = path.basename(listUrl), rs;
  rs = fs.createWriteStream(filename, {flags: 'wx'});
  const decompress = () => {
    const decompressed = path.basename(filename, path.extname(filename));
    fs.stat(decompressed, (err, stats) => {
      if(err && err.code == 'ENOENT'){
        console.log(`unzipping ${filename} ...`);
        let child = spawn('7z', ['x', '-y', filename]);
        child.on('error', err => {
          console.error(err);
          return cb(err);
        });
        child.on('close', code => {
          console.log(`finished unzipping ${filename}`);
          return cb();
        });
        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
      } else {
        console.log(`${decompressed} exists, skipping decompression`);
        return cb();
      }
    });
  };
  let rq = request(listUrl);
  let skipped = false;
  rs.on('error', e => {
    if(e.code == 'EEXIST'){
      console.log(`warning: ${filename} already exists, skipping download...`);
      skipped = true;
      return decompress();
    }
  });
  rq.on('error', err => {
    console.error(err);
  }).on('end', () => {
    if(!skipped){
      decompress();
    }
  });
  // only fire the request if the file doesn't exist
  fs.stat(filename, (err, stats) => {
    if(err && err.code == 'ENOENT'){
      console.log('firing request');
      rq.pipe(rs);
    }
  });
};

if(!module.parent){
  async.map(lists, fetcher, (err, results) => {
    if(err){
      console.error(err);
    }
    // don't wait for the request to end
    process.exit();
  });
}
fetcher.lists = {};
lists.forEach(list => {
  fetcher.lists[path.basename(list)] = list;
});
module.exports = fetcher;
