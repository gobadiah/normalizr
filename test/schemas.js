'use strick';

var expect = require('chai').expect;
var rr     = require('../src');
var Schema    = rr.Schema,
    OneToMany = rr.OneToMany,
    ManyToOne = rr.ManyToOne;

describe('schemas', function () {
  it('fails creating nameless schema', function () {
    (function () {
      new Schema();
    }).should.throw();
  });

  it('fails creating entity with non-string name', function () {
    (function () {
      new Schema(42);
    }).should.throw();
  });

  it('fails normalizing something other than array or object', function () {
    (function () {
      normalize(42, {});
    }).should.throw();

    (function () {
      normalize(null, {});
    }).should.throw();

    (function () {
      normalize(undefined, {});
    }).should.throw();

    (function () {
      normalize('42', {});
    }).should.throw();
  });

  it('fails normalizing without an object schema', function () {
    (function () {
      normalize({});
    }).should.throw();

    (function () {
      normalize({}, '42');
    }).should.throw();

    (function () {
      normalize({}, []);
    }).should.throw();
  });

  it('should construct a correct schemas with OneToMany relationships', function () {
    var user = new Schema('users');
    var car  = new Schema('cars');
    user.hasMany(car, 'private_cars', 'owner');
    expect(user.private_cars).to.be.an.instanceof(OneToMany);
    expect(car.owner).to.be.an.instanceof(ManyToOne);
    expect(user.private_cars.getKey()).to.eql('users');
    expect(user.private_cars.getField()).to.eql('private_cars');
    expect(car.owner.getForeignKey()).to.eql('owner_id');
    expect(car.owner.reverse()).to.eql(user.private_cars);
  });
});
