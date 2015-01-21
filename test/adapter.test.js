
var expect = require('chai').expect
  , fixture = require('../index');


describe('Fixture Adapter', function () {

  var _FIXTURE = {
    'supers': [
      {id:1, handle:'Drzzt', type:'rogue', power:5, speed:12, extra:['a','b']},
      {id:2, handle:'Pug', type:'wizard', power:2, speed:5},
      {id:3, handle:'Bruce', type:'fighter', power:15, speed:6, extra:['b']},
      {id:4, handle:'Joe', type:'rogue', power:8, speed:10}
    ]
  };


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
      expect( r[0] ).to.include.keys( 'name' );
      done();
    });
  });

  it('created entities use passed `id` or generated ids', function (done) {
    var qe = {do:'create', on:'bands', body:[{id:'abc',name:'x'}, {name:'y'}]};
    fixture.exec( qe, function (e,r) {
      expect( r[0].id ).to.equal('abc');
      expect( r[1] ).to.include.keys( 'id' );
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
      expect( r[0].id ).to.exist;
      qe = {do:'find', on:'bands', ids:[r[0].id]};
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
      qe = {do:'update', on:'bands', ids:[r[0].id], body:[{albums:4}]};
      fixture.exec( qe, function (e,r) {
        expect( e ).to.not.exist;
        expect( r[0].albums ).to.equal( 4 );
        done();
      });
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

  it('helper method _lastkey only matches own properties', function (done) {
    // Setup a dummy match constraint
    // If _lastkey doesn't filter 'dummykey', it will BLOWUP and this test fails
    function Obj (key, val) { this[key] = val; }
    Obj.prototype.dummykey = true;
    var mc = new Obj('and', [{type:{eq:'rogue'}}]);

    fixture._store = _FIXTURE;

    fixture.exec( {on:'supers', do:'find', match:mc}, function (e,r) {
      expect( r ).to.have.length(2);
      done();
    });
  });


  describe('Update operators', function () {

    var qe;

    beforeEach(function() {
      qe = {on:'supers', do:'update', ids:[1], update:[]};
      // copy fixture - my new favourite hack copy object method:
      fixture._store = JSON.parse( JSON.stringify(_FIXTURE) );
    });

    it('inc', function (done) {
      qe.update.push( {power:{inc:50}} );
      fixture.exec( qe, function (e,r) {
        expect( r[0].power ).to.equal( 55 );
        done();
      });
    });

    it('push (array)', function (done) {
      var topush = ['array'];
      qe.update.push( {extra:{push:topush}} );

      fixture.exec( qe, function (e,r) {
        expect( r[0].extra ).to.have.length( 3 );
        expect( r[0].extra[2] ).to.equal('array');
        done();
      });
    });

    it('push (scalar)', function (done) {
      var topush = 'scalar';
      qe.update.push( {extra:{push:topush}} );

      fixture.exec( qe, function (e,r) {
        expect( r[0].extra ).to.have.length( 3 );
        expect( r[0].extra[2] ).to.equal( 'scalar' );
        done();
      });
    });

    it('pull (array)', function (done) {
      var topull = ['a','b'];
      qe.update.push( {extra:{pull:topull}} );

      fixture.exec( qe, function (e,r) {
        expect( r[0].extra ).to.have.length( 0 );
        done();
      });
    });
  });


  describe('Match', function () {

    beforeEach(function() {
      // copy fixture - my new favourite hack copy object method:
      fixture._store = JSON.parse( JSON.stringify(_FIXTURE) );
    });

    describe('operators', function () {

      var qe;

      beforeEach(function() { qe = {on:'supers',do:'find',match:{and:[]}}; });

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
          expect( r ).to.have.length(3);
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

      it('all', function (done) {
        qe.match.and.push({extra:{all:['a','b']}});
        fixture.exec( qe, function (e,r) {
          expect( r[0].handle ).to.equal('Drzzt');
          done();
        });
      });

      it('any', function (done) {
        qe.match.and.push({extra:{any:['b']}});
        fixture.exec( qe, function (e,r) {
          expect(r).to.have.length(2);
          done();
        });
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

      it('matches on remove', function (done) {
        qe.do = 'remove';
        qe.match = {and:[{type:{eq:'rogue'}}]};

        fixture.exec( qe, function (e,r) {
          expect( r ).to.have.length( 2 );
          expect( r[0].type ).to.equal( 'rogue' );
          expect( r[1].type ).to.equal( 'rogue' );
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
      });

    });

  });


  describe('Populate', function () {

    var _db = {
      'supers': [
        {id:2, handle:'Pug', type:'wizard', kicks:[1,3], tags:[1,3], powers:[1]},
        {id:3, handle:'Bruce', type:'fighter', kicks:[], tags:[2], powers:[]},
        {id:4, handle:'Joe', type:'rogue', kicks:[2,3], tags:[], powers:[2]}
      ],
      // Resource name matches field name, ids as 'id'
      'tags': [
        {id:1, body:'pro'},
        {id:2, body:'noob'},
        {id:3, body:'deadly'}
      ],
      // Alternatively named resource
      'sidekicks': [
        {id:1, workswith:[2], name:'Gir', skill:-3},
        {id:2, workswith:[4], name:'Pop', skill:2},
        {id:3, workswith:[2,4],name:'Moo', skill:5000}
      ],
      // Alternatively named ids
      'powers': [
        {power_id:1, name:'magic'},
        {power_id:2, name:'lockpick'}
      ]
    };

    beforeEach(function() {
      // copy fixture - my new favourite hack copy object method:
      fixture._store = JSON.parse( JSON.stringify(_db) );
    });

    it('handles default populating (undirected)', function (done) {
      var qe = {on:'supers',do:'find', ids:[2], populate:{tags:{}}};
      fixture.exec( qe, function (e,r) {
        expect( r[0].tags[0] ).to.have.keys('id','body');
        done();
      });
    });

    it('populates based on Qe lookup', function (done) {
      var qe = {
        on:'supers', do:'find', ids:[2],
        populate: {kicks: {query:{
          on:'sidekicks',
          select:['-workswith'] // Blacklist!
        }}}
      };
      fixture.exec( qe, function (e,r) {
        expect( r[0].kicks ).to.have.length(2);
        // Check that the reference has been LOADED
        expect( r[0].kicks[0] ).to.include.keys( 'name', 'skill' );
        expect( r[0].kicks[0] ).to.not.have.key( 'workswith' );
        done();
      });
    });

    it('looksup on foreign key', function (done) {
      var qe = {
        on:'supers', do:'find', ids:[2],
        populate:{powers:{key:'power_id'}}
      };

      fixture.exec( qe, function (e,r) {
        expect( r[0].powers[0] ).to.have.keys( 'power_id', 'name');
        done();
      });
    });

  });


  describe('Select', function () {

    beforeEach(function() {
      // copy fixture - my new favourite hack copy object method:
      fixture._store = JSON.parse( JSON.stringify(_FIXTURE) );
    });

    it('whitelists fields', function (done) {
      var qe = {on:'supers',do:'find', ids:['1'], select:['handle']};
      fixture.exec( qe, function (e,r) {
        expect( r[0] ).to.have.key('handle');
        expect( r[0] ).to.not.have.key('id');
        done();
      });
    });

    it('blacklists fields', function (done) {
      var qe = {on:'supers',do:'find', ids:['1'], select:['-handle']};
      fixture.exec( qe, function (e,r) {
        expect( r[0] ).to.not.have.key('handle');
        expect( r[0] ).to.include.keys('id','power','speed');
        done();
      });
    });

  });


  describe('Limit', function () {

    it('on find', function (done) {
      var qe = {do:'find', on:'supers', limit:2};
      fixture._store = _FIXTURE;
      fixture.exec( qe, function (e,r) {
        expect( r ).to.have.length( 2 );
        done();
      });
    });

  });


  describe('Offset', function () {

    it('by number', function (done) {
      var qe = {do:'find', on:'supers', offset:2};
      fixture._store = _FIXTURE;
      fixture.exec( qe, function (e,r) {
        expect( r ).to.have.length( 2 );
        done();
      });
    });

  });

});
