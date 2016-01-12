import EntitySchema from './EntitySchema';
import IterableSchema from './IterableSchema';
import isObject from 'lodash/lang/isObject';
import isEqual from 'lodash/lang/isEqual';
import mapValues from 'lodash/object/mapValues';
import { OneToOne, OneToMany, ManyToOne } from './Relationships';
import { destroy } from './destroy';
import { update }  from './update';
import _ from 'lodash';
_.mixin(require('lodash-inflection'));

export function denormalize(key, id, schema, bags, query = {}, n = 0) {
  let result = _.clone(bags[key][id]);
  let prefix = _.padRight('>', n * 4);
  console.log(prefix +'denormalize ' + key + ' ' + id);
  if (result.id < 0) {
    delete result.id;
  }
  delete result._id;
  for (let prop in schema) {
    if (!schema.hasOwnProperty(prop)) {
      continue;
    }
    let relation = schema[prop];
    if (relation instanceof OneToMany) {
      let subkey      = relation.getKey();
      let field       = relation.getOne().field;
      let ids         = bags[key][id][field];
      console.log(bags);
      console.log(key);
      console.log(id);
      console.log(field);
      console.log(typeof(ids));
      console.log(ids);
      let ItemSchema  = relation.getIterableSchema().getItemSchema();
      delete result[field];
      let field_ids   = _.singularize(field) + '_ids';
      let field_attr  = field + '_attributes';
      ids.sort((a, b) => b - a);
      for (let i of ids) {
        if (i > 0) { // && !bags[subkey][i].hasOwnProperty('_destroy')) {
          if (result[field_ids] == undefined) {
            result[field_ids] = [];
          }
          console.log(prefix +i + ' > 0 , setting query ...');
          result[field_ids].push(i);
          denormalize(subkey, i, ItemSchema, bags, query, n + 1);
          console.log(prefix +'done');
          console.log(_.cloneDeep(query));
        } else {
          if (result[field_attr] == undefined) {
            result[field_attr] = [];
          }
          result[field_attr].push(denormalize(subkey, i, ItemSchema, bags, query, n + 1));
        }
      }
    } else if (relation instanceof ManyToOne) {
      let foreign_key = relation.getMany().foreign_key;
      if (result[foreign_key] < 0) {
        delete result[foreign_key];
      }
    }
  }
  if (id > 0) { // && (!result.hasOwnProperty('_destroy') || n == 0)) {
    query[id] = result;
  }
  return result;
}
