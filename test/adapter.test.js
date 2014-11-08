
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



  describe('Match', function () {

    var _FIXTURE = {
      'supers': [
        {id:1, handle:'Drzzt', type:'rogue', power:5, speed:12},
        {id:2, handle:'Pug', type:'wizard', power:2, speed:5},
        {id:3, handle:'Bruce', type:'fighter', power:15, speed:6},
        {id:4, handle:'Joe', type:'rogue', power:8, speed:10},
      ]
    }

    beforeEach(function() {
      // copy fixture - my new favourite hack copy object method:
      fixture._store = JSON.parse( JSON.stringify(_FIXTURE) );
    });

    describe('operators', function () {

      var qe;

      beforeEach(function() { qe = {on:'supers',do:'find',match:{and:[]}} });

      it('eq', function (done) {
        qe.match.and.push({power:{eq:5}});
        fixture.exec(qe, function (e,r) {
          expect( r[0].handle ).to.equal('Drzzt');
          done();
        });
      });

      it('neq', function (done) {
        qe.match.and.push({power:{neq:5}});
        fixture.exec(qe, function (e,r) {
          expect( r ).to.have.length(3)
          expect( r[0].handle ).to.equal('Pug');
          done();
        });
      });

      it('in', function (done) {
        qe.match.and.push({type:{in:['wizard', 'fighter']}});
        fixture.exec(qe, function (e,r) {
          expect( r ).to.have.length( 2 );
          expect( r[0].handle ).to.equal('Pug');
          done();
        });
      });

      it('nin', function (done) {
        qe.match.and.push({type:{nin:['wizard', 'fighter']}});
        fixture.exec(qe, function (e,r) {
          expect( r ).to.have.length( 2 );
          expect( r[0].handle ).to.equal('Drzzt');
          done();
        });
      });

      it.skip('all', function (done) {

      });

      it('gt', function (done) {
        qe.match.and.push({speed:{gt:10}});
        fixture.exec(qe, function (e,r) {
          expect( r ).to.have.length( 1 );
          expect( r[0].handle ).to.equal('Drzzt');
          done();
        });
      });

      it('gte', function (done) {
        qe.match.and.push({speed:{gte:10}});
        fixture.exec(qe, function (e,r) {
          expect( r ).to.have.length( 2 );
          expect( r[0].handle ).to.equal('Drzzt');
          done();
        });
      });

      it('lt', function (done) {
        qe.match.and.push({speed:{lt:10}});
        fixture.exec(qe, function (e,r) {
          expect( r ).to.have.length( 2 );
          expect( r[0].handle ).to.equal('Pug');
          done();
        });
      });

      it('lte', function (done) {
        qe.match.and.push({speed:{lte:10}});
        fixture.exec(qe, function (e,r) {
          expect( r ).to.have.length( 3 );
          expect( r[2].handle ).to.equal('Joe');
          done();
        });
      });

    });


    describe('action type', function () {

      var qe;

      beforeEach(function(){ qe = {on:'supers'}; });

      it('matches on find', function (done) {
        qe.do = 'find';
        fixture.exec( qe, function (e,r) {
          expect( r ).to.have.length( 4 );
          done();
        });
      });

      it('matches on update', function (done) {
        qe.do = 'update';
        qe.match = {and:[{type:{eq:'rogue'}}]};
        qe.update = [{power:{inc:4}}];

        fixture.exec( qe, function (e,r) {
          expect( r ).to.have.length( 2 );
          expect( r[0].power ).to.equal(9);
          expect( r[1].power ).to.equal(12);
          done();
        });
      });

    });


    describe('complex matches', function () {

      var qe = {on:'supers',do:'find',match:{and:[]}};

      it('matches on multiple conditions', function (done) {
        qe.match.and = [{speed:{gt:8}}, {power:{gte:8}}];
        fixture.exec( qe, function (e,r) {
          expect( r ).to.have.length(1);
          expect( r[0].handle ).to.equal('Joe');
          done();
        });
      });

      it('matches on OR container', function (done) {
        qe.match = {or:[{speed:{gt:8}}, {power:{gte:8}}]};
        fixture.exec( qe, function (e,r) {
          expect( r ).to.have.length(3);
          done();
        });
      });

      it('handles nested matches', function (done) {
        qe.match = {
          or: [
            {and:[{speed:{gt:8}}, {power:{gte:8}}]},
            {type:{eq:'wizard'}}
            ]};
        fixture.exec( qe, function (e,r) {
          expect( r ).to.have.length(2);
          expect( r[0].handle ).to.equal('Pug'); //the wizard
          expect( r[1].handle ).to.equal('Joe'); //the rogue spped+power
          done();
        });
      })

    });

  });

});
