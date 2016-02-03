'use strick';

var expect = require('chai').expect,
    chai   = require('chai');

var rr = require('../src');
var Schema      = rr.Schema,
    OneToMany   = rr.OneToMany,
    ManyToOne   = rr.ManyToOne,
    update      = rr.update;

chai.config.truncateThreshold = 0;

describe('update', function () {
  var user = new Schema('users');
  var car  = new Schema('cars');
  user.hasMany(car, 'private_cars', 'owner');
  user.hasMany(user, 'employees', 'boss');
  var schemas = {
    users: user,
    cars: car
  };
  it('should ... just work !', function () {
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
      in_value: [ ['cars', -3, 'owner_id'], ['cars', 5, 'owner_id'], ['users', 2, 'boss_id'] ],
      in_list: []
    };

    var expected_result2 = {
      in_value: [ ['cars', -6, 'owner_id' ] ],
      in_list: [ ['users', -1, 'employees'] ]
    };
    expect(update('users', -1,  user, data)).to.eql(expected_result);
    expect(update('users', 2,   user, data)).to.eql(expected_result2);
  });
});
