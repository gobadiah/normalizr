var expect = require('chai').expect;
var SYNC_ACTION   = require('../src/constants').SYNC_ACTION,
    SYNCED_ACTION = require('../src/constants').SYNCED_ACTION,
    actionType    = require('../src/constants').actionType,
    prefixes      = require('../src/constants').prefixes;

describe('constants', function () {
  it ('should have a SYNC_ACTION type', function () {
    expect(SYNC_ACTION).to.eql('@APP/REDUX_RAILS/SYNC');
  });

  it('should have a SYNCED_ACTION type', function () {
    expect(SYNCED_ACTION).to.eql('@APP/REDUX_RAILS/SYNCED');
  });

  it('should have prefixes for create and destroy actions', function () {
    expect(prefixes['CREATE_PREFIX']).to.eql('@APP/REDUX_RAILS/CREATE');
    expect(prefixes['REQUEST_CREATE_PREFIX']).to.eql('@APP/REDUX_RAILS/REQUEST_CREATE');
    expect(prefixes['SUCCESS_CREATE_PREFIX']).to.eql('@APP/REDUX_RAILS/SUCCESS_CREATE');
    expect(prefixes['FAILURE_CREATE_PREFIX']).to.eql('@APP/REDUX_RAILS/FAILURE_CREATE');
    expect(prefixes['DESTROY_PREFIX']).to.eql('@APP/REDUX_RAILS/DESTROY');
    expect(prefixes['REQUEST_DESTROY_PREFIX']).to.eql('@APP/REDUX_RAILS/REQUEST_DESTROY');
    expect(prefixes['SUCCESS_DESTROY_PREFIX']).to.eql('@APP/REDUX_RAILS/SUCCESS_DESTROY');
    expect(prefixes['FAILURE_DESTROY_PREFIX']).to.eql('@APP/REDUX_RAILS/FAILURE_DESTROY');
  });

  it('should have an actionType creator', function () {
    let key = 'activities';
    expect(actionType(prefixes['CREATE_PREFIX'], key)).to.eql('@APP/REDUX_RAILS/CREATE_ACTIVITY');
  });
});
