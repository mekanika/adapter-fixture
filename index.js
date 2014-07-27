

// var adapter = require('mekanika-adapter');
var memory = {}; //adapter('memory');

var cache = {};
var store = {};


// var memory = adapter('memory')

memory.exec = function( query, cb ) {
  console.log('a:memory:executing!', query)

  var res = []

  if (memory[ query.action ]) return memory[ query.action ]( query, cb );
  else if (cb) cb( null, res );
}



// Creates a NEW record
memory.create = function( record, cb ) {
  // Generate ID
  var _id = Math.random().toString(36).substr(2)
  record._id = _id

  store[ _id ] = record
  cache[ _id ] = record

  this.emit( 'memory.create', record )

  if (cb) cb( null, record )
}


// Full save of record
memory.save = function( id, record, cb ) {
  if (!store[id]) return cb( 'Not found' )

  store[ id ] = record
  cache[ id ] = record

  if (cb) cb( null, record )
}


memory.update = function( id, fields, cb ) {
  if (!store[id]) return cb( 'Not found' )

  for (var prop in fields)
    if (fields.hasOwnProperty( prop )) store[id][ prop ] = fields[ prop ]

  cache[id] = store[id]

  cb( null, cache[id] )
}


memory.destroy = function( id, cb ) {
  var _ref = store[id]
  if (!_ref) return cb( 'Not found' )

  delete store[id]
  delete cache[id]

  if (cb) cb( null, _ref )
}


// Fetch all
memory.all = function( cb ) {
  if (cb) cb( null, store )
}


memory.find = function( id, cb ) {
  if (!cache[id] && !store[id]) return cb( 'Not found' )

  var _ref = cache[id] || store[id]

  if (cb) cb( null, _ref )
}
