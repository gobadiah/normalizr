import EntitySchema from './EntitySchema';
import IterableSchema from './IterableSchema';
import isObject from 'lodash/lang/isObject';
import isEqual from 'lodash/lang/isEqual';
import mapValues from 'lodash/object/mapValues';
import { OneToOne, OneToMany, ManyToOne } from './Relationships';

export function update(key, id, schema, bags, result = { in_list: [], in_value: [] }) {
  for (let prop in schema) {
    if (!schema.hasOwnProperty(prop)) {
      continue;
    }
    let relation = schema[prop];
    if (relation instanceof OneToMany) {
      let subkey      = relation.reverse().getKey();
      let field       = relation.getOne().field;
      let foreign_key = relation.reverse().getMany().foreign_key;
      let ids         = bags[key][id][field];
      for (let i of ids) {
        result.in_value.push([subkey, i, foreign_key]);
      }
    } else if (relation instanceof ManyToOne) {
      let subkey      = relation.reverse().getKey();
      let field       = relation.reverse().getOne().field;
      let foreign_key = relation.getMany().foreign_key;
      let i           = bags[key][id][foreign_key];
      if (i) {
        result.in_list.push([subkey, i, field]);
      }
    }
  }
  return result;
}
