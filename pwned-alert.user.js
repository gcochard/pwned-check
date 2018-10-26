// ==UserScript==
// @name         Pwned alert
// @namespace    http://gcochard.github.io/pwned-check/pwned-alert.user.js
// @version      1.0
// @description  Check password fields against the pwned password API using k-anonymity and report how many times it's been pwned.
// @author       Greg Cochard
// @match        *://*/*
// @grant        none
// ==/UserScript==


(function() {
    "use strict";
    function i(n) {
        n ? (t[0] = t[16] = t[1] = t[2] = t[3] = t[4] = t[5] = t[6] = t[7] = t[8] = t[9] = t[10] = t[11] = t[12] = t[13] = t[14] = t[15] = 0,
        this.blocks = t) : this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.h0 = 1732584193;
        this.h1 = 4023233417;
        this.h2 = 2562383102;
        this.h3 = 271733878;
        this.h4 = 3285377520;
        this.block = this.start = this.bytes = 0;
        this.finalized = this.hashed = !1;
        this.first = !0
    }
    var u = typeof window == "object" ? window : {}, e = !u.JS_SHA1_NO_NODE_JS && typeof process == "object" && process.versions && process.versions.node, f;
    e && (u = global);
    var h = !u.JS_SHA1_NO_COMMON_JS && typeof module == "object" && module.exports
      , c = typeof define == "function" && define.amd
      , n = "0123456789abcdef".split("")
      , l = [-2147483648, 8388608, 32768, 128]
      , r = [24, 16, 8, 0]
      , o = ["hex", "array", "digest", "arrayBuffer"]
      , t = []
      , s = function(n) {
        return function(t) {
            return new i(!0).update(t)[n]()
        }
    }
      , a = function() {
        var n = s("hex"), t, r;
        for (e && (n = v(n)),
        n.create = function() {
            return new i
        }
        ,
        n.update = function(t) {
            return n.create().update(t)
        }
        ,
        t = 0; t < o.length; ++t)
            r = o[t],
            n[r] = s(r);
        return n
    }
      , v = function(n) {
        var t = require("crypto")
          , i = require("buffer").Buffer;
        return function(r) {
            if (typeof r == "string")
                return t.createHash("sha1").update(r, "utf8").digest("hex");
            if (r.constructor === ArrayBuffer)
                r = new Uint8Array(r);
            else if (r.length === undefined)
                return n(r);
            return t.createHash("sha1").update(new i(r)).digest("hex")
        }
    };
    i.prototype.update = function(n) {
        var o;
        if (!this.finalized) {
            o = typeof n != "string";
            o && n.constructor === u.ArrayBuffer && (n = new Uint8Array(n));
            for (var f, e = 0, t, s = n.length || 0, i = this.blocks; e < s; ) {
                if (this.hashed && (this.hashed = !1,
                i[0] = this.block,
                i[16] = i[1] = i[2] = i[3] = i[4] = i[5] = i[6] = i[7] = i[8] = i[9] = i[10] = i[11] = i[12] = i[13] = i[14] = i[15] = 0),
                o)
                    for (t = this.start; e < s && t < 64; ++e)
                        i[t >> 2] |= n[e] << r[t++ & 3];
                else
                    for (t = this.start; e < s && t < 64; ++e)
                        f = n.charCodeAt(e),
                        f < 128 ? i[t >> 2] |= f << r[t++ & 3] : f < 2048 ? (i[t >> 2] |= (192 | f >> 6) << r[t++ & 3],
                        i[t >> 2] |= (128 | f & 63) << r[t++ & 3]) : f < 55296 || f >= 57344 ? (i[t >> 2] |= (224 | f >> 12) << r[t++ & 3],
                        i[t >> 2] |= (128 | f >> 6 & 63) << r[t++ & 3],
                        i[t >> 2] |= (128 | f & 63) << r[t++ & 3]) : (f = 65536 + ((f & 1023) << 10 | n.charCodeAt(++e) & 1023),
                        i[t >> 2] |= (240 | f >> 18) << r[t++ & 3],
                        i[t >> 2] |= (128 | f >> 12 & 63) << r[t++ & 3],
                        i[t >> 2] |= (128 | f >> 6 & 63) << r[t++ & 3],
                        i[t >> 2] |= (128 | f & 63) << r[t++ & 3]);
                this.lastByteIndex = t;
                this.bytes += t - this.start;
                t >= 64 ? (this.block = i[16],
                this.start = t - 64,
                this.hash(),
                this.hashed = !0) : this.start = t
            }
            return this
        }
    }
    ;
    i.prototype.finalize = function() {
        if (!this.finalized) {
            this.finalized = !0;
            var n = this.blocks
              , t = this.lastByteIndex;
            n[16] = this.block;
            n[t >> 2] |= l[t & 3];
            this.block = n[16];
            t >= 56 && (this.hashed || this.hash(),
            n[0] = this.block,
            n[16] = n[1] = n[2] = n[3] = n[4] = n[5] = n[6] = n[7] = n[8] = n[9] = n[10] = n[11] = n[12] = n[13] = n[14] = n[15] = 0);
            n[15] = this.bytes << 3;
            this.hash()
        }
    }
    ;
    i.prototype.hash = function() {
        for (var n = this.h0, t = this.h1, i = this.h2, r = this.h3, u = this.h4, e, f, s = this.blocks, o = 16; o < 80; ++o)
            f = s[o - 3] ^ s[o - 8] ^ s[o - 14] ^ s[o - 16],
            s[o] = f << 1 | f >>> 31;
        for (o = 0; o < 20; o += 5)
            e = t & i | ~t & r,
            f = n << 5 | n >>> 27,
            u = f + e + u + 1518500249 + s[o] << 0,
            t = t << 30 | t >>> 2,
            e = n & t | ~n & i,
            f = u << 5 | u >>> 27,
            r = f + e + r + 1518500249 + s[o + 1] << 0,
            n = n << 30 | n >>> 2,
            e = u & n | ~u & t,
            f = r << 5 | r >>> 27,
            i = f + e + i + 1518500249 + s[o + 2] << 0,
            u = u << 30 | u >>> 2,
            e = r & u | ~r & n,
            f = i << 5 | i >>> 27,
            t = f + e + t + 1518500249 + s[o + 3] << 0,
            r = r << 30 | r >>> 2,
            e = i & r | ~i & u,
            f = t << 5 | t >>> 27,
            n = f + e + n + 1518500249 + s[o + 4] << 0,
            i = i << 30 | i >>> 2;
        for (; o < 40; o += 5)
            e = t ^ i ^ r,
            f = n << 5 | n >>> 27,
            u = f + e + u + 1859775393 + s[o] << 0,
            t = t << 30 | t >>> 2,
            e = n ^ t ^ i,
            f = u << 5 | u >>> 27,
            r = f + e + r + 1859775393 + s[o + 1] << 0,
            n = n << 30 | n >>> 2,
            e = u ^ n ^ t,
            f = r << 5 | r >>> 27,
            i = f + e + i + 1859775393 + s[o + 2] << 0,
            u = u << 30 | u >>> 2,
            e = r ^ u ^ n,
            f = i << 5 | i >>> 27,
            t = f + e + t + 1859775393 + s[o + 3] << 0,
            r = r << 30 | r >>> 2,
            e = i ^ r ^ u,
            f = t << 5 | t >>> 27,
            n = f + e + n + 1859775393 + s[o + 4] << 0,
            i = i << 30 | i >>> 2;
        for (; o < 60; o += 5)
            e = t & i | t & r | i & r,
            f = n << 5 | n >>> 27,
            u = f + e + u - 1894007588 + s[o] << 0,
            t = t << 30 | t >>> 2,
            e = n & t | n & i | t & i,
            f = u << 5 | u >>> 27,
            r = f + e + r - 1894007588 + s[o + 1] << 0,
            n = n << 30 | n >>> 2,
            e = u & n | u & t | n & t,
            f = r << 5 | r >>> 27,
            i = f + e + i - 1894007588 + s[o + 2] << 0,
            u = u << 30 | u >>> 2,
            e = r & u | r & n | u & n,
            f = i << 5 | i >>> 27,
            t = f + e + t - 1894007588 + s[o + 3] << 0,
            r = r << 30 | r >>> 2,
            e = i & r | i & u | r & u,
            f = t << 5 | t >>> 27,
            n = f + e + n - 1894007588 + s[o + 4] << 0,
            i = i << 30 | i >>> 2;
        for (; o < 80; o += 5)
            e = t ^ i ^ r,
            f = n << 5 | n >>> 27,
            u = f + e + u - 899497514 + s[o] << 0,
            t = t << 30 | t >>> 2,
            e = n ^ t ^ i,
            f = u << 5 | u >>> 27,
            r = f + e + r - 899497514 + s[o + 1] << 0,
            n = n << 30 | n >>> 2,
            e = u ^ n ^ t,
            f = r << 5 | r >>> 27,
            i = f + e + i - 899497514 + s[o + 2] << 0,
            u = u << 30 | u >>> 2,
            e = r ^ u ^ n,
            f = i << 5 | i >>> 27,
            t = f + e + t - 899497514 + s[o + 3] << 0,
            r = r << 30 | r >>> 2,
            e = i ^ r ^ u,
            f = t << 5 | t >>> 27,
            n = f + e + n - 899497514 + s[o + 4] << 0,
            i = i << 30 | i >>> 2;
        this.h0 = this.h0 + n << 0;
        this.h1 = this.h1 + t << 0;
        this.h2 = this.h2 + i << 0;
        this.h3 = this.h3 + r << 0;
        this.h4 = this.h4 + u << 0
    }
    ;
    i.prototype.hex = function() {
        this.finalize();
        var t = this.h0
          , i = this.h1
          , r = this.h2
          , u = this.h3
          , f = this.h4;
        return n[t >> 28 & 15] + n[t >> 24 & 15] + n[t >> 20 & 15] + n[t >> 16 & 15] + n[t >> 12 & 15] + n[t >> 8 & 15] + n[t >> 4 & 15] + n[t & 15] + n[i >> 28 & 15] + n[i >> 24 & 15] + n[i >> 20 & 15] + n[i >> 16 & 15] + n[i >> 12 & 15] + n[i >> 8 & 15] + n[i >> 4 & 15] + n[i & 15] + n[r >> 28 & 15] + n[r >> 24 & 15] + n[r >> 20 & 15] + n[r >> 16 & 15] + n[r >> 12 & 15] + n[r >> 8 & 15] + n[r >> 4 & 15] + n[r & 15] + n[u >> 28 & 15] + n[u >> 24 & 15] + n[u >> 20 & 15] + n[u >> 16 & 15] + n[u >> 12 & 15] + n[u >> 8 & 15] + n[u >> 4 & 15] + n[u & 15] + n[f >> 28 & 15] + n[f >> 24 & 15] + n[f >> 20 & 15] + n[f >> 16 & 15] + n[f >> 12 & 15] + n[f >> 8 & 15] + n[f >> 4 & 15] + n[f & 15]
    }
    ;
    i.prototype.toString = i.prototype.hex;
    i.prototype.digest = function() {
        this.finalize();
        var n = this.h0
          , t = this.h1
          , i = this.h2
          , r = this.h3
          , u = this.h4;
        return [n >> 24 & 255, n >> 16 & 255, n >> 8 & 255, n & 255, t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, t & 255, i >> 24 & 255, i >> 16 & 255, i >> 8 & 255, i & 255, r >> 24 & 255, r >> 16 & 255, r >> 8 & 255, r & 255, u >> 24 & 255, u >> 16 & 255, u >> 8 & 255, u & 255]
    }
    ;
    i.prototype.array = i.prototype.digest;
    i.prototype.arrayBuffer = function() {
        this.finalize();
        var t = new ArrayBuffer(20)
          , n = new DataView(t);
        return n.setUint32(0, this.h0),
        n.setUint32(4, this.h1),
        n.setUint32(8, this.h2),
        n.setUint32(12, this.h3),
        n.setUint32(16, this.h4),
        t
    }
    ;
    f = a();
    if(!window.sha1){
    h ? module.exports = f : (u.sha1 = f,
    c && define(function() {
        return f
    }))
    }
}
)();

(function() {
    'use strict';
    console.log('injected');

    function sha1p(value){
        let hash = sha1(value).toUpperCase();
        let prefix = hash.substring(0,5);
        let rest = hash.substring(5,40);
        return [hash, prefix, rest];
    }

    // Your code here...
    function upgradeDom(){
        for(let node of document.querySelectorAll('input[type="password"]:not([data-pwned-alert="on"])')){
            node.addEventListener('change', evt => {
                let [hash, prefix, rest] = sha1p(node.value);
                fetch(`https://api.pwnedpasswords.com/range/${prefix}`).then(res => res.text()).then(list => {
                    for(let line of list.split('\n')){
                        if(line.split(':')[0] == rest){
                            alert(`Change your password! It's been pwned ${line.split(':')[1]} times!`);
                        }
                    }
                });
                if(document.location.protocol == 'http:'){
                    alert(`Change your password! You just sent it in the clear!`);
                }
            });
            node.dataset.pwnedAlert = 'on';
        }
    }

    var observer = new MutationObserver(upgradeDom);
    observer.observe(document.body, {attributes: false, childList: true, subtree: true});

    upgradeDom();

})();
