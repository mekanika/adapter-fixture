
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

  it('callbacks error if invalid query', function (done) {
    var qo = {resource:'x'};
    memory.exec( qo, function (e,r) {
      expect( e ).to.match( /invalid query/ig );
      qo = {action:'x'};
      memory.exec( qo, function (e,r) {
        expect( e ).to.match( /invalid query/ig );
        done();
      });
    });
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

  it('can fetch/read a single entry', function (done) {
    var qo = {action:'create', resource:'bands', content:[{name:'DOTN'}]};
    memory.exec( qo, function (e,r) {
      expect( r.id ).to.exist;
      qo = {action:'find', resource:'bands', identifiers:[r.id]};
      memory.exec( qo, function (e,r) {
        expect( e ).to.not.exist;
        expect( r ).to.have.length( 1 );
        expect( r[0].name ).to.equal( 'DOTN' );
        done();
      });

    });
  });

  it('can save (idempotent PUT) a complete entry', function (done) {
    var qo = {action:'create', resource:'bands', content:[{name:'Tantric', albumbs:4}]};
    memory.exec( qo, function (e,r) {
      var updated = r;
      updated.albums = 5;
      qo = {action:'save', resource:'bands', content:[updated]};
      memory.exec( qo, function (e,r) {
        expect( e ).to.not.exist;
        expect( r[0].albums ).to.equal( updated.albums );
        done();
      });
    });
  });

  it('.update errors if not provided content or identifiers', function (done) {
    memory.exec( {action:'update', resource:'!', identifiers:[1]}, function (e,r) {
      expect( e ).to.match( /content/ig );

      memory.exec( {action:'update', resource:'!', content:[1]}, function (e,r) {
        expect( e ).to.match( /identifiers/ig );
        done();
      });
    });
  });

  it('can update (partial PATCH) an entry', function (done) {
    var qo = {action:'create', resource:'bands', content:[{name:'SDRE', albums:3}]};
    memory.exec( qo, function (e,r) {
      qo = {action:'update', resource:'bands', identifiers:[r.id], content:[{albums:4}]};
      memory.exec( qo, function (e,r) {
        expect( e ).to.not.exist;
        expect( r.albums ).to.equal( 4 );
        done();
      });
    });
  });

  it('.delete callsback error if no identifiers provided', function (done) {
    var qo = {action:'remove', resource:'bands'};
    memory.exec( qo, function (e,r) {
      expect( e ).to.match( /identifiers/ig );
      done();
    });
  });

  it('can delete an entry', function (done) {
    var qo = {action:'create', resource:'bands', content:[{name:'Starfucker'}]};
    var id;
    memory.exec( qo, function (e,r) {
      id = r.id;
      qo = {action:'remove', resource:'bands', identifiers:[id]};
      memory.exec( qo, function (e,r) {
        expect( e ).to.not.exist;
        qo = {action:'find', resource:'bands', identifiers:[id]};
        memory.exec( qo, function (e,r) {
          expect( e ).to.not.exist;
          expect( r ).to.have.length( 0 );
          done();
        });
      });
    });
  });

});
