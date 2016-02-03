'use strick';

var expect = require('chai').expect,
    chai   = require('chai');

var rr = require('../src');
var Schema      = rr.Schema,
    OneToMany   = rr.OneToMany,
    ManyToOne   = rr.ManyToOne,
    destroy     = rr.destroy;

chai.config.truncateThreshold = 0;

describe('destroy', function () {
  var user = new Schema('users');
  var car  = new Schema('cars');
  user.hasMany(car, 'private_cars', 'owner');
  user.hasMany(user, 'employees', 'boss');
  var schemas = {
    users: user,
    cars: car
  };
  it('should destroy all data', function () {
    var data = {
      users: {
        '-1': {
          id: -1,
          name: 'Bob',
          private_cars: [-3, 5],
          employees: [2]
        },
        2: {
          id: 2,
          name: 'Arthur',
          private_cars: [-6],
          boss_id: -1
        }
      },
      cars: {
        '-3': {
          id: -3,
          brand: 'Peugeot',
          owner_id: -1,
        },
        5: {
          id: 5,
          brand: 'Renault',
          owner_id: -1
        },
        '-6': {
          id: -6,
          brand: 'Toyota',
          owner_id: 2
        }
      }
    };

    var expected_result = {
      cascade: {
        users: [-1, 2],
        cars: [-3, 5, -6]
      },
      to_update: []
    };

    expect(destroy('users', -1, user, data)).to.eql(expected_result);
  });

  it('should destroy some data, update some', function () {
    var data = {
      users: {
        '-1': {
          id: -1,
          name: 'Bob',
          private_cars: [-3, 5],
          employees: [2]
        },
        2: {
          id: 2,
          name: 'Arthur',
          private_cars: [-6],
          boss_id: -1
        }
      },
      cars: {
        '-3': {
          id: -3,
          brand: 'Peugeot',
          owner_id: -1,
        },
        5: {
          id: 5,
          brand: 'Renault',
          owner_id: -1
        },
        '-6': {
          id: -6,
          brand: 'Toyota',
          owner_id: 2
        }
      }
    };

    var expected_result = {
      cascade: {
        users: [2],
        cars: [-6]
      },
      to_update: [ { path: ['users', -1, 'employees'], id: 2 } ]
    };

    expect(destroy('users', 2, user, data)).to.eql(expected_result);
  });
});
