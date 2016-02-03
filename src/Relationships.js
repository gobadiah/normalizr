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
}

export class ManyToOne {
  constructor(many, one, reverse) {
    this._many = many;
    this._one  = one;
    this._reverse = reverse;
    if (this._many && 'field' in this._many && !('foreign_key' in this._many)) {
      this._many['foreign_key'] = this._many['field'] + '_id';
    }
  }

  getKey() {
    return this._one.iterable.getItemSchema().getKey();
  }

  getMany() {
    return this._many;
  }

  getForeignKey() {
    return this._many.foreign_key;
  }

  getField() {
    return this._many.field;
  }

  getSchema() {
    this._many.schema;
  }

  reverse() {
    return this._reverse;
  }
}

export class OneToMany {
  constructor(one, many) {
    this._one = one;
    this._many = many;
    this._reverse = new ManyToOne(many, one, this);
  }

  getOne() {
    return this._one;
  }

  getKey() {
    return this._many.schema.getKey();
  }

  getField() {
    return this._one.field;
  }

  getIterableSchema() {
    return this._one.iterable;
  }

  reverse() {
    return this._reverse;
  }
}
