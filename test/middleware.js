var expect = require('chai').expect;
var rr     = require('../src');
var Schema = rr.Schema,
    createMiddleware = rr.middleware;

describe('middleware', function () {
  var user = new Schema('users');
  var car  = new Schema('cars');
  user.hasMany(car, 'private_cars', 'owner');
  user.hasMany(user, 'employees', 'boss');
  var schemas = {
    users: user,
    cars: car
  };
  var middleware = createMiddleware(schemas);

});
