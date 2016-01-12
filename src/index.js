import EntitySchema from './EntitySchema';
import IterableSchema from './IterableSchema';
import isObject from 'lodash/lang/isObject';
import isEqual from 'lodash/lang/isEqual';
import mapValues from 'lodash/object/mapValues';
import { OneToOne, OneToMany, ManyToOne } from './Relationships';
import { destroy } from './destroy';
import { update }  from './update';
import { denormalize } from './denormalize';
import middleware   from './middleware';
import idCompare    from './idCompare';
import _ from 'lodash';

export { EntitySchema as Schema };

export { OneToOne, OneToMany, ManyToOne, update, destroy, denormalize, middleware, idCompare };
export { SYNC_ACTION, SYNCED_ACTION } from './constants';
export { default as reducer } from './reducer';
export { prefixes } from './constants';
export { normalize, arrayOf, valuesOf } from './normalize';
