
// The core module
var memory = {};

/**
  Expose module
*/

module.exports = exports = memory;


var store = {};




memory.exec = function( query, cb ) {

  if (!cb) throw new Error('Missing callback');

  if (memory[ query.action ]) return memory[ query.action ]( query, cb );
  else cb && cb( 'No matching action' );
}



/**
  Creates new record/s

  @param {QueryObject} qo
  @param {Function} cb

  @private
*/

memory.create = function( qo, cb ) {
  var created = [];

  var insert = function (record) {
    if (record.id) throw new Error('Fuck you, id exists');
      // Generate ID
    var id = Math.random().toString(36).substr(2);
    record.id = qo.resource+'.'+id;

    store[ id ] = record;
    created.push( record );
  }

  qo.content.forEach( insert );

  if (cb) cb( null, created.length > 1 ? created : created[0] );
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
