pwned-check
===========

This project is a way for you to verify your passwords have not been included in
Troy Hunt's Have I Been Pwned password lists. If you want to try it out, you can
head over to [the website](https://haveibeenpwned.com/Passwords) and enter a
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

It will perform a radix based search through the files to determine if the hash
is included in the dump files as the files are sorted and the lines are fixed
length hexidecimal strings, and the distribution is close to unform. This is
more efficient than a binary search, as it perform `O(log16(n))` comparisons.
Note that it does not construct a radix tree, so it is less efficient in the
search, with the tradeoff that there is no lengthy preproccessing required to
build the tree. Also note that this is only possible because the files are
already sorted.


Disclaimer: This is not an official Google project.

## License

Apache Version 2.0

See [LICENSE](LICENSE)
