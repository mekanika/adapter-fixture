
/**
  Universal Module exporter (supports CommonJS)
*/

(function (name, root, factory) {

  if ('function' === typeof define && define.amd) define( factory );
  else if ('undefined' !== typeof module && module.exports) module.exports = factory();
  else root[ name ] = factory();

})('adapterMemory', this, function () {


  /**
    The core module
  */

  var memory = {};


  /**
    Internal data storage
    Available as `memory._store` for manual override
  */

  memory._store = {};


  /**
    Primary adapter

    @param {Query} query
    @param {Function} cb Callback passed (error, results)

    @public
  */

  memory.exec = function( query, cb ) {
    // console.log('Memory:', query.toObject ? query.toObject() : query );

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

    memory._store[ resource ].forEach( function (rec, i) {
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

      if (!memory._store[ qo.resource ]) memory._store[ qo.resource ] = [];
      memory._store[ qo.resource ].push( record );
      created.push( record );
    };

    qo.body.forEach( insert );

    if (cb) cb( null, created.length > 1 ? created : created[0] );
  };


  /**
    Save (PUT) a complete record/s

    @param {QueryObject} qo
    @param {Function} cb

    @private
  */

  memory.save = function( qo, cb ) {

    qo.body.forEach( function (update) {
      if (!update.id) cb('Must provide records with `id` set');

      var found = _find( qo.resource, update.id );
      // @note Could update this to support updateOrCreate
      if (!found)
        cb('Cannot find record to update: '+qo.resource+'.'+update.id);

      memory._store[ qo.resource ][ found.index ] = update;
    });

    return cb( null, qo.body );
  };


  /**
    Update (partial PATCH) a record/s

    @param {QueryObject} qo
    @param {Function} cb

    @private
  */

  memory.update = function( qo, cb ) {

    if (!qo.body || !qo.body.length)
      return cb('Must provide updates in Query .body');

    if (!qo.ids || !qo.ids.length)
      return cb('Must provide ids to update in Query .ids field');

    // This implementation ONLY updates the first update request
    var found = _find( qo.resource, qo.ids[0] );
    if (!found) return cb('Record not found to update');

    for (var key in qo.body[0]) {
      memory._store[ qo.resource ][ found.index ][ key ] = qo.body[0][ key ];
    }

    return cb( null, memory._store[ qo.resource ][ found.index ] );
  };


  /**
    Deletes a record/s
  */

  memory.remove = function( qo, cb ) {

    if (!qo.ids || !qo.ids.length)
      return cb( 'Must provide ids to remove in Query .ids' );

    qo.ids.forEach( function(id) {
      var found = _find( qo.resource, id );
      if (found) memory._store[ qo.resource ].splice( found.index, 1 );
    });

    return cb( null, true );
  };


  /**
    Retrieve record/s

    @param {QueryObject} qo
    @param {Function} cb

    @private
  */

  memory.find = function( qo, cb ) {
    var found = [];

    // Find MANY
    if (!qo.ids || !qo.ids.length) {
      // @todo Handle conditions

      if (memory._store[ qo.resource ])
        found = memory._store[ qo.resource ].slice(0,100);

      return cb( null, found );
    }
    else {
      qo.ids.forEach( function(id) {
        var rec = _find( qo.resource, id );
        if (rec) found.push( rec.record );
      });
      return cb( null, found );
    }
  };


  /**
    Export the module
  */

  return memory;

});
