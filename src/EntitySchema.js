import { arrayOf } from './normalize';
import IterableSchema from './IterableSchema';
import { OneToOne, OneToMany } from './Relationships';

export default class EntitySchema {
  constructor(key, options = {}) {
    if (!key || typeof key !== 'string') {
      throw new Error('A string non-empty key is required');
    }

    this._key = key;

    const idAttribute = options.idAttribute || 'id';
    this._getId = typeof idAttribute === 'function' ? idAttribute : x => x[idAttribute];
  }

  getKey() {
    return this._key;
  }

  getId(entity) {
    return this._getId(entity);
  }

  define(nestedSchema) {
    for (let key in nestedSchema) {
      if (nestedSchema.hasOwnProperty(key)) {
        if (nestedSchema[key] instanceof EntitySchema) {
          this[key] = new OneToOne({ schema: nestedSchema[key] });
        } else if (nestedSchema[key] instanceof IterableSchema) {
          this[key] = new OneToMany({ iterable: nestedSchema[key], key });
        } else {
          this[key] = nestedSchema[key];
        }
      }
    }
  }

  hasMany(schema, field, inverseOf) {
    this[field] = new OneToMany({ iterable: arrayOf(schema), field },
                              { schema: this, field: inverseOf });
    schema.define({
      [inverseOf]: this[field].reverse()
    });
    return this;
  }
}
