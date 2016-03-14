import { Map, fromJS } from 'immutable';

import _ from 'lodash';

import update from './update';

import { OneToMany, ManyToOne } from './Relationships';

import { prefixes, SYNCED_ACTION } from './constants';

export default schemas => {
  const regex = _.mapValues(prefixes, (value) => new RegExp(value));
  let initialState = Map();
  for (let key in schemas) {
    initialState = initialState.set(key, Map());
  }
  return (state = initialState, action) => {
    for (let key in schemas) {
      if (!state.has(key)) {
        state = state.set(key, Map());
      }
    }
    if (regex.CREATE_PREFIX.test(action.type)) {
      let schema = schemas[action.meta.key];
      for (let key in schema) {
        if (!schema.hasOwnProperty(key)) {
          continue;
        }
        if (schema[key] instanceof ManyToOne) {
          let foreign_key = schema[key].getMany().foreign_key;
          if (!action.payload.hasOwnProperty(foreign_key) ||
              action.payload[foreign_key] === undefined   ||
              action.payload[foreign_key] === null) {
            continue;
          }
          let id    = action.payload[foreign_key];
          let field = schema[key].reverse().getOne().field;
          let path  = schema[key].reverse().getKey();
          if (!id) {
            continue;
          } else if (!state.hasIn([path, id])) {
            return state;
          }
          state = state.updateIn([path, id], map => map.update(field, list => list.push(action.meta.id)));
        }
      }
      return state.updateIn([action.meta.key], map => map.set(action.meta.id, fromJS(Object.assign(action.payload, { _id: action.meta.id, id: action.meta.id }))));
    } else if (regex.SUCCESS_CREATE_PREFIX.test(action.type)) {
      let bags   = state.toJS();
      let newId  = action.payload.id;
      if (typeof(newId) !== 'number') {
        return state;
      }
      let oldId  = action.meta.old_id;
      let schema = schemas[action.meta.key];
      let ignore = [];
      for (let key in schema) {
        if (!schema.hasOwnProperty(key)) {
          continue;
        }
        if (schema[key] instanceof OneToMany) {
          let field = schema[key].getOne().field;
          ignore.push(field);
        }
      }
      state     = state.updateIn([action.meta.key, action.meta.old_id], map => map.mergeWith((prev, next, key) => ignore.indexOf(key) >= 0 ? prev : next, fromJS(action.payload)));
      if (newId != oldId) {
        let result  = update(action.meta.key, action.meta.old_id, schemas[action.meta.key], bags);
        for (let path of result.in_list) {
          state = state.updateIn(path, list => list.map(val => (val == oldId) ? newId : val));
        }
        for (let path of result.in_value) {
          state = state.updateIn(path, () => newId);
        }
        state   = state.updateIn([action.meta.key], map => map.set(newId, map.get(oldId)).delete(oldId));
      }
      return state;
    } else if (regex.DESTROY_PREFIX.test(action.type)) {
      for (let key in action.payload.cascade) {
        for (let id of action.payload.cascade[key]) {
          state = state.updateIn([key, id], map => map.set('_destroy', 1));
        }
      }
      return state;
    } else if (regex.SUCCESS_DESTROY_PREFIX.test(action.type)) {
      for (let key in action.payload.cascade) {
        state = state.updateIn([key], map => map.filter((v, k) => action.payload.cascade[key].indexOf(k) == -1));
      }
      for (let modif of action.payload.to_update) {
        if (state.hasIn(modif.path)) {
          state = state.updateIn(modif.path, list => list.filter(val => val != modif.id));
        }
      }
      return state;
    } else if (regex.UPDATE_PREFIX.test(action.type)) {
      let id = action.payload.id;
      if (!id) {
        return state;
      }
      return state.updateIn([action.meta.key, id], map => map.merge(fromJS(action.payload)));
    } else if (action.type == SYNCED_ACTION) {
      for (let key in action.payload.entities) {
        state = state.updateIn([key],   () => Map());
        for (let id in action.payload.entities[key]) {
          state = state.updateIn([key], map => map.set(parseInt(id), fromJS(action.payload.entities[key][id])));
        }
      }
      return state;
    } else {
      return state;
    }
  }
};

