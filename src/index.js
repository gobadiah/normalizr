import EntitySchema     from './EntitySchema';
import { OneToMany, ManyToOne }
                        from './Relationships';
import { destroy }      from './destroy';
import { update }       from './update';
import { denormalize }  from './denormalize';
import middleware       from './middleware';
import idCompare        from './idCompare';
import rootElements     from './rootElements';

export { EntitySchema as Schema };

export { OneToMany, ManyToOne, update, destroy, denormalize, middleware, idCompare, rootElements };
export { SYNC_ACTION, SYNCED_ACTION, actionType, prefixes } from './constants';
export { default as actionsCreator } from './actions';
export { default as reducer } from './reducer';
export { normalize, arrayOf, valuesOf } from './normalize';
