
var expect = require('chai').expect
  , fixture = require('../index');


describe('Fixture Adapter', function () {


  it('throws if no callback provided', function (done) {
    try {
      fixture.exec( {} );
    }
    catch (e) {
      expect( e.message ).to.match( /missing/ig );
      done();
    }
  });

  it('callbacks error if invalid query', function (done) {
    var qe = {on:'x'};
    fixture.exec( qe, function (e,r) {
      expect( e ).to.match( /invalid query/ig );
      qe = {do:'x'};
      fixture.exec( qe, function (e,r) {
        expect( e ).to.match( /invalid query/ig );
        done();
      });
    });
  });

  it('can create new entries', function (done) {
    var qe = {do:'create', on:'bands', body:[{name:'Splergh'}]};
    fixture.exec( qe, function (e,r) {
      expect( e ).to.not.exist;
      expect( r ).to.exist;
      expect( r ).to.include.keys( 'name' );
      done();
    });
  });

  it('newly created entities have generated ids', function (done) {
    var qe = {do:'create', on:'bands', body:[{name:'Splergh'}]};
    fixture.exec( qe, function (e,r) {
      expect( r ).to.include.keys( 'id' );
      done();
    });
  });

  it('can create multiple new entries', function (done) {
    var qe = {do:'create', on:'bands', body:[{name:'Woo'}, {name:'Um'}]};
    fixture.exec( qe, function (e,r) {
      expect( r ).to.have.length( 2 );
      done();
    });
  });

  it('can find/list many entries', function (done) {
    var qe = {do:'find', on:'bands'};
    fixture.exec( qe, function (e,r) {
      // This value is based on the STATE of previous tests. Not a great idea.
      // Can't be fucked making this stateless. @todo
      expect( r ).to.have.length.above( 1 );
      done();
    });
  });

  it('returns an empty list if no records found', function (done) {
    var qe = {do:'find', on:'slime'};
    fixture.exec( qe, function (e,r) {
      expect( r ).to.have.length( 0 );
      done();
    });
  });

  it('can fetch/read a single entry', function (done) {
    var qe = {do:'create', on:'bands', body:[{name:'DOTN'}]};
    fixture.exec( qe, function (e,r) {
      expect( r.id ).to.exist;
      qe = {do:'find', on:'bands', ids:[r.id]};
      fixture.exec( qe, function (e,r) {
        expect( e ).to.not.exist;
        expect( r ).to.have.length( 1 );
        expect( r[0].name ).to.equal( 'DOTN' );
        done();
      });

    });
  });

  it('.update errors if not provided ids', function (done) {
    fixture.exec( {do:'update', on:'!', body:[1]}, function (e,r) {
      expect( e ).to.match( /ids/ig );
      done();
    });
  });

  it('can update (partial PATCH) an entry', function (done) {
    var qe = {do:'create', on:'bands', body:[{name:'SDRE', albums:3}]};
    fixture.exec( qe, function (e,r) {
      qe = {do:'update', on:'bands', ids:[r.id], body:[{albums:4}]};
      fixture.exec( qe, function (e,r) {
        expect( e ).to.not.exist;
        expect( r[0].albums ).to.equal( 4 );
        done();
      });
    });
  });

  it('.delete callsback error if no ids provided', function (done) {
    var qe = {do:'remove', on:'bands'};
    fixture.exec( qe, function (e,r) {
      expect( e ).to.match( /ids/ig );
      done();
    });
  });

  it('can delete an entry', function (done) {
    var qe = {do:'create', on:'bands', body:[{name:'Starfucker'}]};
    var id;
    fixture.exec( qe, function (e,r) {
      id = r.id;
      qe = {do:'remove', on:'bands', ids:[id]};
      fixture.exec( qe, function (e,r) {
        expect( e ).to.not.exist;
        qe = {do:'find', on:'bands', ids:[id]};
        fixture.exec( qe, function (e,rx) {
          expect( e ).to.not.exist;
          expect( rx ).to.have.length( 0 );
          done();
        });
      });
    });
  });

});
