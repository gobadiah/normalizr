var expect = require('chai').expect,
    assert = require('chai').assert;
var rr     = require('../src');
var createReducer    = rr.reducer,
    createMiddleware = rr.middleware,
    createActions    = rr.actionsCreator,
    Schema           = rr.Schema;
var destroy = require('../src/destroy').destroy;
var prefixes = require('../src/constants').prefixes;
var SYNC_ACTION = require('../src/constants').SYNC_ACTION;
var actionType = require('../src/constants').actionType;
var immutable = require('immutable');

describe('reducer', function () {
  var user = new Schema('users');
  var car  = new Schema('cars');
  user.hasMany(car, 'private_cars', 'owner');
  user.hasMany(user, 'employees', 'boss');
  var schemas = {
    users: user,
    cars: car
  };
  var actions = createActions(schemas);
  var createUser = actions.users.create;
  var destroyUser = actions.users.destroy;
  var createCar = actions.cars.create;
  var destroyCar = actions.cars.destroy;
  var middleware = createMiddleware(schemas, store => store.state.get('entities'));
  var reducer = createReducer(schemas, (store) => store.state);
  var state  = immutable.fromJS({
    entities: {
      users: {},
      cars: {}
    }
  });
  state = state.updateIn(['entities', 'users'], map => map.set(1, immutable.fromJS({
    id: 1,
    name: 'Bob',
    boss_id: null,
    employees: [-2],
    private_cars: [-1]
  }))
  .set(-2, immutable.fromJS({
    id: -2,
    name: 'Alfred',
    boss_id: 1,
    employees: [],
    private_cars: [-2, 4]
  })))
  .updateIn(['entities', 'cars'], map => map.set(-1, immutable.fromJS({
    id: -1,
    brand: 'Peugeot',
    owner_id: 1
  }))
  .set(-2, immutable.fromJS({
    id: -2,
    brand: 'Renault',
    owner_id: -2
  }))
  .set(4, immutable.fromJS({
    id: 4,
    brand: 'Toyota',
    owner_id: -2
  })));

  it('should create a user correctly', function () {
    var store = {
      state,
      dispatch: function () {
      }
    };
    let action = createUser({ name: 'Gertrude' });
    let next   = (action) => reducer(store.state, action);
    let result = middleware(store)(next)(action);
    expect(result.getIn(['entities', 'users', -3]).toJS())
    .to.eql({
      id: -3,
      _id: -3,
      name: 'Gertrude',
      employees: [],
      boss_id: null,
      private_cars: []
    });
  });

  it('should create a user correctly with boss', function () {
    var store = {
      state,
      dispatch: function () {
      }
    };
    let action = createUser({ name: 'Gertrude', boss_id: -2 });
    let next   = (action) => reducer(store.state, action);
    let result = middleware(store)(next)(action);
    expect(result.getIn(['entities', 'users', -3]).toJS())
    .to.eql({
      id: -3,
      _id: -3,
      name: 'Gertrude',
      employees: [],
      boss_id: -2,
      private_cars: []
    });
    expect(result.getIn(['entities', 'users', -2, 'employees']).includes(-3))
    .to.be.true;
  });

  it('should create a user with boss and then update with a success from server', function () {
    var store = {
      state,
      dispatch: function () {
      }
    };
    let action         = createUser({ name: 'Gertrude', boss_id: 1 });
    let action_car     = createCar({ brand: 'BMW', owner_id: -3 });
    let success_action = createUser({ id: 5, name: 'Gertrude', boss_id: 1 });
    success_action.type           = actionType(prefixes['SUCCESS_CREATE_PREFIX'], 'users');
    success_action.meta.old_id    = -3;
    success_action.meta.post_hook = undefined;

    let next    = (action) => reducer(store.state, action);
    let result  = middleware(store)(next)(action);
    store.state = result;
    let result1 = middleware(store)(next)(action_car);
    store.state = result1;

    let result2 = middleware(store)(next)(success_action);
    expect(result2.hasIn(['entities', 'users', 5])).to.be.true;
    expect(result2.hasIn(['entities', 'users', -3])).to.be.false;
    expect(result2.getIn(['entities', 'users', 5]).toJS())
    .to.eql({
      id: 5,
      _id: -3,
      name: 'Gertrude',
      employees: [],
      boss_id: 1,
      private_cars: [-3]
    });
    expect(result2.getIn(['entities', 'users', 1, 'employees']).includes(5))
    .to.be.true;
    expect(result2.getIn(['entities', 'users', 1, 'employees']).includes(-3))
    .to.be.false;
    expect(result2.hasIn(['entities', 'cars', -3])).to.be.true;
    expect(result2.getIn(['entities', 'cars', -3, 'owner_id']))
    .to.eql(5);
  });

  it('should destroy only in theory', function () {
    var store = {
      state,
      dispatch: function () {
      }
    };
    let action  = destroyUser(1);
    let next    = (action) => reducer(store.state, action);
    let result  = middleware(store)(next)(action);
    expect(result.hasIn(['entities', 'users',  1, '_destroy'])).to.be.true;
    expect(result.hasIn(['entities', 'users', -2, '_destroy'])).to.be.true;
    expect(result.hasIn(['entities', 'cars',  -1, '_destroy'])).to.be.true;
    expect(result.hasIn(['entities', 'cars',  -2, '_destroy'])).to.be.true;
    expect(result.hasIn(['entities', 'cars',   4, '_destroy'])).to.be.true;

  });

  it('should destroy for real', function () {
    var store = {
      state,
      dispatch: function () {
      }
    };
    let action  = destroyUser(1);
    action.type = actionType(prefixes['SUCCESS_DESTROY_PREFIX'], 'users');
    action.payload = destroy(action.meta.key, 1, schemas[action.meta.key], store.state.get('entities').toJS());
    let next    = (action) => reducer(store.state, action);
    let result  = middleware(store)(next)(action);
    expect(result.getIn(['entities', 'users']).size).to.eql(0);
    expect(result.getIn(['entities', 'cars']).size).to.eql(0);
  });
});
