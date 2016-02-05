var expect = require('chai').expect,
    assert = require('chai').assert;
var rr     = require('../src');
var Schema = rr.Schema,
    createMiddleware = rr.middleware,
    actionsCreator   = rr.actionsCreator;
var prefixes = require('../src/constants').prefixes;
var SYNC_ACTION = require('../src/constants').SYNC_ACTION;
var actionType = require('../src/constants').actionType;
var immutable = require('immutable');
var fetchMock = require('fetch-mock');

describe('middleware', function () {
  var user = new Schema('users');
  var car  = new Schema('cars');
  user.hasMany(car, 'private_cars', 'owner');
  user.hasMany(user, 'employees', 'boss');
  var schemas = {
    users: user,
    cars: car
  };
  var actions = actionsCreator(schemas);
  var createUser = actions.users.create;
  var destroyUser = actions.users.destroy;
  var createCar = actions.cars.create;
  var destroyCar = actions.cars.destroy;
  var middleware = createMiddleware(schemas, (store) => store.state);
  var state  = immutable.fromJS({
    users: {},
    cars: {}
  });
  state = state.update('users', map => map.set(1, immutable.fromJS({
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
  .update('cars', map => map.set(-1, immutable.fromJS({
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

  it('should add an id to the payload with create action', function () {
    var store = {
      state,
      dispatch: sinon.spy()
    }

    var expected = {
      type: actionType(prefixes['CREATE_PREFIX'], 'users'),
      payload: {
        name: 'Arthur',
        boss_id: -2,
        employees: [],
        private_cars: []
      },
      meta: {
        key: 'users',
        id: -3
      }
    };

    var expected_dispatch = Object.assign({}, expected, { type: actionType(prefixes.REQUEST_CREATE_PREFIX, expected.meta.key) });

    var action = createUser({ boss_id: -2, name: 'Arthur' });

    var next = sinon.spy();

    next.withArgs(expected);
    store.dispatch.withArgs(expected_dispatch);

    middleware(store)(next)(action);

    expect(store.dispatch.withArgs(expected_dispatch).calledOnce).to.be.true;
    expect(next.withArgs(expected).calledOnce).to.be.true;
  });

  it('should make an api call to create resource', function (done) {
    var action     = createUser({ name: 'Arthur' });
    action.type    = actionType(prefixes['REQUEST_CREATE_PREFIX'], 'users');
    action.meta.id = -5;
    var expected_dispatch = {
      type: actionType(prefixes.SUCCESS_CREATE_PREFIX, action.meta.key),
      payload: {
        id: 5,
        name: 'Arthur'
      },
      meta: {
        key: action.meta.key,
        old_id: -5,
        post_hook: undefined
      }
    };

    var store = {
      state,
      dispatch: function (action) {
        expect(fetchMock.called()).to.be.true;
        expect(spy.calledOnce).to.be.true;
        done();
      }
    }
    var spy = sinon.spy(store, 'dispatch');

    var next = sinon.spy();

    fetchMock
    .mock('/api/users', 'POST', {
      id: 5,
      name: 'Arthur',
    });

    middleware(store)(next)(action);
  });

  it('should make an api call to destroy resource', function (done) {
    var action     = destroyUser(1);
    var expected_action = Object.assign({}, action, { type: actionType(prefixes.SUCCESS_DESTROY_PREFIX, action.meta.key) });

    var store = {
      state,
      dispatch: function (action) {
        expect(spy.calledOnce).to.be.true;
        done();
      }
    }
    var spy = sinon.spy(store, 'dispatch');

    var next = sinon.spy();

    fetchMock
    .mock('/api/users/', 'DELETE');

    middleware(store)(next)(action);

    expect(fetchMock.called()).to.be.true;
  });

  it('should dispatch a series of actions when syncing', function (done) {
    var action = { type: SYNC_ACTION };
    var next   = sinon.spy();
    var store  = {
      state,
      dispatch: function (action) {
        done();
      }
    };
    fetchMock
    .mock('/api/users/sync/', 'PATCH', {});

    middleware(store)(next)(action);
  });

  it('should dispatch a failure to create on 401', function () {
    fetchMock.mock('/api/users/', 'POST', {
      status: 401,
      statusText: 'Unauthorized'
    });
    var action     = createUser({ name: 'Arthur' });
    action.type    = actionType(prefixes['REQUEST_CREATE_PREFIX'], 'users');
    action.meta.id = -5;
    var expected_dispatch = {
      type: actionType(prefixes.FAILURE_CREATE_PREFIX, action.meta.key),
      payload: {
        error: 'Unauthorized',
        code: 401
      },
      error: true,
      meta: {
        key: action.meta.key,
        old_id: -5,
        post_hook: undefined
      }
    };

    var store = {
      state,
      dispatch: function (action) {
        expect(fetchMock.called()).to.be.true;
        expect(spy.calledOnce).to.be.true;
        done();
      }
    }
    var spy = sinon.spy(store, 'dispatch');

    var next = sinon.spy();

    middleware(store)(next)(action);
  });
});
