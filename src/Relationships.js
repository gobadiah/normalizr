import isObject from 'lodash/lang/isObject';
import IterableSchema from './IterableSchema';

export class OneToOne {
  constructor(one, second, arg) {
    this._one = one;
    this._second = second;
    if (arg instanceof OneToOne) {
      this._reverse = arg;
    } else {
      this._reverse = new OneToOne(second, one, this);
    }
  }

  getSchema() {
    return this._one.schema;
  }
};

export class ManyToOne {
  constructor(many, one, reverse) {
    this._many = many;
    this._one  = one;
    this._reverse = reverse;
  }

  getMany() {
    return this._many;
  }

  getSchema() {
    this._many.schema;
  }

  reverse() {
    return this._reverse;
  }
};

export class OneToMany {
  constructor(one, many, options = {}) {
    this._one = one;
    this._many = many;
    this._reverse = new ManyToOne(many, one, this);
  }

  getOne() {
    return this._one;
  }

  getKey() {
    return this._one.iterable.getItemSchema().getKey();
  }

  getIterableSchema() {
    return this._one.iterable;
  }

  reverse() {
    return this._reverse;
  }
};
