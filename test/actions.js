var expect         = require('chai').expect,
    assert         = require('chai').assert;
var rr             = require('../src');
var Schema         = rr.Schema,
    actionsCreator = rr.actionsCreator;
var prefixes       = require('../src/constants').prefixes,
    actionType     = require('../src/constants').actionType;

describe('actionsCreator', function () {
  var user = new Schema('users');
  var car  = new Schema('cars');
  user.hasMany(car, 'private_cars', 'owner');
  user.hasMany(user, 'employees', 'boss');
  var schemas = {
    users: user,
    cars: car
  };

  it('should create all the actions creator', function () {
    var result   = actionsCreator(schemas);
    assert.isFunction(result.users.create);
    assert.isFunction(result.users.destroy);
    assert.isFunction(result.cars.create);
    assert.isFunction(result.cars.destroy);
  });

  it('should have correct create action creator for users', function () {
    var result   = actionsCreator(schemas);
    var create   = result.users.create;
    var action   = create({ name: 'Bob' });
    var expected = {
      type: actionType(prefixes['CREATE_PREFIX'], 'users'),
      payload: {
        name: 'Bob',
        boss_id: null,
        employees: [],
        private_cars: []
      },
      meta: {
        key: 'users'
      }
    };
    expect(action).to.eql(expected);
  });

  it('should have correct destroy action creator for users', function () {
    var result   = actionsCreator(schemas);
    var destroy  = result.users.destroy;
    var action   = destroy(2);
    var expected = {
      type: actionType(prefixes['DESTROY_PREFIX'], 'users'),
      payload: 2,
      meta: {
        key: 'users'
      }
    };
    expect(action).to.eql(expected);
  });

  it('should have correct create action creator for cars', function () {
    var result   = actionsCreator(schemas);
    var create   = result.cars.create;
    var action   = create({ brand: 'Peugeot' });
    var expected = {
      type: actionType(prefixes['CREATE_PREFIX'], 'cars'),
      payload: {
        brand: 'Peugeot',
        owner_id: null
      },
      meta: {
        key: 'cars'
      }
    };
    expect(action).to.eql(expected);
  });

  it('should have correct destroy action creator for cars', function () {
    var result   = actionsCreator(schemas);
    var destroy  = result.cars.destroy;
    var action   = destroy(-1);
    var expected = {
      type: actionType(prefixes['DESTROY_PREFIX'], 'cars'),
      payload: -1,
      meta: {
        key: 'cars'
      }
    };
    expect(action).to.eql(expected);
  });
});
