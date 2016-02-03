import _ from 'lodash';
_.mixin(require('lodash-inflection'));

const PREFIX    = '@APP/REDUX_RAILS/';
const actions   = ['CREATE', 'DESTROY'];
const prefixes  = {};
for (let action of actions) {
  prefixes[action + '_PREFIX'] = PREFIX + action;
  prefixes['REQUEST_' + action + '_PREFIX'] = PREFIX + 'REQUEST_' + action;
  prefixes['SUCCESS_' + action + '_PREFIX'] = PREFIX + 'SUCCESS_' + action;
  prefixes['FAILURE_' + action + '_PREFIX'] = PREFIX + 'FAILURE_' + action;
}
export const SYNC_ACTION   = PREFIX + 'SYNC';
export const SYNCED_ACTION = PREFIX + 'SYNCED';

export const actionType = (prefix, key) => prefix + '_' + _.singularize(key).toUpperCase();

export { prefixes };
