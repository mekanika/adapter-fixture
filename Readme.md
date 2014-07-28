# adapter-memory

In memory adapter


## Notes

This 'adapter' is simple QO interface for storing, updating and retrieving records in memory. It is **not intended for production**. Its primary use is for development testing as a fixture without requiring a backend.

Storage is as simply a hash of arrays: `store[ type ] = [ rec1, rec2... recN ]`

Supported Query methods.

- .create
- .find (all/list)
- .find (findByID)
- .save (PUT)
- .update (PATCH)
- .remove

All methods except `update` work with arrays of items to operate on. There is _no support for `constraints`_ (WHERE type conditions).

Adapter uses `.id` as its identifier field.


## LICENSE

MIT
