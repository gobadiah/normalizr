import _ from 'lodash';
_.mixin(require('lodash-inflection'));
import { fromJS } from 'immutable';

import { denormalize } from './denormalize';

const getNewId = collection => {
  return Math.min(...collection.keySeq().toArray(), 0) - 1;
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

export default (schemas) => {
  const regex = _.mapValues(prefixes, (value) => new RegExp(value));
  return store => next => action => {
    if (regex.CREATE_PREFIX.test(action.type)) {
      let newId = getNewId(store.getState().app.get('entities').get(action.meta.key));
      action.meta.id = newId;
      if (global.INTERNET) {
        store.dispatch(Object.assign({}, action, { type: actionType(prefixes.REQUEST_CREATE_PREFIX, action.meta.key) }));
      }
    } else if (regex.REQUEST_CREATE_PREFIX.test(action.type)) {
      const post_hook = _.cloneDeep(action.meta.post_hook);
      delete action.payload._id;
      fetch('/api/' + action.meta.key, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [_.singularize(action.meta.key)]: action.payload }),
        credentials: 'same-origin'
      })
      .then((res) =>  res.json())
      .then((json) => store.dispatch({
        type: actionType(prefixes.SUCCESS_CREATE_PREFIX, action.meta.key),
        payload: json,
        meta: {
          key: action.meta.key,
          old_id: action.meta.id,
          post_hook
        }
      }))
      .catch((ex) => {
        console.log('failure');
        console.log(ex);
        store.dispatch({
          type: actionType(prefixes.FAILURE_CREATE_PREFIX, action.meta.key),
          payload: ex,
          error: true
        })
      });
      delete action.meta.post_hook;
    } else if (regex.DESTROY_PREFIX.test(action.type)) {
      let id = action.payload;
      action.payload = destroy(action.meta.key, id, schemas[action.meta.key], store.getState().app.get('entities').toJS());
      if (global.INTERNET) {
        fetch('/api/' + action.meta.key + '/', {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ [action.meta.key]: action.payload.cascade[action.meta.key] })
        })
        .then(res => {
          console.log(res);
          store.dispatch(Object.assign({}, action, { type: actionType(prefixes.SUCCESS_DESTROY_PREFIX, action.meta.key) }));
        })
        .catch(ex => {
          console.log(ex);
          store.dispatch({
            type: actionType(prefixes.FAILURE_DESTROY_PREFIX, action.meta.key),
            payload: ex,
            error: true
          });
        });
      }
    } else if (action.type === SYNC_ACTION) {
      for (let key in schemas) {
        if (!schemas.hasOwnProperty(key)) {
          continue;
        }
        let elements = store.getState().app.getIn(['entities', key]).toJS();
        let root = rootElements(_.values(elements), schemas[key]);
        if (root.length == 0) {
        }
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
                    pass: state => {
                      return !state.app.getIn(['entities', key]).find(element => to_update_ids.includes(element.get('id')));
                    }
                  }
                }
              }
            });
          }
        }
        if (to_update.length == 0) {
          console.log('global update for ' + key);
          console.log(store.getState().app.get('entities'));
          let bags = store.getState().app.get('entities').toJS();
          console.log(bags);
          let result = {};
          for (let element of root) {
            denormalize(key, element.id, schemas[key], bags, result);
          }
          fetch('/api/' + key + '/sync/', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [key]: result }),
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
          })
          .catch(ex  => {
            console.log(ex);
          });
          return;
        }
      }
    }
    let result = next(action);
    if (action && action.meta && action.meta.post_hook && action.meta.post_hook.meta.count < 5 && (!action.meta.post_hook.meta.pass || action.meta.post_hook.meta.pass(store.getState()))) {
      console.log('Post hook');
      store.dispatch(Object.assign({}, action.meta.post_hook, { meta: { count: action.meta.post_hook.meta.count } }));
    }
    return result;
  }
};
