0.3.2 - 9 November 2014
=====

Fixed:

- `_lastKey()` internal only returns hasOwnProperties (MatchContainer fix)



0.3.1 - 8 November 2014
=====

Changed:

- Fixed 'push' update operator

Internal:

- Added update operator tests
- Added offset by number test



0.3.0 - 8 November 2014
=====

Major stability and Qe compliance release.
Only 'sort' is not supported.

Changed:

- All results are always arrays even on single results
- Filter (limit & select) apply to all relevant actions

Added:

- `.match` support for all relevant actions
- Populate on foreign key
- 'all' match operator support
- Test coverage :)



0.2.0 - 7 November 2014
=====

Changed:

- Switch over to Qe 0.6.0 support
- Actions all work with array content: `create`, `udpate`, `find` `remove`

Added:

- `.populate` support
- `.update` support
- `.limit` support
- `.offset` support
- `.select` support


0.1.0 - 28 July 2014
=====

- Initial release
