
/**
  Universal Module exporter (supports CommonJS)
*/

(function (name, root, factory) {

  if ('function' === typeof define && define.amd) define( factory );
  else if ('undefined' !== typeof module && module.exports) module.exports = factory();
  else root[ name ] = factory();

})('adapterFixture', this, function () {


  /**
    The core module
  */

  var fixture = {};


  /**
    Internal data storage
    Available as `fixture._store` for manual override
  */

  fixture._store = {};


  /**
    Primary adapter

    @param {Query} query
    @param {Function} cb Callback passed (error, results)

    @public
  */

  fixture.exec = function( query, cb ) {
    // console.log('Memory:', query.toObject ? query.toObject() : query );

    if (!cb) throw new Error('Missing callback');

    if (!query.do || !query.on)
      return cb('Invalid query: must provide `action` and `resource`');

    if (fixture[ query.do ]) return fixture[ query.do ]( query, cb );
    else cb && cb( 'No matching action' );
  };


  /**
    Helper: finds a record from table `resource` by `id`

    @param {String} resource
    @param {String} id

    @private
  */

  function _find( resource, ids ) {
    var _ret = [];

    if (!(ids instanceof Array)) ids = [ids];

    ids.forEach( function (id) {
      fixture._store[ resource ].forEach( function (rec, i) {
        // COERCIVE equality!! Handy to paper over number vs. string typing
        if (rec.id == id) _ret.push({index:i, record:rec});
      });
    });

    return _ret;
  }


  /**
    Finds by .ids and by .match and returns array of indexed records:

        [{index:$i, record:$rec},...]

    @param {Qe} qe to check ids and match conditions
    @param {Boolean} forceDump Forces return of ALL `qe.on` fields if no match

    @return {Array} of indexed records
  */

  function _findAny( qe, forceDump ) {
    var found = [];

    // Load in specified ids
    if (qe.ids) found = _find( qe.on, qe.ids );

    // Apply match (if any)
    if (qe.match) {
      if (!qe.ids) found = _toIndex( fixture._store[ qe.on ] );
      // Match on potential records
      found = _match( found, qe.match );
    }

    // Dump results if instructed (and no other conditions present)
    if (forceDump && !qe.ids && !qe.match) {
      found = _toIndex( fixture._store[ qe.on ] );
    }

    return found;
  }


  /**
    Helper: Creates an `[{index:$i, record:$rec},...]` representation of
    an array of objects

    @param {Array} objs

    @return {Array} of `{index:$i, record:$obj}` objects
  */

  function _toIndex( objs ) {
    if (!objs || !objs.length) return [];

    var idx = [];
    objs.forEach( function (o,i) {
      idx.push( {index:i, record:o});
    });
    return idx;
  }


  /**
    Filters results by `select`, `limit`

    - Squash indexed results to raw array
    - Limit the number of results
    - Select whitelist/blacklist fields

    @return {Array} of filtered results
  */

  function _filter( res, qe ) {
    if (!res || !res.length) return [];

    // Force 'indexed' results back to raw array
    res = _squash(res, 'record');

    if (!qe) return res;

    // Limit results
    if (qe.limit) res = res.slice(0, qe.limit);

    // Apply selection
    if (qe.select) res = _select( res, qe.select );

    return res;
  }


  /**
    Helper: match handler with nesting support

    @param {Array} recs Results array to check
    @param {Object} mc Match container `{or: [mo, mc...]}`

    @return {Array} Matching results
  */

  function _match( recs, mc ) {

    var match = function (rec, mo) {
      var field = _lastkey(mo);
      var op = _lastkey( mo[field] );
      var val = mo[field][op];

      // Does the record pass the match object?
      var hit = false;

      switch (op) {
        case 'eq': if (rec[field] === val) hit = true; break;
        case 'neq': if (rec[field] !== val) hit = true; break;
        case 'in': if (val.indexOf(rec[field]) > -1) hit = true; break;
        case 'nin': if (val.indexOf(rec[field]) < 0) hit = true; break;
        case 'gt': if (rec[field] > val) hit = true; break;
        case 'gte': if (rec[field] >= val) hit = true; break;
        case 'lt': if (rec[field] < val) hit = true; break;
        case 'lte': if (rec[field] <= val) hit = true; break;
        case 'all':
          var _all = true;
          val.forEach( function(v) {
            if (rec.field.indexOf(v) === -1) _all = false;
          });
          if (_all) hit = true;
        break;
      }

      return hit;
    }

    function _mc (rec, mos, boolop) {
      var hits = [];

      mos.forEach( function (mo,i) {
        var key = _lastkey( mo );
        // Nested match condition
        if (mo[key] instanceof Array) {
          hits[i] = _mc( rec, mo[key], key);;
        }
        else hits[i] = match(rec, mo);
      });

      // Collapse hits to a TRUE or FALSE based on boolops
      return boolop === 'or'
        ? hits.indexOf(true) > -1 // OR check
        : hits.indexOf(false) < 0;
    }

    var boolop = _lastkey(mc);
    var matches = [];

    recs.forEach( function (rec) {

      // Support "indexed" results returned from _find()
      var r = rec.record && Object.keys(rec).length === 2
        ? rec.record
        : rec;

      if (_mc(r, mc[boolop], boolop)) matches.push(rec);
    });

    return matches;
  }


  /**
    Helper: Cheap/nasty async checker
    Setup a count, have your code decrement the count when passing to chkdone
  */

  function _chkdone (count, cb, res) {
    if (count === 0) cb( null, res );
  };


  /**
    Helper: Grabs the lastKey from an object. Or first key if only one key.
    10x faster than Object.keys. I know. Who cares in this adapter.
    http://jsperf.com/unknown-object-key
  */

  function _lastkey (block) {
    var ret;
    for (var key in block) ret = key;
    return ret;
  }


  /**
    Helper: Squashes a collection of objs to an array of values keyed on 'key'
  */

  function _squash (objs, key) {
    // Don't squash arrays that don't need it
    if (!objs.length) return objs;
    // Hack duck typing (ie. expect obj.$key to NOT be a scalar attribute)
    if (typeof objs[0][key] !== 'object') return objs;

    var ret = [];
    objs.forEach( function (o) {
      ret.push(o[key]);
    });
    return ret;
  }


  /**
    Helper: Whitelist/blacklist fields in elements 'res'
    Ugly/slow/nasty
  */

  function _select (res, sel) {
    if (!sel) return res;

    res.forEach( function (r) {
      var keys = Object.keys(r);
      var remove = [];

      sel.forEach( function (s,i) {
        if (s[0] === '-') remove[i] = s.slice(1);
      });

      if (remove.length) remove.forEach( function (s) { delete r[s]; });
      else keys.forEach( function (k) {
        if ( sel.indexOf(k) < 0 ) delete r[k];
      });
    });
    return res;
  }



  /**
    Creates new record/s

    @param {Qe} qe
    @param {Function} cb

    @private
  */

  fixture.create = function( qe, cb ) {
    var created = [];

    var insert = function (record) {
      if (record.id) throw new Error('Fuck you, id exists');
        // Generate ID
      var id = Math.random().toString(36).substr(2);
      record.id = id;

      if (!fixture._store[ qe.on ]) fixture._store[ qe.on ] = [];
      fixture._store[ qe.on ].push( record );
      created.push( record );
    };

    qe.body.forEach( insert );

    if (cb) cb( null, _filter(created, qe) );
  };


  /**
    Update (partial) a record/s

    @param {QueryObject} qe
    @param {Function} cb

    @private
  */

  fixture.update = function( qe, cb ) {

    var found = _findAny( qe );
    // @todo Is "not found" supposed to return in this error channel?
    if (!found.length) return cb('Record not found to update');

    var db = fixture._store[ qe.on ];

    found.forEach( function (res) {

      var dbrec = db[ res.index ];

      // Apply provided body updates (ie. partial update, no delete)
      if (qe.body) {
        for (var key in qe.body[0]) {
          dbrec[ key ] = qe.body[0][ key ];
        }
      }

      // Apply updates
      if (qe.update) {
        qe.update.forEach( function (up) {
          var field = _lastkey(up);
          var op = _lastkey( up[field] );
          var value = up[field][op];

          switch (op) {
            case 'inc':
              dbrec[ field ] += value;
              break;
            case 'push':
              if (value instanceof Array)
                debrec[field] = debrec[field].concat( value );
              else dbrec[field].push( value );
              break;
            case 'pull':
              value.forEach( function(pull) {
                var pos = dbrec[field].indexOf( pull );
                if (pos >= 0) dbrec[field].splice(pos, 1);
              });
              break;
          }
        });
      }
    });

    return cb( null, _filter(found, qe) );
  };




  /**
    Deletes a record/s matching `qe.ids` and/or `qe.match` conditions
    Returns array of results removed

    @param {Qe} qe
    @param {Function} cb passed (err, res)
  */

  fixture.remove = function( qe, cb ) {
    // Fetch matching records
    var found = _findAny( qe );
    if (!found.length) return cb(null, []);

    var ret = [];

    // Last index is used because the DB length CHANGES each remove
    var removeCount = 0;

    found.forEach( function(res) {
      var del = fixture._store[ qe.on ].splice( res.index-removeCount, 1 );
      removeCount++;
      // Splice returns an array - push this onto return array
      ret.push.apply( ret, del )
    });

    return cb( null, _filter(ret, qe) );
  };


  /**
    Retrieve record/s

    @param {QueryObject} qe
    @param {Function} cb

    @private
  */

  fixture.find = function( qe, cb ) {
    // Get initial results
    var found = _findAny( qe, true );
    if (!found.length) return cb(null, []);

    // Offset by number (only used in FIND)
    if ('number' === typeof qe.offset ) found = found.slice(qe.offset);

    // Filter
    found = _filter( found, qe );

    // Populate
    if (qe.populate) {
      // Clone the results so we're not destructively updating DB on populate
      // omfg this is nasty. Serious eye bleeding. Never production.
      found = JSON.parse( JSON.stringify(found) );

      // Cheap/nasty async: number of searches required
      var _as = found.length * Object.keys(qe.populate).length;

      Object.keys( qe.populate ).forEach( function (field) {
        var pop = qe.populate[ field ];

        // Ugh looking up every record is DUMB
        found.forEach( function (rec) {

          var nq = pop.query || {on:field};

          if (pop.key) {
            // Enables looking up associations by a foreign key match
            var mo = {};
            mo[ pop.key ] = {in: rec[field]};
            nq.match = {and:[mo]}
          }
          else nq.ids = rec[field];

          fixture.find( nq, function (e,r) {
            if (e) return cb('Died: '+e);
            rec[field] = r;
            _chkdone( --_as, cb, found );
          });
        });
      });
    }

    // Note `_filter_ has been applied pre-populate. DO NOT refilter.
    else return cb( null, found );
  };


  /**
    Export the module
  */

  return fixture;

});
