import _ from 'lodash';
_.mixin(require('lodash-inflection'));

import { denormalize } from './denormalize';

const getNewId = collection => {
  let newId = Math.min(...collection.keySeq().toArray(), 0) - 1;
  return newId;
};

import { normalize, arrayOf } from './normalize';
import { destroy } from './destroy';

import {
  prefixes,
  actionType,
  SYNC_ACTION,
  SYNCED_ACTION
} from './constants';
import rootElements from './rootElements';

function HttpError(message, payload) {
  this.name = 'HttpError';
  this.message = message;
  this.payload = payload;
}

HttpError.prototype = Object.create(Error.prototype);
HttpError.prototype.constructor = HttpError;

export default (schemas, toEntities = (store) => store.getState().app.get('entities'), api = false) => {
  const regex = _.mapValues(prefixes, (value) => new RegExp(value));
  return store => next => action => {
    if (regex.CREATE_PREFIX.test(action.type)) {
      let newId = getNewId(toEntities(store).get(action.meta.key));
      action.meta.id = newId;
      if (api) {
        store.dispatch(Object.assign({}, action, { type: actionType(prefixes.REQUEST_CREATE_PREFIX, action.meta.key) }));
      }
    } else if (regex.REQUEST_CREATE_PREFIX.test(action.type)) {
      const post_hook = _.cloneDeep(action.meta.post_hook);
      delete action.payload._id;
      if (action.payload.id && action.payload.id < 0) {
        delete action.payload.id;
      }
      fetch('/api/' + action.meta.key, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [_.singularize(action.meta.key)]: action.payload }),
        credentials: 'same-origin'
      })
      .then((res) => {
        if (!res.ok) {
          throw new HttpError(res.statusText, {
            code: res.status,
            error: res.statusText
          });
        }
        return res.json();
      }).then((json) => store.dispatch({
        type: actionType(prefixes.SUCCESS_CREATE_PREFIX, action.meta.key),
        payload: json,
        meta: {
          key: action.meta.key,
          old_id: action.meta.id,
          post_hook
        }
      }))
      .catch((ex) => {
        let payload = ex;
        if (payload in ex) {
          payload = ex.payload;
        }
        store.dispatch({
          type: actionType(prefixes.FAILURE_CREATE_PREFIX, action.meta.key),
          payload,
          error: true,
          meta: {
            key: action.meta.key,
            old_id: action.meta.old_id,
            post_hook: undefined
          }
        })
      });
      delete action.meta.post_hook;
    } else if (regex.DESTROY_PREFIX.test(action.type) && api) {
      let id = action.payload;
      action.payload = destroy(action.meta.key, id, schemas[action.meta.key], toEntities(store).toJS());
      fetch('/api/' + action.meta.key + '/', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [action.meta.key]: action.payload.cascade[action.meta.key] })
      })
      .then(() => {
        store.dispatch(Object.assign({}, action, { type: actionType(prefixes.SUCCESS_DESTROY_PREFIX, action.meta.key) }));
      })
      .catch(ex => {
        store.dispatch({
          type: actionType(prefixes.FAILURE_DESTROY_PREFIX, action.meta.key),
          payload: ex,
          error: true
        });
      });
    } else if (action.type === SYNC_ACTION) {
      let bags = toEntities(store).toJS();
      let denormalized = denormalize(bags, schemas);
      for (let key in schemas) {
        if (!schemas.hasOwnProperty(key)) {
          continue;
        }
        let elements = toEntities(store).get(key).toJS();
        let root = rootElements(_.values(elements), schemas[key]);
        let to_update = [];
        let to_update_ids = [];
        for (let el of root) {
          if (el.id > 0) {
            continue;
          }
          to_update.push(el);
          to_update_ids.push(el.id);
        }
        if (to_update.length > 0) {
          for (let el of to_update) {
            store.dispatch({
              type: actionType(prefixes.REQUEST_CREATE_PREFIX, key),
              payload: el,
              meta: {
                key,
                id: el.id,
                post_hook: {
                  type: SYNC_ACTION,
                  meta: {
                    count: action.meta ? action.meta.count || 1 : 1,
                    pass: () => {
                      return !toEntities(store).get(key).find(element => to_update_ids.indexOf(element.get('id')) >= 0);
                    }
                  }
                }
              }
            });
          }
        }
        if (to_update.length == 0) {
          fetch('/api/' + key + '/sync/', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [key]: denormalized[key] }),
            credentials: 'same-origin'
          })
          .then(res  => res.json())
          .then(json => {
            let normalized = normalize(json, { [key]: arrayOf(schemas[key]) });
            if (!normalized.entities.hasOwnProperty(key)) {
              normalized.entities[key] = {};
            }
            store.dispatch({
              type: SYNCED_ACTION,
              payload: normalized
            });
          });
          return;
        }
      }
    }
    let result = next(action);
    if (action && action.meta && action.meta.post_hook && action.meta.post_hook.meta.count < 5 && (!action.meta.post_hook.meta.pass || action.meta.post_hook.meta.pass(store.getState()))) {
      store.dispatch(Object.assign({}, action.meta.post_hook, { meta: { count: action.meta.post_hook.meta.count } }));
    }
    return result;
  }
};
