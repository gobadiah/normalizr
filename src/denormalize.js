import { OneToMany, ManyToOne } from './Relationships';
import rootElements from './rootElements';
import _ from 'lodash';
_.mixin(require('lodash-inflection'));

export function _denormalize(key, id, schema, bags, query = {}, n = 0) {
  let result = _.clone(bags[key][id]);
  if (!query.hasOwnProperty(key)) {
    query[key] = [];
  }
  if (!result.hasOwnProperty('id')) {
    throw new Error('id property is missing');
  }
  if (result.hasOwnProperty('id') && result.id < 0) {
    delete result.id;
  }
  delete result._id;
  for (let prop in schema) {
    if (!schema.hasOwnProperty(prop)) {
      continue;
    }
    let relation = schema[prop];
    if (relation instanceof OneToMany) {
      let subkey      = relation.reverse().getKey();
      let field       = relation.getOne().field;
      if (!bags[key][id].hasOwnProperty(field)) {
        continue;
      }
      let ids         = bags[key][id][field];
      let ItemSchema  = relation.getIterableSchema().getItemSchema();
      delete result[field];
      let field_ids   = _.singularize(field) + '_ids';
      let field_attr  = field + '_attributes';
      ids.sort((a, b) => b - a);
      for (let i of ids) {
        if (i > 0) {
          if (result[field_ids] == undefined) {
            result[field_ids] = [];
          }
          result[field_ids].push(i);
          _denormalize(subkey, i, ItemSchema, bags, query, n + 1);
        } else {
          if (result[field_attr] == undefined) {
            result[field_attr] = [];
          }
          result[field_attr].push(_denormalize(subkey, i, ItemSchema, bags, query, n + 1));
        }
      }
    } else if (relation instanceof ManyToOne) {
      let foreign_key = relation.getMany().foreign_key;
      if (result.hasOwnProperty(foreign_key) && result[foreign_key] < 0) {
        delete result[foreign_key];
      }
    }
  }
  if (parseInt(id) > 0 || n == 0) {
    query[key].push(result);
  }
  return result;
}

export function denormalize(bags, schemas) {
  let result = {};
  for (let key in bags) {
    if (!bags.hasOwnProperty(key)) {
      continue;
    }
    let schema = schemas[key];
    let root   = rootElements(bags[key], schema);
    for (let element of root) {
      _denormalize(key, element.id, schema, bags, result);
    }
  }
  return result;
}

