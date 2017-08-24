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

const async = require('async');
const request = require('request');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const lists = ['https://downloads.pwnedpasswords.com/passwords/pwned-passwords-1.0.txt.7z', 'https://downloads.pwnedpasswords.com/passwords/pwned-passwords-update-1.txt.7z', 'https://downloads.pwnedpasswords.com/passwords/pwned-passwords-update-2.txt.7z'];
const unzipCmds = {
  'darwin': {binary:'7z', args:['x', '-y']},
  'linux': {binary:'p7zip', args:['-d']}
};
const platform = os.platform();
// default to linux
const unzipCmd = unzipCmds[platform] || unzipCmds.linux;
const fetcher = (listUrl, cb) => {
  const filename = path.basename(listUrl);
  const decompressed = path.basename(filename, path.extname(filename));
  fs.stat(decompressed, (err, stats) => {
    if(!err || err.code != 'ENOENT'){
      console.log(`${decompressed} exists, skipping download and decompression`);
      return cb();
    }
    console.log(`fetching ${listUrl} ...`);
    let rs = fs.createWriteStream(filename, {flags: 'wx', defaultEncoding: 'binary', mode: 0o644});
    const decompress = () => {
      const decompressed = path.basename(filename, path.extname(filename));
      fs.stat(decompressed, (err, stats) => {
        if(err && err.code == 'ENOENT'){
          console.log(`unzipping ${filename} ...`);
          let child = spawn(unzipCmd.binary, [...unzipCmd.args, filename]);
          child.on('error', err => {
            if(err.code == 'ENOENT'){
              return cb(new Error(`Error, 7z binary: ${unzipCmd.binary} not found. Please ensure it is installed and in your PATH`));
            }
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
    }).on('data', chunk => {
      rs.write(chunk);
    }).on('end', () => {
      rs.end();
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
