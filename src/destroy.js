import { OneToMany, ManyToOne } from './Relationships';

export function destroy(key, id, schema, bags, result = { cascade: {}, to_update: [] }) {
  if (!result.cascade.hasOwnProperty(key)) {
    result.cascade[key] = [];
  }
  if (result.cascade[key].indexOf(id) >= 0) {
    return;
  }
  result.cascade[key].push(id);
  for (let prop in schema) {
    if (!schema.hasOwnProperty(prop)) {
      continue;
    }
    let relation = schema[prop];
    if (relation instanceof OneToMany) {
      let ItemSchema = relation.getIterableSchema().getItemSchema();
      let subkey     = relation.getIterableSchema().getItemSchema().getKey();
      let field      = relation.getOne().field;
      if (!bags[key][id].hasOwnProperty(field)) {
        continue;
      }
      let ids        = bags[key][id][field];
      for (let i of ids) {
        destroy(subkey, i, ItemSchema, bags, result);
      }
    } else if (relation instanceof ManyToOne) {
      let subkey      = relation.reverse().getKey();
      let field       = relation.reverse().getOne().field;
      let foreign_key = relation.getMany().foreign_key;
      if (!bags[key][id].hasOwnProperty(foreign_key)) {
        continue;
      }
      let i           = bags[key][id][foreign_key];
      if (i != undefined && i != null && (!result.cascade.hasOwnProperty(subkey) || result.cascade[subkey].indexOf(i) == -1)) {
        result.to_update.push({ path: [subkey, bags[key][id][relation.getMany().foreign_key], field], id });
      }
    }
  }
  return result;
}
