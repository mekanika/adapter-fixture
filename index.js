
// The core module
var memory = {};

/**
  Expose module
*/

module.exports = exports = memory;


var store = {};




memory.exec = function( query, cb ) {

  if (!cb) throw new Error('Missing callback');

  if (!query.action || !query.resource)
    return cb('Invalid query: must provide `action` and `resource`');

  if (memory[ query.action ]) return memory[ query.action ]( query, cb );
  else cb && cb( 'No matching action' );
};


/**
  Internal helper: finds a record from table `resource` by `id`

  @param {String} resource
  @param {String} id

  @private
*/

function _find( resource, id ) {
  var _ret;

  store[ resource ].forEach( function (rec, i) {
    if (rec.id === id) _ret = {index:i, record:rec};
  });

  return _ret;
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
    record.id = id;

    if (!store[ qo.resource ]) store[ qo.resource ] = [];
    store[ qo.resource ].push( record );
    created.push( record );
  }

  qo.content.forEach( insert );

  if (cb) cb( null, created.length > 1 ? created : created[0] );
}


/**
  Save (PUT) a complete record/s

  @param {QueryObject} qo
  @param {Function} cb

  @private
*/

memory.save = function( qo, cb ) {

  qo.content.forEach( function (update) {
    if (!update.id) cb('Must provide records with `id` set');

    var found = _find( qo.resource, update.id );
    // @note Could update this to support updateOrCreate
    if (!found) cb('Cannot find record to update: '+qo.resource+'.'+update.id);

    store[ qo.resource ][ found.index ] = update;
  });

  return cb( null, qo.content );
};


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




/**
  Retrieve record/s

  @param {QueryObject} qo
  @param {Function} cb

  @private
*/

memory.find = function( qo, cb ) {
  var found = [];

  // Find MANY
  if (!qo.identifiers || !qo.identifiers.length) {

    // @todo Handle conditions

    if (store[ qo.resource ]) found = store[ qo.resource ].slice(0,100);
    return cb( null, found );
  }
  else {
    qo.identifiers.forEach( function(id) {
      var rec = _find( qo.resource, id );
      if (rec) found.push( rec.record );
    });
    return cb( null, found );
  }
}
