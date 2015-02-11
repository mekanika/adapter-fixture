# adapter-fixture

[**Qe** (Query envelope)](https://github.com/mekanika/qe/) enabled in-memory adapter.

This adapter stores, updates and retrieves records from a memory store. It is **not intended for production**. Its primary use is for development testing as a fixture without requiring a backend.


## Usage

Pass a _Qe_ and a callback to `adapter.exec(qe, cb)`:

```js
var adapter = require('mekanika-adapter-fixture');

adapter.exec( {do:'find',on:'users'}, fn );
// Callback receives (error, results)
```

## Supported features

All reserved Query `do` actions are supported:

- 'create'
- 'find'
- 'update'
- 'remove'

Supports `.match` and the following match operators:

- eq, neq, in, nin, all, lt, lte, gt, gte

Supports `.populate`:

- by field name: `{ 'friends':{} }`
- with Qe: `{ 'friends': {query:{on:'users'}} }`
- on foreign key: `{'friends': {key: 'users_id'} }`

```js
{
  do:'find',
  on:'posts',
  populate:{
    'comments': {
      key:'cmt_id',
      query: {select: ['body']}
    }
  }
}
```

Supported `.update` reserved operators:

- **inc** - `{update: [ {score: {inc: 5}} ]`
- **push** - `{update: [ {tags: ['cool']} ]}`
- **pull** - `{update: [ {tags: ['removeme'] ]}`


Supports `.limit`, `.select`, `.offset` result filters:

```js
{
  do:'find',
  on:'posts',
  limit:5,
  offset:10,
  select:['-date']
}
```

Fixture Adapter uses `.id` as its identifier field.


## License

MIT
