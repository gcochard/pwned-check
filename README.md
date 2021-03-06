pwned-check
===========

Note: This project is deprecated, and you can now use my pwned-alert usercript
located [here][userscript] to check live in your browser against the 
[v2 API][api] which uses [k-anonymity][k-anonymity-ref] making it faster and
easier to use. It will detect any password fields on a page, and on blur, it
will send the hash prefix to the service and compare the results, popping an
alert() with the number of compromises if a match is found.

Original readme follows:

This project is a way for you to verify your passwords have not been included in
Troy Hunt's Have I Been Pwned password lists. If you want to try it out, you can
head over to [the website][website] and enter a
password there. If you are concerned about sending passwords to a third-party
site, and still want to verify that your password has not been leaked (yet), you
can use this tool instead.

It will download and unzip 3 (or more) password lists, which weigh in at a
whopping 5.6GB compressed. When uncompressed, they are 13.5GB. The files will be
downloaded to the present working directory you are in. The only hard dependency
is the `7z` binary in your `PATH`.

You can run it in three ways. Scripted, programmatically, and interactive.
Interactive is recommended to avoid having your password entered in scripts, in
your shell history, and in the process listing in ps/top/etc. If you have many
passwords to check, you can use it programmatically and loop over your
passwords. Interactive mode prompts you for a password to enter, masks it as you
enter it, hashes/searches, and prints the result.

You can also run it with `npx`, simply use `npx pwned-check`. If you have `npm`
version 5 or later, you already have `npx`.

It will perform a modified [linear interpolation search][wiki] through the
files to determine if the hash is included in the dump files as the files are
sorted and the lines are fixed length hexidecimal strings, and the distribution
is close to unform. This is more efficient than a binary search over an
extremely large dataset, as it perform strictly fewer than `16*40` disk seeks
in the worst case, but on average roughly 80 seeks.

The number of hashes necessary to make this more efficient than a trivial
binary search algorithm is roughly 2^80, which is smaller than the keyspace
of sha1, but much greater than the size of the pwned password set. This makes
the search algorithm only of academic interest for all but the largest
datasets.


Disclaimer: This is not an official Google project.

## License

Apache Version 2.0

See [LICENSE](LICENSE)

[api]: https://haveibeenpwned.com/API/v2
[userscript]: https://github.gregcochard.com/pwned-check/pwned-alert.user.js
[k-anonymity-ref]: https://www.troyhunt.com/enhancing-pwned-passwords-privacy-by-exclusively-supporting-anonymity/
[website]: https://haveibeenpwned.com/Passwords
[wiki]: https://en.wikipedia.org/wiki/Interpolation_search
