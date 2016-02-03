import _             from 'lodash';
import { ManyToOne } from './Relationships';

export default (elements, schema) => {
  const parent_keys = [];
  for (let key in schema) {
    if (!schema.hasOwnProperty(key)) {
      continue;
    }
    let relation = schema[key];
    if (relation instanceof ManyToOne) {
      let foreign_key = relation.getMany().foreign_key;
      parent_keys.push(foreign_key);
    }
  }
  return _.filter(elements, element => _.reduce(parent_keys, (val, key) => val && element[key] == null, true));
};
