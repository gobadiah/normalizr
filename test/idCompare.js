var expect    = require('chai').expect;
var rr        = require('../src');
var idCompare = rr.idCompare;

describe('idCompare', function () {
  it('should order correctly', function () {
    var a = { id: 1, _id: -1 };
    var b = { id: 2, _id: -2 };
    var c = { id: -3, _id: -3 };
    var d = { id: 4 };
    var e = { id: 7 };
    expect(idCompare(a, b)).to.eql(-1);
    expect(idCompare(d, c)).to.eql(-1);
    expect(idCompare(d, e)).to.eql(-3);
    expect(idCompare(b, e)).to.eql(1);
  });
});
