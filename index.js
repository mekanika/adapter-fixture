
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

  function Fixture() {}


  /**
    @exports FixtureAdapter
  */

  var fixture = Fixture.prototype;


  /**
    Enable the instantiation of new Fixtures from any instance

    @return {FixtureAdapter} A new fixture adapter
  */

  fixture.new = function () { return new Fixture(); };


  /**
    Internal data storage
    Available as `fixture._store` for manual override
    @private
  */

  fixture._store = {};


  /**
    General Adapter callback executed when adapter either:

    - Errors `(error)`
    - Completes the call: `(null, results)`

    @callback AdapterCallback
    @param {Mixed} error An error if present, `null` if not
    @param {Object} results A results object if no error is present
  */

  /**
    A Query Envelope control message
    @typedef {Object} QueryEnvelope
    @see Query Envelopes - {@link https://github.com/mekanika/qe}
  */

  /**
    Primary adapter

    @param {QueryEnvelope} qe
    @param {AdapterCallback} cb Function executed on completion with `(err,res)`
    @public
  */

  fixture.exec = function( qe, cb ) {
    if (!cb) throw new Error('Missing callback');

    if (!qe.do || !qe.on)
      return cb('Invalid qe: must provide `do` and `on` fields');

    if (fixture[ qe.do ]) return this[ qe.do ]( qe, cb );
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
      this._store[ resource ].forEach( function (rec, i) {
        // COERCIVE equality!! Handy to paper over number vs. string typing
        /* jshint eqeqeq:false */
        if (rec.id == id) _ret.push({index:i, record:rec});
      });
    }, this);

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
    if (qe.ids) found = _find.call( this, qe.on, qe.ids );

    // Apply match (if any)
    if (qe.match) {
      if (!qe.ids) found = _toIndex( this._store[ qe.on ] );
      // Match on potential records
      found = _match.call( this, found, qe.match );
    }

    // Dump results if instructed (and no other conditions present)
    if (forceDump && !qe.ids && !qe.match) {
      found = _toIndex( this._store[ qe.on ] );
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

  function _match (col, mc) {

    var match = function (rec, mo) {
      var field = _lastkey(mo);
      var op = _lastkey( mo[field] );
      var val = mo[field][op];

      var i;

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
          var _all = true; i = -1;
          while (++i < val.length) {
            if (!rec[field]) _all = false;
            else if (rec[field].indexOf(val[i]) === -1) _all = false;
          }
          if (_all) hit = true;
          break;
        case 'any':
          for (i=0; i < val.length; i++) {
            if ( rec[field] && rec[field].indexOf(val[i]) > -1 ) {
              hit = true; i = val.length;
            }
          }
          break;
      }

      return hit;
    };

    function _mc (el, mos, boolop) {
      var hits = [];

      var i = -1;
      while (++i < mos.length) {
        var mo = mos[i];
        var key = _lastkey( mo );
        // Nested match condition
        if (mo[key] instanceof Array) {
          hits[i] = _mc( el, mo[key], key);
        }
        else hits[i] = match(el, mo);
      }

      // Collapse hits to a TRUE or FALSE based on boolops
      return boolop === 'or'
        ? hits.indexOf(true) > -1 // OR check
        : hits.indexOf(false) < 0;
    }

    var boolop = _lastkey(mc);
    var matches = [];

    var ci = -1;
    while (++ci < col.length) {
      var el = col[ci];
      // Support "indexed" results returned from _find()
      var r = el.record && Object.keys(el).length === 2
        ? el.record
        : el;

      if (_mc(r, mc[boolop], boolop)) matches.push(el);
    }

    return matches;
  }


  /**
    Helper: Cheap/nasty async checker
    Setup a count, have your code decrement the count when passing to chkdone
  */

  function _chkdone (count, cb, res) {
    if (count === 0) cb( null, res );
  }


  /**
    Helper: Grabs the lastKey from an object. Or first key if only one key.
    10x faster than Object.keys. I know. Who cares in this adapter.
    http://jsperf.com/unknown-object-key
  */

  function _lastkey (block) {
    var ret;
    for (var key in block) if (block.hasOwnProperty(key)) ret = key;
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

    @param {QueryEnvelope} qe
    @param {AdapterCallback} cb

    @private
  */

  fixture.create = function( qe, cb ) {
    var created = [];

    var insert = function (record) {
      // Allow custom id to be passed, otherwise generate
      if (!record.id) {
        var id = Math.random().toString(36).substr(2);
        record.id = id;
      }

      if (!this._store[ qe.on ]) this._store[ qe.on ] = [];
      this._store[ qe.on ].push( record );
      created.push( record );
    };

    qe.body.forEach( insert.bind(this) );

    if (cb) cb( null, _filter(created, qe) );
  };


  /**
    Update (partial) a record/s

    @param {QueryEnvelope} qe
    @param {AdapterCallback} cb

    @private
  */

  fixture.update = function( qe, cb ) {

    var found = _findAny.call( this, qe );
    // @todo Is "not found" supposed to return in this error channel?
    if (!found.length) return cb('Record not found to update');

    var db = this._store[ qe.on ];

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
                dbrec[field] = dbrec[field].concat( value );
              else dbrec[field].push( value );
              break;
            case 'pull':
              value.forEach( function(pull) {
                var pos = dbrec[field].indexOf( pull );
                if (pos >= 0) dbrec[field].splice(pos, 1);
              });
              break;
          }
        }, this);
      }
    }, this);

    return cb( null, _filter(found, qe) );
  };


  /**
    Deletes a record/s matching `qe.ids` and/or `qe.match` conditions
    Returns array of results removed

    @param {QueryEnvelope} qe
    @param {AdapterCallback} cb passed (err, res)

    @private
  */

  fixture.remove = function( qe, cb ) {
    // Fetch matching records
    var found = _findAny.call( this, qe );
    if (!found.length) return cb(null, []);

    var ret = [];

    // Last index is used because the DB length CHANGES each remove
    var removeCount = 0;

    found.forEach( function(res) {
      var del = this._store[ qe.on ].splice( res.index-removeCount, 1 );
      removeCount++;
      // Splice returns an array - push this onto return array
      ret.push.apply( ret, del );
    }, this);

    return cb( null, _filter(ret, qe) );
  };


  /**
    Retrieve record/s

    @param {QueryEnvelope} qe
    @param {AdapterCallback} cb

    @private
  */

  fixture.find = function( qe, cb ) {
    // Get initial results
    var found = _findAny.call( this, qe, true );
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
            // Extend an existing .match field
            if (nq.match) {
              if (nq.match.and) nq.match.and.push(mo);
              else nq.match = {and:[mo, nq.match]};
            }
            else nq.match = {and:[mo]};
          }
          else nq.ids = rec[field];

          this.find( nq, function (e,r) {
            if (e) return cb('Died: '+e);
            rec[field] = r;
            _chkdone( --_as, cb, found );
          });
        }, this);
      }, this);
    }

    // Note `_filter_ has been applied pre-populate. DO NOT refilter.
    else return cb( null, found );
  };


  /**
    Export the module
  */

  return new Fixture();

});
