# adapter-fixture

[**Qe** (Query envelope)](https://github.com/mekanika/qe/) enabled in-memory adapter.

This adapter stores, updates and retrieves records from memory. It is **not intended for production**. Its primary use is for development testing as a fixture without requiring a backend.

> **Note**: The goal is for this adapter to fully support the base

## Usage

All reserved Query `do` actions are supported:

- 'create'
- 'find'
- 'update'
- 'remove'

Note: There is currently _no support for `.match`_ (WHERE type conditions).

Supports `.populate`:

```js
{
  do:'find',
  on:'posts',
  populate:{'comments':{}}
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

Adapter uses `.id` as its identifier field.


## License

MIT
