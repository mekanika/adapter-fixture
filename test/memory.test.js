
var expect = require('chai').expect
  , memory = require('../index');


describe('Memory Adapter', function () {


  it('throws if no callback provided', function (done) {
    try {
      memory.exec( {} );
    }
    catch (e) {
      expect( e.message ).to.match( /missing/ig );
      done();
    }
  });

  it('can create new entries', function (done) {
    var qo = {action:'create', resource:'bands', content:[{name:'Splergh'}]}
    memory.exec( qo, function (e,r) {
      expect( e ).to.not.exist;
      expect( r ).to.exist;
      expect( r ).to.include.keys( 'name' );
      done();
    });
  });

  it('newly created entities have generated ids', function (done) {
    var qo = {action:'create', resource:'bands', content:[{name:'Splergh'}]}
    memory.exec( qo, function (e,r) {
      expect( r ).to.include.keys( 'id' );
      done();
    });
  });

  it('can create multiple new entries', function (done) {
    var qo = {action:'create', resource:'bands', content:[{name:'Woo'}, {name:'Um'}]}
    memory.exec( qo, function (e,r) {
      expect( r ).to.have.length( 2 );
      done();
    });
  });

  it('can find/list many entries', function (done) {
    var qo = {action:'find', resource:'bands'};
    memory.exec( qo, function (e,r) {
      // This value is based on the STATE of previous tests. Not a great idea.
      // Can't be fucked making this stateless. @todo
      expect( r ).to.have.length.above( 1 );
      done();
    });
  });

  it('returns an empty list if no records found', function (done) {
    var qo = {action:'find', resource:'slime'};
    memory.exec( qo, function (e,r) {
      expect( r ).to.have.length( 0 );
      done();
    });
  });

  it('can fetch/read a single entry');

  it('can find/list many entries');

  it('can save (idempotent PUT) a complete entry');

  it('can update (partial PATCH) an entry');

  it('can delete an entry');

});
