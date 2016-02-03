'use strick';

var expect      = require('chai').expect,
    chai        = require('chai');

var rr = require('../src');
var Schema      = rr.Schema,
    OneToMany   = rr.OneToMany,
    ManyToOne   = rr.ManyToOne,
    denormalize = rr.denormalize;

chai.config.truncateThreshold = 0;

describe('denormalize', function () {
  var user = new Schema('users');
  var car  = new Schema('cars');
  user.hasMany(car, 'private_cars', 'owner');
  user.hasMany(user, 'employees', 'boss');
  var schemas = {
    users: user,
    cars: car
  };
  it('user should have a OneToMany relationship', function () {
    expect(user['private_cars']).to.be.an.instanceof(OneToMany);
  });

  it('car should have a ManyToOne relationship', function () {
    expect(car['owner']).to.be.an.instanceof(ManyToOne);
  });

  it('car ManyToOne should have a foreign_key', function () {
    expect(car['owner'].getForeignKey()).to.eql('owner_id');
  });

  it('should denormalize correctly', function () {
    var data = {
      users: {
        1: {
          id: 1,
          name: 'Bob',
          private_cars: [3, 5]
        },
        2: {
          id: 2,
          name: 'Arthur',
          private_cars: [6]
        }
      },
      cars: {
        3: {
          id: 3,
          brand: 'Peugeot',
          owner_id: 1,
        },
        5: {
          id: 5,
          brand: 'Renault',
          owner_id: 1
        },
        6: {
          id: 6,
          brand: 'Toyota',
          owner_id: 2
        }
      }
    };

    var expected_result = {
      users: [
        {
          id: 1,
          name: 'Bob',
          private_car_ids: [
            5,
            3
          ]
        },
        {
          id: 2,
          name: 'Arthur',
          private_car_ids: [
            6
          ]
        }
      ],
      cars: [
        {
          id: 5,
          brand: 'Renault',
          owner_id: 1
        },
        {
          id: 3,
          brand: 'Peugeot',
          owner_id: 1
        },
        {
          id: 6,
          brand: 'Toyota',
          owner_id: 2
        }
      ]
    };
    expect(denormalize(data, schemas)).to.eql(expected_result);
  });

  it('should denormalize with self one to many', function() {
    var data = {
      users: {
        1: {
          id: 1,
          name: 'Bob',
          employees: [2]
        },
        2: {
          id: 2,
          name: 'Arthur',
          boss_id: 1
        }
      }
    };

    var expected_result = {
      users: [
        {
          id: 2,
          name: 'Arthur',
          boss_id: 1
        },
        {
          id: 1,
          name: 'Bob',
          employee_ids: [2]
        }
      ]
    };
    expect(denormalize(data, schemas)).to.eql(expected_result);
  });

  it('should denormalize with only negative ids and self reference', function () {
    var data = {
      users: {
        '-1': {
          id: -1,
          name: 'Bob',
          employees: [-2]
        },
        '-2': {
          id: -2,
          name: 'Arthur',
          boss_id: -1
        }
      }
    };

    var expected_result = {
      users: [
        {
          name: 'Bob',
          employees_attributes: [
            {
              name: 'Arthur'
            }
          ]
        }
      ]
    };
    expect(denormalize(data, schemas)).to.eql(expected_result);
  });

  it('should throw when id is not in entitites', function () {
    var data = {
      users: {
        1: {
          name: 'Bob'
        }
      }
    };
    var result = {};
    expect(function () {denormalize(data, schemas)}).to.throw(Error);
  });

  it('should denormalize with multiple relations and positive and negative ids', function () {
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
      users: [
        {
          id: 2,
          name: 'Arthur',
          private_cars_attributes: [
            {
              brand: 'Toyota',
              owner_id: 2
            }
          ]
        },
        {
          name: 'Bob',
          private_car_ids: [
            5
          ],
          private_cars_attributes: [
            {
              brand: 'Peugeot'
            }
          ],
          employee_ids: [
            2
          ]
        },
      ],
      cars: [
        {
          id: 5,
          brand: 'Renault',
        }
      ]
    };
    expect(denormalize(data, schemas)).to.eql(expected_result);
  });
});
