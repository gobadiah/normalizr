'use strick';

var expect = require('chai').expect,
    chai   = require('chai');

var rr = require('../src');
var Schema        = rr.Schema,
    OneToMany     = rr.OneToMany,
    ManyToOne     = rr.ManyToOne,
    rootElements  = rr.rootElements;

chai.config.truncateThreshold = 0;

describe('rootElements', function () {
  var user = new Schema('users');
  var car  = new Schema('cars');
  user.hasMany(car, 'private_cars', 'owner');
  user.hasMany(user, 'employees', 'boss');
  var schemas = {
    users: user,
    cars: car
  };
  it('should find root elements using schemas', function () {
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

    var expected_result = [
      {
        id: -1,
        name: 'Bob',
        private_cars: [-3, 5],
        employees: [2]
      }
    ];

    expect(rootElements(data.users, user)).to.eql(expected_result);
    expect(rootElements(data.cars,  car)).to.eql([]);
  });
});

