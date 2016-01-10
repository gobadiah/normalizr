import EntitySchema from './EntitySchema';
import IterableSchema from './IterableSchema';
import isObject from 'lodash/lang/isObject';
import isEqual from 'lodash/lang/isEqual';
import mapValues from 'lodash/object/mapValues';
import { OneToOne, OneToMany, ManyToOne } from './Relationships';

export function destroy(key, id, schema, bags, result = { cascade: {}, to_update: [] }) {
  if (!result.cascade.hasOwnProperty(key)) {
    result.cascade[key] = [];
  }
  if (result.cascade[key].includes(id)) {
    return;
  }
  result.cascade[key].push(id);
  for (let prop in schema) {
    if (!schema.hasOwnProperty(prop)) {
      continue;
    };
    let relation = schema[prop];
    if (relation instanceof OneToMany) {
      let ItemSchema = relation.getIterableSchema().getItemSchema();
      let subkey     = relation.getIterableSchema().getItemSchema().getKey();
      let ids        = bags[key][id][relation.getOne().field];
      for (let i of ids) {
        destroy(subkey, i, ItemSchema, bags, result);
      }
    } else if (relation instanceof ManyToOne) {
      let subkey  = relation.reverse().getKey();
      let field   = relation.reverse().getOne().field;
      let i       = bags[key][id][relation.getMany().foreign_key];
      if (i != undefined || i != null) {
        result.to_update.push({ path: [subkey, bags[key][id][relation.getMany().foreign_key], field], id });
      }
    }
  }
  return result;
}
